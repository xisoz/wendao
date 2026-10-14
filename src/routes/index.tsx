import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/naming/home";
import { fetchArticleList } from "@/lib/site/server-fns";

export const Route = createFileRoute("/")({
  loader: () => fetchArticleList({ data: { page: 1 } }).catch(() => null),
  component: HomeRoute,
});

function HomeRoute() {
  const data = Route.useLoaderData();
  return <Home articles={data?.items ?? []} />;
}
