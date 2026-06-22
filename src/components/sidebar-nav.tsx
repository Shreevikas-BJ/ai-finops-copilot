"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock3,
  FileText,
  LayoutDashboard,
  SearchCheck,
  UploadCloud,
} from "lucide-react";

const links = [
  { href: "/", label: "Upload", icon: UploadCloud },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/findings", label: "Findings", icon: SearchCheck },
  { href: "/report", label: "Report", icon: FileText },
  { href: "/#history", label: "History", icon: Clock3 },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="flex gap-1">
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`group flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-400/20"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
