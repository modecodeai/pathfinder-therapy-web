import Link from "next/link";

type PlaceholderPageProps = {
  title: string;
  eyebrow?: string;
  message?: string;
};

export function PlaceholderPage({
  title,
  eyebrow = "Pathfinder Therapy",
  message = "This page will follow the locked Pathfinder Design Language 1.0."
}: PlaceholderPageProps) {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">
        ← Pathfinder
      </Link>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{message}</p>
    </main>
  );
}
