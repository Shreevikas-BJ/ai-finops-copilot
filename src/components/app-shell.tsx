import Link from "next/link";
import { Cloud, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { DataSourceIndicator } from "@/components/data-source-indicator";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/[0.07] bg-[#0b0f15]/95 px-4 py-5 backdrop-blur lg:flex lg:flex-col">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-400 text-[#07110d] shadow-[0_0_30px_rgba(52,211,153,0.18)]">
            <Cloud className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">AI FinOps</span>
            <span className="block text-xs text-slate-500">Action layer</span>
          </span>
        </Link>

        <SidebarNav />

        <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-200">
            <ShieldCheck className="size-4 text-emerald-400" />
            Read-only MVP
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Analyzes evidence and drafts actions. It never changes cloud resources.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#080b10]/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="size-4 text-emerald-400" />
              <span className="hidden sm:inline">FinOps decision support</span>
              <span className="sm:hidden">AI FinOps Copilot</span>
            </div>
            <div className="flex items-center gap-2">
              <DataSourceIndicator />
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 sm:flex">
                <LockKeyhole className="size-3.5 text-emerald-400" />
                No AWS credentials
              </div>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-white/[0.05] px-3 py-2 lg:hidden">
            <SidebarNav />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
