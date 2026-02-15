import { Suspense } from "react";
import { AgentView } from "@/components/AgentView";

export const dynamic = "force-dynamic";

export default function AgentPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-73px)] items-center justify-center text-muted-foreground">Loading...</div>}>
      <AgentView />
    </Suspense>
  );
}
