import Link from "next/link";
import { CloudOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-[65vh] place-items-center text-center">
      <div>
        <CloudOff className="mx-auto size-8 text-slate-600" />
        <h1 className="mt-4 text-xl font-semibold text-white">That cost center does not exist</h1>
        <p className="mt-2 text-sm text-slate-500">The page may have moved, but your cloud resources are untouched.</p>
        <Link href="/" className="mt-5 inline-flex rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#06110c]">Back to dashboard</Link>
      </div>
    </div>
  );
}
