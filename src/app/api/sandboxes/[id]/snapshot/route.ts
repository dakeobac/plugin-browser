import { NextRequest } from "next/server";
import { getSandbox, isE2BAvailable } from "@/lib/e2b-sandbox";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isE2BAvailable()) {
    return Response.json({ error: "E2B not configured" }, { status: 503 });
  }

  const { id } = await params;
  const sandbox = getSandbox(id);
  if (!sandbox) {
    return Response.json({ error: "Sandbox not found" }, { status: 404 });
  }

  // Snapshot functionality requires E2B pro features
  // For now, return the sandbox state as a "snapshot"
  return Response.json({
    success: true,
    snapshot: {
      sandboxId: sandbox.sandboxId,
      config: sandbox.config,
      createdAt: new Date().toISOString(),
    },
  });
}
