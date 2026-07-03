import { PlaceholderPage } from "@/components/PlaceholderPage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("/faq/", "FAQ | Pathfinder Therapy");

export default function Page() {
  return (
    <PlaceholderPage
      title="FAQ"
      message="This page will be built in the next sprint. For now, return to the locked Arrival homepage."
    />
  );
}
