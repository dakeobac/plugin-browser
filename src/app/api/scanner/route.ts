import { NextResponse } from "next/server";
import { scanForPlugins } from "@/lib/plugin-scanner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = scanForPlugins();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
