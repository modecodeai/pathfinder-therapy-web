import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata = {
  title: "FAQ",
  alternates: { canonical: "/faq" }
};

export default function Page() {
  return (
    <PlaceholderPage
      title="FAQ"
      message="This page will be built in the next sprint. For now, return to the locked Arrival homepage."
    />
  );
}
