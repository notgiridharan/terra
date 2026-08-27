import type { Metadata } from "next";
import Link from "next/link";
import { DEMO_CARDS } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Live Demo",
};

export default function LiveDemoPage() {
  return (
    <div className="mx-auto max-w-[1100px]">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-tl-muted">
        Walkthrough index
      </p>
      <h2 className="mt-1 text-lg font-semibold text-tl-text">Live Demo</h2>
      <p className="mt-2 max-w-3xl text-[13px] leading-5 text-tl-muted">
        Links to every TerraLens module in pipeline order. Use this page from
        the closing PPT slide.
      </p>
      <p className="mt-2 font-mono text-[12px] text-tl-gold">/demo</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DEMO_CARDS.map((card, index) => (
          <Link
            key={card.href + card.title}
            href={card.href}
            className="group flex flex-col border border-tl-border bg-tl-panel p-4 transition-colors hover:border-tl-gold/50 hover:bg-tl-gold/5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] tabular-nums text-tl-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[11px] text-tl-gold opacity-0 transition-opacity group-hover:opacity-100">
                Open
              </span>
            </div>
            <h3 className="mt-3 text-[15px] font-semibold text-tl-text">
              {card.title}
            </h3>
            <p className="mt-1 text-[12px] leading-5 text-tl-muted">
              {card.summary}
            </p>
            <p className="mt-4 font-mono text-[11px] text-tl-muted group-hover:text-tl-gold">
              {card.href}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
