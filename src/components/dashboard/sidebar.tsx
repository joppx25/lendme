"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home, Users, DollarSign, BarChart, Settings } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-4 font-bold text-xl border-b">LendMaster</div>
      <nav className="mt-6 space-y-2">
        <NavItem href="/dashboard" icon={<Home size={18} />} label="Overview" />
        <NavItem href="/dashboard/users" icon={<Users size={18} />} label="Users" />
        <NavItem href="/dashboard/loans" icon={<DollarSign size={18} />} label="Loans" />
        <NavItem href="/dashboard/savings" icon={<DollarSign size={18} />} label="Savings" />
        <NavItem href="/dashboard/reports" icon={<BarChart size={18} />} label="Reports" />
        <NavItem href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" />
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
