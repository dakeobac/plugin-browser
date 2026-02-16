import { NextRequest } from "next/server";
import { getMcpServer, removeManualServer, updateManualServer } from "@/lib/mcp-registry";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const server = getMcpServer(id);
  if (!server) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }
  return Response.json(server);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const server = getMcpServer(id);
  if (!server) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }
  if (server.source !== "manual") {
    return Response.json({ error: "Only manual servers can be updated" }, { status: 400 });
  }
  const updated = updateManualServer(id, body);
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const server = getMcpServer(id);
  if (!server) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }
  if (server.source !== "manual") {
    return Response.json({ error: "Only manual servers can be removed" }, { status: 400 });
  }
  removeManualServer(id);
  return Response.json({ success: true });
}
