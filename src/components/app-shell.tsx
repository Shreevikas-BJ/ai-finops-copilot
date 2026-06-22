import Link from "next/link";
import { Cloud, LockKeyhole, ShieldCheck } from "lucide-react";
import { DataSourceIndicator } from "@/components/data-source-indicator";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080b10]/90 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-7">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-400 text-[#07110d] shadow-[0_0_24px_rgba(52,211,153,0.16)]">
              <Cloud className="size-4" aria-hidden="true" />
            </span>
            <span className="hidden xl:block">
              <span className="block text-sm font-semibold tracking-tight">AI FinOps</span>
              <span className="block text-[10px] text-slate-500">Action layer</span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <SidebarNav />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <DataSourceIndicator />
            <div className="hidden items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-slate-400 2xl:flex">
              <LockKeyhole className="size-3 text-emerald-400" />
              No AWS credentials
            </div>
            <div className="hidden items-center gap-1.5 text-[10px] text-slate-600 sm:flex">
              <ShieldCheck className="size-3 text-emerald-400" /> Read-only
            </div>
          </div>
        </div>
        <div className="overflow-x-auto border-t border-white/[0.05] px-3 py-2 lg:hidden">
          <SidebarNav />
        </div>
      </header>

      <main className="w-full px-4 py-5 sm:px-6 lg:px-7 lg:py-6">{children}</main>
    </div>
  );
}
