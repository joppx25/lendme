import { LoanApplicationForm } from "@/components/loans/LoanApplicationForm";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ApplyLoanPage() {
  const currentUser = await getCurrentSession();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'BORROWER') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Apply for Loan</h1>
          <p className="text-muted-foreground">
            Submit your loan application and get quick approval.
          </p>
        </div>
        
        <LoanApplicationForm />
      </div>
    </div>
  );
}
