import { NextResponse } from "next/server";
import { scaffoldPlugin } from "@/lib/plugin-scaffolder";
import type { ScaffoldRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScaffoldRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { success: false, error: "Plugin name is required" },
        { status: 400 }
      );
    }

    if (!/^[a-z][a-z0-9-]*$/.test(body.name)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Plugin name must start with a letter, contain only lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      );
    }

    if (!body.description || typeof body.description !== "string") {
      return NextResponse.json(
        { success: false, error: "Plugin description is required" },
        { status: 400 }
      );
    }

    if (!body.targetMarketplace || typeof body.targetMarketplace !== "string") {
      return NextResponse.json(
        { success: false, error: "Target marketplace is required" },
        { status: 400 }
      );
    }

    const result = scaffoldPlugin({
      name: body.name,
      description: body.description,
      category: body.category,
      targetMarketplace: body.targetMarketplace,
      commands: Array.isArray(body.commands) ? body.commands : [],
      skills: Array.isArray(body.skills) ? body.skills : [],
      agents: Array.isArray(body.agents) ? body.agents : [],
      includeMcp: Boolean(body.includeMcp),
      includeHooks: Boolean(body.includeHooks),
      registerInManifest: Boolean(body.registerInManifest),
      author: body.author,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
