import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/chrome";
import { AdminApp } from "@/components/site/admin";

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } =>
    typeof s.edit === "string" && /^(new|\d+)$/.test(s.edit) ? { edit: s.edit } : typeof s.edit === "number" ? { edit: String(s.edit) } : {},
  head: () => ({ meta: [{ title: "后台 · 问道" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { edit } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SiteShell wide>
      <AdminApp edit={edit} onEdit={(v) => navigate({ search: v ? { edit: v } : {} })} />
    </SiteShell>
  );
}
