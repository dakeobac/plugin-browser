import { NextResponse } from "next/server";
import { execSync } from "child_process";

const validActions = ["install", "uninstall", "enable", "disable"] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, cliName } = body;

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action: ${action}` },
        { status: 400 }
      );
    }

    if (!cliName || !/^[\w-]+@[\w-]+$/.test(cliName)) {
      return NextResponse.json(
        { success: false, error: `Invalid cliName: ${cliName}` },
        { status: 400 }
      );
    }

    execSync(`claude plugin ${action} ${cliName}`, {
      timeout: 30_000,
      stdio: "pipe",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
