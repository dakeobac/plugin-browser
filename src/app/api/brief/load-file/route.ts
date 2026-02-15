import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'filePath' field" },
        { status: 400 }
      );
    }

    const resolved = path.resolve(filePath);

    if (!resolved.endsWith(".md")) {
      return NextResponse.json(
        { error: "Only .md files are supported" },
        { status: 400 }
      );
    }

    const text = await readFile(resolved, "utf-8");
    const fileName = path.basename(resolved);
    const lineCount = text.split("\n").length;

    return NextResponse.json({ text, fileName, lineCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes("ENOENT") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
