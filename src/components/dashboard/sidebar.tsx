"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, DollarSign, BarChart, Settings, CreditCard, PiggyBank, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Role } from "@/generated/prisma";

interface MenuItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  roles: Role[];
}

const menuItems: MenuItem[] = [
  {
    href: "/dashboard",
    icon: <Home size={18} />,
    label: "Overview",
    roles: [Role.SUPERADMIN, Role.MANAGER, Role.BORROWER], // All roles can see overview
  },
  {
    href: "/users",
    icon: <Users size={18} />,
    label: "Users",
    roles: [Role.SUPERADMIN, Role.MANAGER], // Only admin and manager
  },
  {
    href: "/loans",
    icon: <DollarSign size={18} />,
    label: "Loans",
    roles: [Role.SUPERADMIN, Role.MANAGER], // Only admin and manager can manage all loans
  },
  {
    href: "/my-loans",
    icon: <CreditCard size={18} />,
    label: "My Loans",
    roles: [Role.BORROWER], // Only borrowers see their own loans
  },
  {
    href: "/apply-loan",
    icon: <DollarSign size={18} />,
    label: "Apply for Loan",
    roles: [Role.BORROWER], // Only borrowers can apply for loans
  },
  {
    href: "/contributions",
    icon: <PiggyBank size={18} />,
    label: "Contributions",
    roles: [Role.SUPERADMIN, Role.MANAGER, Role.BORROWER], // All can access contributions
  },
  {
    href: "/savings",
    icon: <PiggyBank size={18} />,
    label: "Savings",
    roles: [Role.SUPERADMIN, Role.MANAGER], // Only admin and manager
  },
  {
    href: "/reports",
    icon: <BarChart size={18} />,
    label: "Reports",
    roles: [Role.SUPERADMIN, Role.MANAGER], // Only admin and manager
  },
  {
    href: "/settings",
    icon: <Settings size={18} />,
    label: "Settings",
    roles: [Role.SUPERADMIN], // Only superadmin
  },
];

export function Sidebar() {
  const { user, hasAnyRole } = useAuthStore();
  const pathname = usePathname();

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => 
    user ? hasAnyRole(item.roles) : false
  );

  if (!user) {
    return (
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 font-bold text-xl border-b">LendMe</div>
        <nav className="mt-6 space-y-2">
          <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-4 font-bold text-xl border-b h-16">LendMe</div>
      <nav className="mt-6 space-y-2">
        {visibleMenuItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </nav>      
    </aside>
  );
}

function NavItem({ 
  href, 
  icon, 
  label, 
  isActive 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm transition-colors rounded-md mx-2",
        isActive 
          ? "bg-blue-100 text-blue-700 font-medium border-r-2 border-blue-500" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <span className={cn(isActive ? "text-blue-600" : "text-gray-500")}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
