"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!employeeId.trim()) return;
    setSubmitted(true);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.14em] text-tl-muted">
          Official ID / Employee ID
        </span>
        <input
          value={employeeId}
          onChange={(event) => {
            setEmployeeId(event.target.value);
            setSubmitted(false);
          }}
          className="mt-1 w-full border border-tl-border bg-tl-bg px-3 py-2.5 text-[13px] text-tl-text outline-none focus:border-tl-gold/50"
        />
      </label>

      {submitted ? (
        <p className="border border-tl-border px-3 py-2 text-[12px] leading-5 text-tl-muted">
          A password reset request has been recorded for this Official ID.
          Contact the District Survey Office administrator. No email is sent in
          this mock system.
        </p>
      ) : null}

      <button
        type="submit"
        className="w-full border border-tl-gold/50 bg-tl-gold/15 py-2.5 text-[13px] font-medium text-tl-gold hover:bg-tl-gold/25"
      >
        Submit request
      </button>

      <p className="text-center text-[13px]">
        <Link href="/login" className="text-tl-gold hover:underline">
          Return to login
        </Link>
      </p>

      <p className="pt-2 text-center text-[11px] text-tl-muted">
        Authorized government personnel only.
      </p>
    </form>
  );
}
