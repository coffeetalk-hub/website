// Runs once when the Next.js server starts. Schedules the mailbox sync (single-node deployments).
// MAIL_SYNC_INTERVAL_SECONDS: default 300; 0 disables the timer (use "Sync now" or call syncAllMailboxes from your own scheduler).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    (await import("./instrumentation-node")).startMailSyncTimer();
  }
}
