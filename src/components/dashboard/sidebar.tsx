"use client";

import Link from "next/link";
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
    href: "/profile",
    icon: <User size={18} />,
    label: "Profile",
    roles: [Role.SUPERADMIN, Role.MANAGER, Role.BORROWER], // All roles can see their profile
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
      <div className="p-4 font-bold text-xl border-b">LendMe</div>
      <nav className="mt-6 space-y-2">
        {visibleMenuItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>      
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
