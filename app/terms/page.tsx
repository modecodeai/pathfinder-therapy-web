import { PlaceholderPage } from "@/components/PlaceholderPage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("/terms/", "Terms | Pathfinder Therapy");

export default function Page() {
  return (
    <PlaceholderPage
      title="Terms"
      message="This page will be built in the next sprint. For now, return to the locked Arrival homepage."
    />
  );
}
