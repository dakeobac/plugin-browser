import { NextResponse } from "next/server";
import { clonePlugin } from "@/lib/github-clone";
import type { CloneRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: CloneRequest = await request.json();

    if (!body.url) {
      return NextResponse.json(
        { success: false, error: "url is required" },
        { status: 400 }
      );
    }

    const result = clonePlugin({
      url: body.url,
      targetMarketplace: body.targetMarketplace || "personal",
      registerInManifest: body.registerInManifest !== false,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        isPlugin: false,
        registeredInManifest: false,
      },
      { status: 500 }
    );
  }
}
