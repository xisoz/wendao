import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/uploads/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { readUpload } = await import("@/lib/site/upload");
        const f = await readUpload(params.name);
        if (!f) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(f.buf), {
          headers: {
            "content-type": f.mime,
            "cache-control": "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff",
            "content-security-policy": "default-src 'none'",
          },
        });
      },
    },
  },
});
