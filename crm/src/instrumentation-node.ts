// Node-only part of instrumentation (kept separate so the Edge bundle never sees imapflow/mailparser).
export function startMailSyncTimer() {
  const g = globalThis as unknown as { __mailSyncTimer?: NodeJS.Timeout };
  const seconds = Number(process.env.MAIL_SYNC_INTERVAL_SECONDS ?? 300);
  if (!seconds || g.__mailSyncTimer) return;
  g.__mailSyncTimer = setInterval(() => {
    import("@/core/mailsync").then((m) => m.syncAllMailboxes()).catch((e) => console.error("mailbox sync failed", e));
  }, seconds * 1000);
  g.__mailSyncTimer.unref();
}
