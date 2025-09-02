import { LoanManagementView } from "@/components/loans/LoanManagementView";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { decimalToNumber } from "@/lib/loanUtils";

export default async function LoansManagementPage() {
  const currentUser = await getCurrentSession();

  if (!currentUser) {
    redirect('/login');
  }

  // Only managers and super admins can access this page
  if (!['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Fetch all loans with borrower information
  const rawLoans = await prisma.loans.findMany({
    include: {
      borrower: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNo: true,
          address: true,
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        orderBy: {
          paymentNumber: 'asc',
        },
      },
    },
    orderBy: [
      { status: 'asc' }, // Pending loans first
      { createdAt: 'desc' },
    ],
  });

  // Get loan statistics
  const loanStats = await prisma.loans.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
    _sum: {
      principalAmount: true,
      remainingBalance: true,
    },
  });

  // Get fund balance
  const fundBalance = await prisma.fundBalance.findFirst();

  // Convert Decimal objects to numbers for client components
  const loans = rawLoans.map(loan => ({
    ...loan,
    principalAmount: decimalToNumber(loan.principalAmount),
    interestRate: decimalToNumber(loan.interestRate),
    monthlyPayment: decimalToNumber(loan.monthlyPayment),
    totalAmount: decimalToNumber(loan.totalAmount),
    remainingBalance: decimalToNumber(loan.remainingBalance),
    payments: loan.payments.map(payment => ({
      ...payment,
      scheduledAmount: decimalToNumber(payment.scheduledAmount),
      paidAmount: decimalToNumber(payment.paidAmount),
      principalPaid: decimalToNumber(payment.principalPaid),
      interestPaid: decimalToNumber(payment.interestPaid),
      lateFee: decimalToNumber(payment.lateFee),
    })),
  }));

  // Process statistics
  const statistics = loanStats.map(stat => ({
    status: stat.status,
    count: stat._count.status,
    totalAmount: stat._sum.principalAmount ? decimalToNumber(stat._sum.principalAmount) : 0,
    remainingBalance: stat._sum.remainingBalance ? decimalToNumber(stat._sum.remainingBalance) : 0,
  }));

  const processedFundBalance = fundBalance ? {
    ...fundBalance,
    totalFunds: decimalToNumber(fundBalance.totalFunds),
    availableFunds: decimalToNumber(fundBalance.availableFunds),
    loanedFunds: decimalToNumber(fundBalance.loanedFunds),
    totalContributions: decimalToNumber(fundBalance.totalContributions),
    totalRepayments: decimalToNumber(fundBalance.totalRepayments),
  } : null;

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Loan Management</h1>
            <p className="text-muted-foreground">
              Manage loan applications, approvals, and monitor lending portfolio.
            </p>
          </div>
        </div>
        
        <LoanManagementView 
          loans={loans}
          statistics={statistics}
          fundBalance={processedFundBalance}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  );
}
