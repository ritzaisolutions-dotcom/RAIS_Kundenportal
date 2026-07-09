"use client";

import { useEffect } from "react";

export function TempPasswordReveal({ password, clearUrl = "/admin/clients/new/clear-temp-password" }: { password: string; clearUrl?: string }) {
  useEffect(() => {
    // Cookie sofort nach dem Anzeigen löschen (statt auf maxAge zu warten),
    // damit ein Reload oder Zurück-Navigieren das Passwort nicht erneut offenlegt.
    fetch(clearUrl, { method: "POST" }).catch(() => {});
  }, [clearUrl]);

  return (
    <div className="rounded-[var(--radius)] border border-warning bg-warning-light p-3 text-sm text-warning-dark">
      Temporäres Passwort für den Erstlogin: <code className="font-semibold">{password}</code>
      <br />
      <span className="text-xs">Bitte jetzt notieren — wird nach diesem Aufruf nicht erneut angezeigt.</span>
    </div>
  );
}
