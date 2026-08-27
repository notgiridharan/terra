"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMO_OFFICERS, DEMO_PASSWORD, ROLE_META } from "@/lib/auth";
import { useAuth } from "@/lib/auth-store";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = login(employeeId, password, remember);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  function fillDemo(id: string) {
    setEmployeeId(id);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.14em] text-tl-muted">
          Official ID / Employee ID
        </span>
        <input
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          autoComplete="username"
          className="mt-1 w-full border border-tl-border bg-tl-bg px-3 py-2.5 text-[13px] text-tl-text outline-none focus:border-tl-gold/50"
        />
      </label>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.14em] text-tl-muted">
          Password
        </span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="mt-1 w-full border border-tl-border bg-tl-bg px-3 py-2.5 text-[13px] text-tl-text outline-none focus:border-tl-gold/50"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[13px] text-tl-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="accent-tl-gold"
          />
          Remember me
        </label>
        <Link
          href="/forgot-password"
          className="text-[13px] text-tl-gold hover:underline"
        >
          Forgot password
        </Link>
      </div>

      {error ? (
        <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="w-full border border-tl-gold/50 bg-tl-gold/15 py-2.5 text-[13px] font-medium text-tl-gold hover:bg-tl-gold/25"
      >
        Login
      </button>

      <p className="pt-2 text-center text-[11px] text-tl-muted">
        Authorized government personnel only.
      </p>

      <div className="border border-tl-border bg-tl-bg px-3 py-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-tl-muted">
          Demo officer hierarchy (mock — shared password {DEMO_PASSWORD})
        </p>
        <ul className="mt-2 space-y-1">
          {DEMO_OFFICERS.map((officer) => {
            const meta = ROLE_META[officer.role];
            return (
              <li key={officer.employeeId}>
                <button
                  type="button"
                  onClick={() => fillDemo(officer.employeeId)}
                  className="flex w-full items-center justify-between gap-2 border border-transparent px-2 py-1.5 text-left text-[11px] text-tl-muted transition-colors hover:border-tl-gold/30 hover:bg-tl-gold/5 hover:text-tl-text"
                >
                  <span>
                    <span className="font-mono text-tl-gold">
                      {officer.employeeId}
                    </span>{" "}
                    · {meta.title}
                  </span>
                  <span className="rounded-sm border border-tl-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-tl-muted">
                    L{meta.level}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </form>
  );
}
