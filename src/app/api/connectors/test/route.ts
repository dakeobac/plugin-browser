import { NextRequest } from "next/server";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { command, args = [], env } = body as {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  };

  if (!command) {
    return Response.json({ error: "command is required" }, { status: 400 });
  }

  try {
    const result = await testMcpServer(command, args, env);
    return Response.json(result);
  } catch (err) {
    return Response.json({
      success: false,
      error: (err as Error).message,
    });
  }
}

function testMcpServer(
  command: string,
  args: string[],
  env?: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const timeout = 5000;

    const proc = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill();
      resolve({ success: true }); // If it stays alive for 5s, it's running
    }, timeout);

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({ success: false, error: err.message });
    });

    proc.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
        });
      }
    });

    // Send JSON-RPC initialize to see if it responds
    const initMsg = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "engram-test", version: "1.0.0" },
      },
    });
    proc.stdin.write(initMsg + "\n");
  });
}
