import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  SENT: "bg-chart-1/15 text-chart-1",
  ISSUED: "bg-chart-1/15 text-chart-1",
  ACCEPTED: "bg-green-500/15 text-green-700 dark:text-green-400",
  PAID: "bg-green-500/15 text-green-700 dark:text-green-400",
  REJECTED: "bg-coral-soft text-coral",
  CANCELLED: "bg-coral-soft text-coral",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tone[status] ?? tone.DRAFT)}>{label}</span>;
}
