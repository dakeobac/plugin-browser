import { NextRequest } from "next/server";
import { createSandbox, listSandboxes, isE2BAvailable } from "@/lib/e2b-sandbox";
import type { E2BSandboxConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isE2BAvailable()) {
    return Response.json({ available: false, sandboxes: [] });
  }
  return Response.json({ available: true, sandboxes: listSandboxes() });
}

export async function POST(req: NextRequest) {
  if (!isE2BAvailable()) {
    return Response.json(
      { error: "E2B is not configured. Set E2B_API_KEY environment variable." },
      { status: 503 },
    );
  }

  const body = (await req.json()) as Partial<E2BSandboxConfig>;

  const config: E2BSandboxConfig = {
    template: body.template || "base",
    timeout: body.timeout || 300,
    resources: body.resources || { cpu: 2, memoryMB: 512 },
    persistent: body.persistent ?? false,
    envVars: body.envVars,
  };

  try {
    const sandbox = await createSandbox(config);
    return Response.json(sandbox, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
