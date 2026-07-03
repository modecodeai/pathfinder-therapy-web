import { PlaceholderPage } from "@/components/PlaceholderPage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("/contact/", "Contact | Pathfinder Therapy");

export default function Page() {
  return <PlaceholderPage title="Coming soon." eyebrow="Contact" />;
}
