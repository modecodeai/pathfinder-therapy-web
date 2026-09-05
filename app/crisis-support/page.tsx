import { PlaceholderPage } from "@/components/PlaceholderPage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("/crisis-support/", "Crisis support | Pathfinder Therapy");

export default function Page() {
  return (
    <PlaceholderPage
      title="Crisis support"
      message="This page will be built in the next sprint. For now, return to the locked Arrival homepage."
    />
  );
}
