import { ThankYouContent } from "@/components/LeadFunnelClient";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = {
  ...createPageMetadata(
    "/thank-you/",
    "Thank You | Pathfinder Therapy",
    "Your enquiry has been received securely by Pathfinder Therapy."
  ),
  robots: {
    index: false,
    follow: false
  }
};

export default function ThankYouPage() {
  return <ThankYouContent />;
}
