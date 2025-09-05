import { ContributionsView } from "@/components/contributions/ContributionsView";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { decimalToNumber } from "@/lib/loanUtils";
import { getContributionUsers } from "@/app/contributions/actions";
import { Role } from "@/generated/prisma";

export default async function ContributionsPage() {
  const currentUser = await getCurrentSession();

  if (!currentUser) {
    redirect('/login');
  }

  // Fetch contributions based on user role
  let rawContributions;
  let rawFundBalance = null;
  let availableUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: Role;
  }> = [];

  if (['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
    // Managers and admins can see all contributions
    rawContributions = await prisma.contributions.findMany({
      include: {
        contributor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        contributedAt: 'desc',
      },
    });

    // Get fund balance for managers/admins
    rawFundBalance = await prisma.fundBalance.findFirst();
    
    // Get users that can receive contributions
    availableUsers = await getContributionUsers();
  } else {
    // Regular users can only see their own contributions
    rawContributions = await prisma.contributions.findMany({
      where: {
        contributorId: currentUser.id,
      },
      include: {
        contributor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        contributedAt: 'desc',
      },
    });
  }

  // Convert Decimal objects to numbers for client components
  const contributions = rawContributions.map(contribution => ({
    ...contribution,
    amount: decimalToNumber(contribution.amount),
  }));

  const fundBalance = rawFundBalance ? {
    ...rawFundBalance,
    totalFunds: decimalToNumber(rawFundBalance.totalFunds),
    availableFunds: decimalToNumber(rawFundBalance.availableFunds),
    loanedFunds: decimalToNumber(rawFundBalance.loanedFunds),
    totalContributions: decimalToNumber(rawFundBalance.totalContributions),
    totalRepayments: decimalToNumber(rawFundBalance.totalRepayments),
  } : null;

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {['SUPERADMIN', 'MANAGER'].includes(currentUser.role) 
                ? 'Fund Contributions' 
                : 'My Contributions'
              }
            </h1>
            <p className="text-muted-foreground">
              {['SUPERADMIN', 'MANAGER'].includes(currentUser.role)
                ? 'Manage member contributions to the lending fund.'
                : 'View your contributions to the lending fund and make new contributions.'
              }
            </p>
          </div>
        </div>
        
        <ContributionsView 
          contributions={contributions} 
          fundBalance={fundBalance}
          userRole={currentUser.role}
          availableUsers={availableUsers}
        />
      </div>
    </div>
  );
}
