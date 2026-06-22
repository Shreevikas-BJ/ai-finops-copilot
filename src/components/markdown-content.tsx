import type { ReactNode } from "react";

function renderInline(line: string): ReactNode[] {
  return line
    .split(/(\*\*.*?\*\*|`.*?`)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={`${part}-${index}`} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={`${part}-${index}`} className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.9em] text-emerald-200">{part.slice(1, -1)}</code>;
      }
      return <span key={`${part}-${index}`}>{part}</span>;
    });
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-sm leading-7 text-slate-300">
      {content.split("\n").map((line, index) => {
        const key = `${index}-${line.slice(0, 20)}`;
        if (!line.trim()) return <div key={key} className="h-2" />;
        if (line.startsWith("### ")) return <h3 key={key} className="pt-3 text-sm font-semibold text-white">{renderInline(line.slice(4))}</h3>;
        if (line.startsWith("## ")) return <h2 key={key} className="pt-5 text-lg font-semibold tracking-tight text-white">{renderInline(line.slice(3))}</h2>;
        if (line.startsWith("# ")) return <h1 key={key} className="text-2xl font-semibold tracking-tight text-white">{renderInline(line.slice(2))}</h1>;
        if (/^- /.test(line)) return <div key={key} className="flex gap-2 pl-1"><span className="text-emerald-400">•</span><p>{renderInline(line.slice(2))}</p></div>;
        if (/^\d+\. /.test(line)) {
          const marker = line.match(/^\d+\./)?.[0] ?? "1.";
          return <div key={key} className="flex gap-2 pl-1"><span className="font-mono text-emerald-400">{marker}</span><p>{renderInline(line.slice(marker.length + 1))}</p></div>;
        }
        if (line === "---") return <hr key={key} className="my-5 border-white/[0.08]" />;
        return <p key={key}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
