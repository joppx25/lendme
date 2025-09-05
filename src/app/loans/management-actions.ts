'use server';

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { LoanStatus } from "@/generated/prisma";
import { calculateLoanPayment, decimalToNumber } from "@/lib/loanUtils";

const loanApprovalSchema = z.object({
  loanId: z.string(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().nullable(),
});

interface LoanApprovalState {
  success: boolean;
  message?: string;
  errors?: {
    loanId?: string[];
  };
}

export async function manageLoan(state: LoanApprovalState, formData: FormData) {
  let loanReturn = {
    success: false,
    message: "",
  };

  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: "Unauthorized access",
      };
    }

    const validatedFields = loanApprovalSchema.safeParse({
      loanId: formData.get('loanId'),
      action: formData.get('action'),
      rejectionReason: formData.get('rejectionReason'),
    });
    console.log('validatedFields', validatedFields);
    console.log('formData', formData);
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { loanId, action, rejectionReason } = validatedFields.data;

    // Get the loan details
    const loan = await prisma.loans.findUnique({
      where: { id: loanId },
      include: {
        borrower: true,
      },
    });

    if (!loan) {
      return {
        success: false,
        message: "Loan not found",
      };
    }

    if (loan.status !== 'PENDING' && loan.status !== 'UNDER_REVIEW') {
      return {
        success: false,
        message: "Loan cannot be modified in its current state",
      };
    }

    if (action === 'approve') {
      // Check if there are enough funds
      const fundBalance = await prisma.fundBalance.findFirst();
      const loanAmount = decimalToNumber(loan.principalAmount);
      
      if (fundBalance && decimalToNumber(fundBalance.availableFunds) < loanAmount) {
        return {
          success: false,
          message: "Insufficient funds to approve this loan",
        };
      }

      // Approve the loan
      await prisma.loans.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.APPROVED,
          approverId: currentUser.id,
          approvedAt: new Date(),
          startDate: new Date(),
          endDate: new Date(Date.now() + (loan.termMonths * 30 * 24 * 60 * 60 * 1000)), // Approximate end date
        },
      });

      // Generate payment schedule
      const calculation = calculateLoanPayment(
        loanAmount,
        decimalToNumber(loan.interestRate),
        loan.termMonths,
        new Date()
      );

      // Create payment schedule
      for (const payment of calculation.paymentSchedule) {
        await prisma.loanPayments.create({
          data: {
            loanId: loanId,
            payerId: loan.borrowerId,
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

      // Update fund balance
      if (fundBalance) {
        await prisma.fundBalance.update({
          where: { id: fundBalance.id },
          data: {
            availableFunds: { decrement: loanAmount },
            loanedFunds: { increment: loanAmount },
            lastUpdated: new Date(),
          },
        });
      }

      loanReturn = {
        success: true,
        message: `Loan ${loan.loanNumber} approved successfully for ${loan.borrower.name}`,
      };

    } else if (action === 'reject') {
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return {
          success: false,
          errors: {
            rejectionReason: ["Rejection reason must be at least 10 characters"],
          },
        };
      }

      // Reject the loan
      await prisma.loans.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: rejectionReason,
        },
      });

      loanReturn = {
        success: true,
        message: `Loan ${loan.loanNumber} rejected`,
      };
    }

  } catch (error) {
    console.error('Loan management error:', error);
    return {
      success: false,
      message: "Failed to process loan action",
    };
  }

  revalidatePath('/loans');
  return loanReturn;
}

export async function setLoanUnderReview(loanId: string) {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      throw new Error('Unauthorized');
    }

    await prisma.loans.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.UNDER_REVIEW,
      },
    });

    revalidatePath('/loans');
    return { success: true };

  } catch (error) {
    console.error('Error setting loan under review:', error);
    throw error;
  }
}

export async function getLoanStatistics() {
  try {
    const currentUser = await getCurrentSession();
    
    if (!currentUser || !['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
      return null;
    }

    // Get loan counts by status
    const statusCounts = await prisma.loans.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Get loan amounts by type
    const typeSums = await prisma.loans.groupBy({
      by: ['loanType'],
      _sum: {
        principalAmount: true,
      },
      _count: {
        loanType: true,
      },
    });

    // Get recent loan activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await prisma.loans.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get overdue loans
    const overdueLoans = await prisma.loans.count({
      where: {
        status: 'OVERDUE',
      },
    });

    return {
      statusCounts,
      typeSums,
      recentActivity,
      overdueLoans,
    };

  } catch (error) {
    console.error('Error getting loan statistics:', error);
    return null;
  }
}
