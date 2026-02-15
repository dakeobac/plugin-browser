import { NextResponse } from "next/server";
import { loadAllPlugins } from "@/lib/marketplace-loader";
import { analyzePatterns } from "@/lib/pattern-analyzer";
import { generateSuggestions } from "@/lib/plugin-suggestions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { plugins } = loadAllPlugins();
    const analysis = analyzePatterns(plugins);
    const suggestions = generateSuggestions(analysis, plugins);
    return NextResponse.json({ analysis, suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
