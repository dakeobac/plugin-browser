import { NextResponse } from "next/server";
import { isGhInstalled, getAuthenticatedAccounts } from "@/lib/github-cli";

export async function GET() {
  const ghInstalled = isGhInstalled();
  const accounts = ghInstalled ? getAuthenticatedAccounts() : [];

  return NextResponse.json({ ghInstalled, accounts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "refresh") {
      const ghInstalled = isGhInstalled();
      const accounts = ghInstalled ? getAuthenticatedAccounts() : [];
      return NextResponse.json({ ghInstalled, accounts });
    }

    return NextResponse.json(
      { error: `Unknown action: ${body.action}` },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
