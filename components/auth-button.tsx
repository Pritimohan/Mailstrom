"use client";

import { useEffect, useState } from "react";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuthStatus } from "@/types";

interface AuthButtonProps {
  onStatusChange?: (status: AuthStatus) => void;
}

export function AuthButton({ onStatusChange }: AuthButtonProps) {
  const [status, setStatus] = useState<AuthStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/status")
      .then((response) => response.json() as Promise<AuthStatus>)
      .then((data) => {
        if (!active) return;
        setStatus(data);
        onStatusChange?.(data);
      })
      .catch(() => {
        if (!active) return;
        const disconnected = { connected: false };
        setStatus(disconnected);
        onStatusChange?.(disconnected);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [onStatusChange]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      const disconnected = { connected: false };
      setStatus(disconnected);
      onStatusChange?.(disconnected);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking...
      </Button>
    );
  }

  if (status.connected) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-neutral-400 sm:inline">
          {status.email}
        </span>
        <Button variant="outline" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/google"
      className={cn(buttonVariants({ variant: "default", size: "default" }))}
    >
      <LogIn className="h-4 w-4" />
      Connect Gmail
    </a>
  );
}
