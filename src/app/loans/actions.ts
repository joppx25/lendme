'use server';

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { LoanType, LoanStatus } from "@/generated/prisma";
import { 
  calculateSimpleInterestLoan, 
  generateLoanNumber, 
  getInterestRateByType, 
  getMaxAmountByType, 
  getMaxTermByType 
} from "@/lib/loanUtils";
import { saveUploadedFiles, validateFile, UploadedFile } from "@/lib/fileUpload";

const loanApplicationSchema = z.object({
  loanType: z.nativeEnum(LoanType),
  principalAmount: z.string().transform((val) => parseFloat(val)).pipe(
    z.number().positive("Amount must be positive").min(1000, "Minimum loan amount is ₱1,000")
  ),
  termMonths: z.string().transform((val) => parseInt(val)).pipe(
    z.number().positive("Term must be positive").min(1, "Minimum term is 1 month").max(60, "Maximum term is 60 months")
  ),
  purpose: z.string().min(10, "Purpose must be at least 10 characters").max(500, "Purpose too long"),
  collateral: z.string().optional(),
});

interface LoanApplicationState {
  success: boolean;
  message?: string;
  errors?: {
    principalAmount?: string[];
  };
}

export async function applyForLoan(state: LoanApplicationState, formData: FormData) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    if (currentUser.role !== 'BORROWER') {
      return {
        success: false,
        message: "Only borrowers can apply for loans",
      };
    }

    const validatedFields = loanApplicationSchema.safeParse({
      loanType: formData.get('loanType'),
      principalAmount: formData.get('principalAmount'),
      termMonths: formData.get('termMonths'),
      purpose: formData.get('purpose'),
      collateral: formData.get('collateral'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { loanType, principalAmount, termMonths, purpose, collateral } = validatedFields.data;

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
        borrowerId: currentUser.id,
        status: {
          in: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE']
        }
      }
    });

    if (existingLoans.length > 0) {
      return {
        success: false,
        message: "You already have an active or pending loan application",
      };
    }

    // Handle file uploads
    const files = formData.getAll('requirements') as File[];
    let uploadedFiles: UploadedFile[] = [];
    
    if (files && files.length > 0) {
      // Filter out empty files
      const validFiles = files.filter(file => file.size > 0);
      
      if (validFiles.length > 0) {
        // Validate each file
        for (const file of validFiles) {
          const validation = validateFile(file);
          if (!validation.valid) {
            return {
              success: false,
              message: `File validation failed: ${validation.error}`,
            };
          }
        }
        
        try {
          uploadedFiles = await saveUploadedFiles(validFiles, `loan-${currentUser.id}`);
        } catch (error) {
          console.error('File upload error:', error);
          return {
            success: false,
            message: "Failed to upload requirement files",
          };
        }
      }
    }

    // Calculate loan details
    const interestRate = getInterestRateByType(loanType);
    const loanCalculation = calculateSimpleInterestLoan(principalAmount, interestRate, termMonths);
    const loanNumber = generateLoanNumber();

    // Create loan application
    const loan = await prisma.loans.create({
      data: {
        loanNumber,
        borrowerId: currentUser.id,
        loanType,
        principalAmount,
        interestRate,
        termMonths,
        monthlyPayment: loanCalculation.monthlyPayment,
        totalAmount: loanCalculation.totalAmount,
        remainingBalance: principalAmount,
        status: LoanStatus.PENDING,
        purpose,
        collateral: collateral || null,
        requirementFiles: uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : undefined,
        requestedAt: new Date(),
      },
    });

    revalidatePath('/my-loans');
    return {
      success: true,
      message: `Loan application submitted successfully. Loan number: ${loanNumber}`,
      loanId: loan.id,
    };

  } catch (error) {
    console.error('Loan application error:', error);
    return {
      success: false,
      message: "Failed to submit loan application",
    };
  }
}

export async function approveLoan(loanId: string, approverId: string) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      throw new Error('Unauthorized');
    }

    // Get loan details first to calculate end date
    const existingLoan = await prisma.loans.findUnique({
      where: { id: loanId },
      select: { termMonths: true }
    });
    
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (existingLoan?.termMonths || 0));

    await prisma.loans.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.APPROVED,
        approverId,
        approvedAt: new Date(),
        startDate: new Date(),
        endDate,
      },
    });

    // Generate payment schedule
    const loanDetails = await prisma.loans.findUnique({
      where: { id: loanId }
    });

    if (loanDetails) {
      const calculation = calculateSimpleInterestLoan(
        parseFloat(loanDetails.principalAmount.toString()),
        parseFloat(loanDetails.interestRate.toString()),
        loanDetails.termMonths,
        loanDetails.startDate!
      );

      // Create payment schedule
      for (const payment of calculation.paymentSchedule) {
        await prisma.loanPayments.create({
          data: {
            loanId: loanId,
            payerId: loanDetails.borrowerId,
            paymentNumber: payment.paymentNumber,
            scheduledAmount: payment.scheduledAmount,
            paidAmount: 0,
            principalPaid: 0,
            interestPaid: 0,
            lateFee: 0,
            scheduledDate: payment.scheduledDate,
            status: 'PENDING',
          },
        });
      }

      // Update loan status to ACTIVE
      await prisma.loans.update({
        where: { id: loanId },
        data: { status: LoanStatus.ACTIVE },
      });
    }

    revalidatePath('/loans');
    return { success: true };

  } catch (error) {
    console.error('Loan approval error:', error);
    throw error;
  }
}

export async function rejectLoan(loanId: string, rejectionReason: string) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      throw new Error('Unauthorized');
    }

    await prisma.loans.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason,
      },
    });

    revalidatePath('/loans');
    return { success: true };

  } catch (error) {
    console.error('Loan rejection error:', error);
    throw error;
  }
}
