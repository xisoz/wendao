import { createFileRoute } from "@tanstack/react-router";
import { Studio } from "@/components/naming/studio";

export const Route = createFileRoute("/name")({
  validateSearch: (s: Record<string, unknown>): { tab?: "chart" } => (s.tab === "chart" ? { tab: "chart" } : {}),
  component: NameRoute,
});

function NameRoute() {
  const { tab } = Route.useSearch();
  return <Studio initialTab={tab} />;
}
