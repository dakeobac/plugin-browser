import { EcosystemBrowser } from "@/components/EcosystemBrowser";

export const dynamic = "force-dynamic";

export default function EcosystemPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Ecosystem</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover and install plugins from the public registry. Publish your own plugins to share with the community.
        </p>
      </div>
      <EcosystemBrowser />
    </div>
  );
}
