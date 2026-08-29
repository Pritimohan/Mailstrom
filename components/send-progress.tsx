"use client";

import { Progress } from "@/components/ui/progress";
import type { SendLogEntry } from "@/types";

interface SendProgressProps {
  total: number;
  completed: number;
  logs: SendLogEntry[];
}

export function SendProgress({ total, completed, logs }: SendProgressProps) {
  if (total === 0) {
    return null;
  }

  const percent = total > 0 ? (completed / total) * 100 : 0;
  const recentLogs = [...logs].reverse().slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-300">Progress</span>
          <span className="text-neutral-400">
            {completed} / {total}
          </span>
        </div>
        <Progress value={percent} />
      </div>

      {recentLogs.length > 0 && (
        <div className="minimal-scroll max-h-48 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-900 p-3">
          <ul className="space-y-1 text-xs">
            {recentLogs.map((entry, index) => (
              <li
                key={`${entry.email}-${entry.timestamp}-${index}`}
                className={
                  entry.status === "sent" ? "text-neutral-300" : "text-neutral-400"
                }
              >
                {entry.status === "sent" ? "✓" : "✗"} {entry.email}
                {entry.error ? ` — ${entry.error}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
