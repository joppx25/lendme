import { MyLoansView } from "@/components/loans/MyLoansView";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { decimalToNumber } from "@/lib/loanUtils";

export default async function MyLoansPage() {
  const currentUser = await getCurrentSession();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'BORROWER') {
    redirect('/dashboard');
  }

  // Fetch user's loans
  const rawLoans = await prisma.loans.findMany({
    where: {
      borrowerId: currentUser.id,
    },
    include: {
      payments: {
        orderBy: {
          paymentNumber: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert Decimal objects to numbers for client components
  const loans = rawLoans.map(loan => ({
    ...loan,
    principalAmount: decimalToNumber(loan.principalAmount),
    interestRate: decimalToNumber(loan.interestRate),
    monthlyPayment: decimalToNumber(loan.monthlyPayment),
    totalAmount: decimalToNumber(loan.totalAmount),
    remainingBalance: decimalToNumber(loan.remainingBalance),
    requirementFiles: loan.requirementFiles ? JSON.parse(loan.requirementFiles as string) : undefined,
    payments: loan.payments.map(payment => ({
      ...payment,
      scheduledAmount: decimalToNumber(payment.scheduledAmount),
      paidAmount: decimalToNumber(payment.paidAmount),
      principalPaid: decimalToNumber(payment.principalPaid),
      interestPaid: decimalToNumber(payment.interestPaid),
      lateFee: decimalToNumber(payment.lateFee),
    })),
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Loans</h1>
            <p className="text-muted-foreground">
              View and manage your loan applications and active loans.
            </p>
          </div>
          <a 
            href="/apply-loan"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Apply for New Loan
          </a>
        </div>
        
        <MyLoansView loans={loans} />
      </div>
    </div>
  );
}
