import { createFileRoute } from "@tanstack/react-router";

async function handle({ request }: { request: Request }) {
  const [{ handleAdmin, sharedLimiter }, { getSql }] = await Promise.all([import("@/lib/site/admin-api"), import("@/lib/db")]);
  return handleAdmin(request, { getSql, limiter: sharedLimiter });
}

export const Route = createFileRoute("/api/admin/$")({
  server: { handlers: { GET: handle, POST: handle, PUT: handle, DELETE: handle } },
});
