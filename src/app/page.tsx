import { loadAllPlugins } from "@/lib/marketplace-loader";
import { getAllAgents } from "@/lib/agent-registry";
import { listTeams } from "@/lib/team-store";
import { listWorkflows } from "@/lib/workflow-store";
import { getObservatoryStats } from "@/lib/observatory-stats";
import { getRecentLogs } from "@/lib/log-store";
import { generateConversationStarters } from "@/lib/chip-generator";
import { EngramDashboard } from "@/components/EngramDashboard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { plugins } = loadAllPlugins();
  const agents = getAllAgents();
  const teams = listTeams();
  const workflows = listWorkflows();
  const stats = getObservatoryStats(1);
  const recentLogs = getRecentLogs(15);
  const installed = plugins.filter((p) => p.installInfo?.isInstalled);
  const starters = generateConversationStarters(plugins);

  return (
    <EngramDashboard
      agents={agents}
      teams={teams}
      workflows={workflows}
      installedPlugins={installed}
      observatoryStats={stats}
      recentLogs={recentLogs}
      starters={starters}
    />
  );
}
