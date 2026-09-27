import handler from "virtual:nuclo-pages/handler";

// Cloudflare Workers entry (wrangler.jsonc "main"). Durable Objects can be exported from here too.
export default {
  fetch: (request: Request, env: unknown, ctx: unknown) => handler(request, { env, ctx }),
};
