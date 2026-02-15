import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { execSync } from "child_process";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path: dirPath, target } = body;

    if (!dirPath || typeof dirPath !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing path" },
        { status: 400 }
      );
    }

    if (target !== "finder" && target !== "vscode") {
      return NextResponse.json(
        { success: false, error: `Invalid target: ${target}` },
        { status: 400 }
      );
    }

    // Must be absolute and must not contain traversal
    if (!path.isAbsolute(dirPath) || dirPath.includes("..")) {
      return NextResponse.json(
        { success: false, error: "Invalid path" },
        { status: 400 }
      );
    }

    if (!existsSync(dirPath)) {
      return NextResponse.json(
        { success: false, error: "Path does not exist" },
        { status: 400 }
      );
    }

    const quoted = `"${dirPath.replace(/"/g, '\\"')}"`;

    if (target === "finder") {
      execSync(`open ${quoted}`, { timeout: 5_000, stdio: "pipe" });
    } else {
      execSync(`code ${quoted}`, { timeout: 5_000, stdio: "pipe" });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
