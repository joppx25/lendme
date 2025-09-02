import { UserManagementView } from "@/components/users/UserManagementView";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { decimalToNumber } from "@/lib/loanUtils";

export default async function UserManagementPage() {
  const currentUser = await getCurrentSession();

  if (!currentUser) {
    redirect('/login');
  }

  // Only managers and super admins can access this page
  if (!['SUPERADMIN', 'MANAGER'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Fetch all users with their related data
  const rawUsers = await prisma.users.findMany({
    include: {
      loans: {
        select: {
          id: true,
          loanNumber: true,
          principalAmount: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      contributions: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      loanPayments: {
        select: {
          id: true,
          scheduledAmount: true,
          paidAmount: true,
          status: true,
          paidDate: true,
        },
      },
      _count: {
        select: {
          loans: true,
          contributions: true,
          loanPayments: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' }, // Admins first, then managers, then borrowers
      { createdAt: 'desc' },
    ],
  });

  // Get user statistics
  const userStats = await prisma.users.groupBy({
    by: ['role', 'status'],
    _count: {
      role: true,
    },
  });

  // Get activity statistics (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSignups = await prisma.users.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const activeUsers = await prisma.users.count({
    where: {
      status: 'ACTIVE',
    },
  });

  // Convert Decimal objects to numbers for client components
  const users = rawUsers.map(user => ({
    ...user,
    loans: user.loans.map(loan => ({
      ...loan,
      principalAmount: decimalToNumber(loan.principalAmount),
    })),
    contributions: user.contributions.map(contribution => ({
      ...contribution,
      amount: decimalToNumber(contribution.amount),
    })),
    loanPayments: user.loanPayments.map(payment => ({
      ...payment,
      scheduledAmount: decimalToNumber(payment.scheduledAmount),
      paidAmount: decimalToNumber(payment.paidAmount),
    })),
  }));

  // Process statistics
  const statistics = userStats.reduce((acc, stat) => {
    const key = `${stat.role}_${stat.status}`;
    acc[key] = stat._count.role;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and monitor user activity across the platform.
            </p>
          </div>
        </div>
        
        <UserManagementView 
          users={users}
          statistics={statistics}
          recentSignups={recentSignups}
          activeUsers={activeUsers}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
        />
      </div>
    </div>
  );
}
