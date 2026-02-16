import { NextRequest } from "next/server";
import { getAllMcpServers, addManualServer } from "@/lib/mcp-registry";
import type { CreateMcpServerRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const servers = getAllMcpServers();
  return Response.json(servers);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateMcpServerRequest;

  if (!body.name || !body.command) {
    return Response.json(
      { error: "name and command are required" },
      { status: 400 },
    );
  }

  const server = addManualServer({
    name: body.name,
    displayName: body.displayName || body.name,
    command: body.command,
    args: body.args || [],
    env: body.env,
    cwd: body.cwd,
  });

  return Response.json(server, { status: 201 });
}
