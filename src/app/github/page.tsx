import { isGhInstalled, getAuthenticatedAccounts } from "@/lib/github-cli";
import { scanLocalGitRepos } from "@/lib/github-sync";
import { scanPaths, marketplaces } from "../../../marketplace.config";
import { GitHubDashboard } from "@/components/GitHubDashboard";

export const dynamic = "force-dynamic";

export default function GitHubPage() {
  const ghInstalled = isGhInstalled();
  const accounts = ghInstalled ? getAuthenticatedAccounts() : [];
  const localRepos = scanLocalGitRepos(scanPaths);

  return (
    <GitHubDashboard
      initialGhInstalled={ghInstalled}
      initialAccounts={accounts}
      initialLocalRepos={localRepos}
      marketplaces={marketplaces}
    />
  );
}
