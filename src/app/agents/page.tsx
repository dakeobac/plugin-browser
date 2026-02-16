import { loadAllPlugins } from "@/lib/marketplace-loader";
import { AgentLaunchpad } from "@/components/AgentLaunchpad";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const { plugins } = loadAllPlugins();
  const withAgents = plugins.filter((p) => p.hasAgents);

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Launch, manage, and interact with autonomous agents
        </p>
      </div>
      <AgentLaunchpad plugins={withAgents.length > 0 ? withAgents : plugins} />
    </div>
  );
}
