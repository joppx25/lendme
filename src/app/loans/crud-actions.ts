'use server';

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { LoanType, LoanStatus, loans, Prisma } from "@prisma/client";
import { 
  calculateSimpleInterestLoan, 
  generateLoanNumber, 
  getInterestRateByType,
  getMaxAmountByType,
  getMaxTermByType
} from "@/lib/loanUtils";
import { User } from "@/store/authStore";

// Schema for creating a loan (by superadmin/manager for any user)
const createLoanSchema = z.object({
  borrowerId: z.string().min(1, "Borrower must be selected"),
  loanType: z.nativeEnum(LoanType),
  principalAmount: z.string().transform((val) => parseFloat(val)).pipe(
    z.number().positive("Amount must be positive").min(1000, "Minimum loan amount is ₱1,000")
  ),
  termMonths: z.string().transform((val) => parseInt(val)).pipe(
    z.number().positive("Term must be positive").min(1, "Minimum term is 1 month").max(60, "Maximum term is 60 months")
  ),
  purpose: z.string().min(10, "Purpose must be at least 10 characters").max(500, "Purpose too long"),
  collateral: z.string().optional(),
  autoApprove: z.string().nullable().transform(val => val === 'true'),
});

// Schema for updating a loan
const updateLoanSchema = z.object({
  loanId: z.string(),
  loanType: z.nativeEnum(LoanType).optional(),
  principalAmount: z.string().transform((val) => parseFloat(val)).pipe(
    z.number().positive("Amount must be positive").min(1000, "Minimum loan amount is ₱1,000")
  ).optional(),
  termMonths: z.string().transform((val) => parseInt(val)).pipe(
    z.number().positive("Term must be positive").min(1, "Minimum term is 1 month").max(60, "Maximum term is 60 months")
  ).optional(),
  purpose: z.string().min(10, "Purpose must be at least 10 characters").max(500, "Purpose too long").optional(),
  collateral: z.string().optional(),
  status: z.nativeEnum(LoanStatus).optional(),
});

// Helper function to check if user can manage a specific loan
async function canManageLoan(currentUser: User, loan: loans): Promise<boolean> {
  // Superadmin can manage all loans
  if (currentUser.role === 'SUPERADMIN') {
    return true;
  }
  
  // Manager can manage loans but not for superadmin users
  if (currentUser.role === 'MANAGER') {
    // Check if the borrower is a superadmin
    const borrower = await prisma.users.findUnique({
      where: { id: loan.borrowerId },
      select: { role: true }
    });
    
    if (borrower?.role === 'SUPERADMIN') {
      return false; // Manager cannot manage superadmin loans
    }
    
    return true;
  }
  
  return false;
}

interface CreateLoanState {
  success: boolean;
  message?: string;
  errors?: {
    borrowerId?: string[];
  };
}

export async function createLoanForUser(state: CreateLoanState, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: "Unauthorized access. Only managers and superadmins can create loans.",
      };
    }

    const validatedFields = createLoanSchema.safeParse({
      borrowerId: formData.get('borrowerId'),
      loanType: formData.get('loanType'),
      principalAmount: formData.get('principalAmount'),
      termMonths: formData.get('termMonths'),
      purpose: formData.get('purpose'),
      collateral: formData.get('collateral'),
      autoApprove: formData.get('autoApprove') ? formData.get('autoApprove') === 'true' : 'false',
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { borrowerId, loanType, principalAmount, termMonths, purpose, collateral, autoApprove } = validatedFields.data;

    // Get borrower details
    const borrower = await prisma.users.findUnique({
      where: { id: borrowerId },
      select: { id: true, name: true, email: true, role: true, status: true }
    });

    if (!borrower) {
      return {
        success: false,
        message: "Selected borrower not found",
      };
    }

    if (borrower.status !== 'ACTIVE') {
      return {
        success: false,
        message: "Cannot create loan for inactive user",
      };
    }

    // Check role-based access: Manager cannot create loans for superadmin
    if (currentUser.role === 'MANAGER' && borrower.role === 'SUPERADMIN') {
      return {
        success: false,
        message: "Managers cannot create loans for superadmin users",
      };
    }

    // Validate amount and term limits for loan type
    const maxAmount = getMaxAmountByType(loanType);
    const maxTerm = getMaxTermByType(loanType);

    if (principalAmount > maxAmount) {
      return {
        success: false,
        errors: {
          principalAmount: [`Maximum amount for ${loanType} loan is ₱${maxAmount.toLocaleString()}`],
        },
      };
    }

    if (termMonths > maxTerm) {
      return {
        success: false,
        errors: {
          termMonths: [`Maximum term for ${loanType} loan is ${maxTerm} months`],
        },
      };
    }

    // Check if user has any pending or active loans
    const existingLoans = await prisma.loans.findMany({
      where: {
        borrowerId: borrowerId,
        status: {
          in: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE']
        }
      }
    });

    if (existingLoans.length > 0) {
      return {
        success: false,
        message: `${borrower.name} already has an active or pending loan application`,
      };
    }

    // Calculate loan details
    const interestRate = getInterestRateByType(loanType);
    const loanCalc = calculateSimpleInterestLoan(principalAmount, interestRate, termMonths);
    const monthlyPayment = loanCalc.monthlyPayment;
    const totalAmount = loanCalc.totalAmount;
    const loanNumber = await generateLoanNumber();

    // Create the loan
    const newLoan = await prisma.loans.create({
      data: {
        loanNumber,
        borrowerId,
        loanType,
        principalAmount,
        interestRate,
        termMonths,
        monthlyPayment,
        totalAmount,
        remainingBalance: totalAmount,
        status: autoApprove ? LoanStatus.APPROVED : LoanStatus.PENDING,
        purpose,
        collateral: collateral || null,
        approverId: autoApprove ? currentUser.id : null,
        approvedAt: autoApprove ? new Date() : null,
        startDate: autoApprove ? new Date() : null,
        endDate: autoApprove ? new Date(Date.now() + termMonths * 30 * 24 * 60 * 60 * 1000) : null,
      },
    });

    // If auto-approved, update fund balance and create payment schedule
    if (autoApprove) {
      const fundBalance = await prisma.fundBalance.findFirst();
      
      if (!fundBalance || fundBalance.availableFunds.toNumber() < principalAmount) {
        // If insufficient funds, set to pending instead
        await prisma.loans.update({
          where: { id: newLoan.id },
          data: {
            status: LoanStatus.PENDING,
            approverId: null,
            approvedAt: null,
            startDate: null,
            endDate: null,
          },
        });
        
        return {
          success: true,
          message: `Loan created for ${borrower.name} but set to pending due to insufficient funds`,
        };
      }

      // Update fund balance
      await prisma.fundBalance.update({
        where: { id: fundBalance.id },
        data: {
          availableFunds: { decrement: principalAmount },
          loanedFunds: { increment: principalAmount },
          lastUpdated: new Date(),
        },
      });

      // Create payment schedule
      const startDate = new Date();
      for (let i = 1; i <= termMonths; i++) {
        const scheduledDate = new Date(startDate);
        scheduledDate.setMonth(scheduledDate.getMonth() + i);

        await prisma.loanPayments.create({
          data: {
            loanId: newLoan.id,
            payerId: borrowerId,
            paymentNumber: i,
            scheduledAmount: monthlyPayment,
            paidAmount: 0,
            principalPaid: 0,
            interestPaid: 0,
            scheduledDate,
            status: 'PENDING',
          },
        });
      }

      await prisma.loans.update({
        where: { id: newLoan.id },
        data: { status: LoanStatus.ACTIVE },
      });
    }

    revalidatePath('/loans');
    return {
      success: true,
      message: `Loan ${newLoan.loanNumber} created successfully for ${borrower.name}${autoApprove ? ' and approved' : ''}`,
    };

  } catch (error) {
    console.error('Loan creation error:', error);
    return {
      success: false,
      message: "Failed to create loan",
    };
  }
}

interface UpdateLoanState {
  success: boolean;
  message?: string;
  errors?: {
    loanId?: string[];
  };
}

interface UpdateLoanPayload {
  borrowerId?: string;
  loanType?: LoanType;
  purpose?: string;
  collateral?: string;
  principalAmount?: number;
  termMonths?: number;
  interestRate?: number;
  status?: LoanStatus;
  monthlyPayment?: number;
  totalAmount?: number;
  remainingBalance?: number;
}

export async function updateLoan(state: UpdateLoanState, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: "Unauthorized access",
      };
    }

    const validatedFields = updateLoanSchema.safeParse({
      loanId: formData.get('loanId'),
      purpose: formData.get('purpose'),
      collateral: formData.get('collateral'),
      status: formData.get('status'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { loanId, ...updateData } = validatedFields.data;

    // Get the loan details
    const loan = await prisma.loans.findUnique({
      where: { id: loanId },
      include: {
        borrower: {
          select: { name: true, role: true }
        }
      }
    });

    if (!loan) {
      return {
        success: false,
        message: "Loan not found",
      };
    }

    // Check if user can manage this loan
    const canManage = await canManageLoan(currentUser, loan);
    if (!canManage) {
      return {
        success: false,
        message: "You don't have permission to manage this loan",
      };
    }

    // Only allow updates to certain statuses
    if (loan.status === 'COMPLETED' || loan.status === 'DEFAULTED') {
      return {
        success: false,
        message: "Cannot modify completed or defaulted loans",
      };
    }

    // Prepare update data
    const updatePayload: UpdateLoanPayload = {};
    
    if (updateData.purpose) updatePayload.purpose = updateData.purpose;
    if (updateData.collateral !== undefined) updatePayload.collateral = updateData.collateral;
    if (updateData.status) updatePayload.status = updateData.status;

    // If modifying loan amount or terms, recalculate payments (only for pending loans)
    if ((updateData.principalAmount || updateData.termMonths || updateData.loanType) && 
        ['PENDING', 'UNDER_REVIEW'].includes(loan.status)) {
      
      const loanType = updateData.loanType || loan.loanType;
      const principalAmount = updateData.principalAmount || loan.principalAmount.toNumber();
      const termMonths = updateData.termMonths || loan.termMonths;

      // Validate amount and term limits
      const maxAmount = getMaxAmountByType(loanType);
      const maxTerm = getMaxTermByType(loanType);

      if (principalAmount > maxAmount) {
        return {
          success: false,
          errors: {
            principalAmount: [`Maximum amount for ${loanType} loan is ₱${maxAmount.toLocaleString()}`],
          },
        };
      }

      if (termMonths > maxTerm) {
        return {
          success: false,
          errors: {
            termMonths: [`Maximum term for ${loanType} loan is ${maxTerm} months`],
          },
        };
      }

      // Recalculate loan details
      const interestRate = getInterestRateByType(loanType);
      const loanCalc = calculateSimpleInterestLoan(principalAmount, interestRate, termMonths);
      const monthlyPayment = loanCalc.monthlyPayment;
      const totalAmount = loanCalc.totalAmount;

      updatePayload.loanType = loanType;
      updatePayload.principalAmount = principalAmount;
      updatePayload.termMonths = termMonths;
      updatePayload.interestRate = interestRate;
      updatePayload.monthlyPayment = monthlyPayment;
      updatePayload.totalAmount = totalAmount;
      updatePayload.remainingBalance = totalAmount;
    }
    console.log('updatePayload', updatePayload);
    // Update the loan
    await prisma.loans.update({
      where: { id: loanId },
      data: updatePayload,
    });

    revalidatePath('/loans');
    return {
      success: true,
      message: `Loan ${loan.loanNumber} updated successfully`,
    };

  } catch (error) {
    console.error('Loan update error:', error);
    return {
      success: false,
      message: "Failed to update loan",
    };
  }
}

export async function deleteLoan(loanId: string) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: "Unauthorized access",
      };
    }

    // Get the loan details
    const loan = await prisma.loans.findUnique({
      where: { id: loanId },
      include: {
        borrower: {
          select: { role: true }
        }
      }
    });

    if (!loan) {
      return {
        success: false,
        message: "Loan not found",
      };
    }

    // Check if user can manage this loan
    const canManage = await canManageLoan(currentUser, loan);
    if (!canManage) {
      return {
        success: false,
        message: "You don't have permission to delete this loan",
      };
    }

    // Only allow deletion of pending, rejected, or cancelled loans
    if (!['PENDING', 'UNDER_REVIEW', 'REJECTED', 'CANCELLED'].includes(loan.status)) {
      return {
        success: false,
        message: "Can only delete pending, rejected, or cancelled loans",
      };
    }

    // Delete the loan (payments will be cascade deleted)
    await prisma.loans.delete({
      where: { id: loanId },
    });

    revalidatePath('/loans');
    return {
      success: true,
      message: `Loan ${loan.loanNumber} deleted successfully`,
    };

  } catch (error) {
    console.error('Loan deletion error:', error);
    return {
      success: false,
      message: "Failed to delete loan",
    };
  }
}

export async function getUsersForLoanCreation() {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: "Unauthorized access",
        users: [],
      };
    }

    // Get users based on role permissions
    const whereClause: Prisma.usersWhereInput = {
      // More flexible filtering - include all statuses for now to debug
      status: {
        in: ['ACTIVE', 'PENDING'] // Include both active and pending users
      },
      // Include users who can actually borrow (not GUEST role unless they're the only ones available)
      role: {
        notIn: ['GUEST'] // Exclude only GUEST users
      }
    };

    // If manager, exclude superadmin users
    if (currentUser.role === 'MANAGER') {
      whereClause.role = {
        in: ['BORROWER', 'MANAGER'] // Manager can create loans for borrowers and other managers, but not superadmins
      };
    }

    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNo: true,
        role: true,
        status: true,
        activated: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Log for debugging
    console.log('Found users for loan creation:', users.length);
    console.log('Current user role:', currentUser.role);
    console.log('Users:', users.map(u => ({ name: u.name, role: u.role, status: u.status, activated: u.activated })));

    return {
      success: true,
      users: users, // Return all eligible users (allow multiple loans per user)
    };

  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      message: "Failed to fetch users",
      users: [],
    };
  }
}
