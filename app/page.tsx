import { Suspense } from "react";
import { GmailSenderApp } from "@/components/gmail-sender-app";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-neutral-950 text-neutral-400">
          Loading...
        </div>
      }
    >
      <GmailSenderApp />
    </Suspense>
  );
}
