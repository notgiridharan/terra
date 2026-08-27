"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

type Item = {
  id: number;
  title: string;
  village: string;
};

export function BackendStatus() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadItems() {
    const response = await fetch(`${API_BASE}/items`);
    if (!response.ok) {
      throw new Error(`GET /items failed (${response.status})`);
    }
    return (await response.json()) as Item[];
  }

  useEffect(() => {
    let cancelled = false;
    loadItems()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Backend unreachable");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function addSample() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Officer note from Dashboard",
          village: "Sirkazhi",
        }),
      });
      if (!response.ok) {
        throw new Error(`POST /items failed (${response.status})`);
      }
      setItems(await loadItems());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "POST failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-tl-border bg-tl-panel">
      <header className="flex items-center justify-between border-b border-tl-border px-4 py-3">
        <div>
          <h3 className="text-[13px] font-semibold text-tl-text">
            FastAPI connection
          </h3>
          <p className="text-[11px] text-tl-muted">{API_BASE}</p>
        </div>
        <button
          type="button"
          onClick={addSample}
          disabled={busy}
          className="border border-tl-gold/40 px-2.5 py-1 text-[11px] text-tl-gold disabled:opacity-50"
        >
          POST sample item
        </button>
      </header>
      <div className="px-4 py-3 text-[13px]">
        {error ? (
          <p className="text-red-300">
            {error}. Start the API with{" "}
            <span className="font-mono text-[12px]">
              uvicorn main:app --reload --app-dir backend
            </span>
            .
          </p>
        ) : items === null ? (
          <p className="text-tl-muted">Calling GET {API_BASE}/items…</p>
        ) : (
          <ul className="space-y-1 text-tl-muted">
            {items.map((item) => (
              <li key={item.id}>
                <span className="tabular-nums text-tl-text">{item.id}.</span>{" "}
                {item.title} · {item.village}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
