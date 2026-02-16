import { fetchRegistry } from "@/lib/registry-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const index = await fetchRegistry();
  return Response.json(index);
}
