import { getAllMcpServers } from "@/lib/mcp-registry";
import { ConnectorsPanel } from "@/components/ConnectorsPanel";

export const dynamic = "force-dynamic";

export default function ConnectorsPage() {
  const servers = getAllMcpServers();

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Connectors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover and manage MCP servers across plugins, settings, and manual configurations
        </p>
      </div>
      <ConnectorsPanel initialServers={servers} />
    </div>
  );
}
