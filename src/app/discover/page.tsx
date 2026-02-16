import { marketplaces } from "../../../marketplace.config";
import { DiscoverLoader } from "@/components/DiscoverLoader";

export default function DiscoverPage() {
  return <DiscoverLoader marketplaces={marketplaces} />;
}
