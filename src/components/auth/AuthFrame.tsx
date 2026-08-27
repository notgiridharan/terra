import type { ReactNode } from "react";

function TerraLensMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center border border-tl-gold/40 bg-tl-gold/10 text-[13px] font-semibold tracking-[0.16em] text-tl-gold">
        TL
      </div>
      <div>
        <p className="text-[18px] font-semibold tracking-wide text-tl-text">
          TerraLens
        </p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-tl-muted">
          Land Record Intelligence
        </p>
      </div>
    </div>
  );
}

export function AuthFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-tl-bg px-4 py-10">
      <div className="w-full max-w-[420px] border border-tl-border bg-tl-panel p-8">
        <TerraLensMark />
        <h1 className="mt-8 text-[15px] font-semibold text-tl-text">{title}</h1>
        <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-tl-muted">
          Government Officer Portal
        </p>
        {children}
      </div>
    </div>
  );
}
