import { renderPage } from "./render.ts";

const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 5173);

const htmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>poc02</title>
  </head>
  <body>
    <div id="app">{{html}}</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`;

// --- Helpers ---

function parseCookies(cookieHeader: string): Record<string, string> {
	return Object.fromEntries(
		cookieHeader
			.split(";")
			.map((c) => c.trim())
			.filter(Boolean)
			.map((c) => {
				const [key, ...rest] = c.split("=");
				return [key.trim(), decodeURIComponent(rest.join("="))];
			}),
	);
}

function apiRoutes(pathname: string): Response | null {
	if (pathname === "/api/hello") {
		return Response.json({ message: "Hello from server!" });
	}
	return null;
}

// --- Unified app handler ---
//
// All business logic lives here, written with Web-standard Request/Response.
// `transformHtml` injects environment-specific assets into the template:
//   - dev:  server.transformIndexHtml() — Vite injects HMR client + transforms imports
//   - prod: simple string replace with hashed asset paths from the manifest

async function appFetch(
	req: Request,
	transformHtml: (template: string, url: string) => Promise<string>,
): Promise<Response> {
	const url = new URL(req.url);

	const apiRes = apiRoutes(url.pathname);
	if (apiRes) return apiRes;

	const params = Object.fromEntries(url.searchParams);
	const cookies = parseCookies(req.headers.get("cookie") ?? "");
	const html = (await transformHtml(htmlTemplate, url.pathname)).replace(
		"{{html}}",
		renderPage(req.url, params, cookies),
	);

	return new Response(html, { headers: { "Content-Type": "text/html" } });
}

// --- Gzip compression ---

function shouldGzip(contentType: string): boolean {
	return /text\/|application\/(javascript|json|xml)|image\/svg/.test(contentType);
}

async function gzipResponse(req: Request, res: Response): Promise<Response> {
	const acceptEncoding = req.headers.get("accept-encoding") ?? "";
	if (!acceptEncoding.includes("gzip")) return res;
	const contentType = res.headers.get("Content-Type") ?? "";
	if (!shouldGzip(contentType)) return res;

	const compressed = Bun.gzipSync(new Uint8Array(await res.arrayBuffer()));
	const headers = new Headers(res.headers);
	headers.set("Content-Encoding", "gzip");
	headers.set("Vary", "Accept-Encoding");
	headers.delete("Content-Length");

	return new Response(compressed, { status: res.status, headers });
}

// --- Production ---

if (isProd) {
	const manifestFile = Bun.file("dist/.vite/manifest.json");

	if (!(await manifestFile.exists())) {
		console.error("Error: dist/.vite/manifest.json not found. Run 'bun run build' first.");
		process.exit(1);
	}

	const manifest: Record<string, { file: string; css?: string[] }> = JSON.parse(await manifestFile.text());
	const entry = manifest["src/main.ts"];
	const cssLinks = (entry.css ?? []).map((css) => `<link rel="stylesheet" href="/${css}" />`).join("\n    ");
	const prodAssets = `${cssLinks}\n    <script type="module" src="/${entry.file}"></script>`;

	const transformHtml = async (html: string) =>
		html.replace('<script type="module" src="/src/main.ts"></script>', prodAssets);

	Bun.serve({
		port,
		async fetch(req) {
			const { pathname } = new URL(req.url);

			if (pathname !== "/" && pathname !== "/index.html") {
				const file = Bun.file(`dist${pathname}`);
				if (await file.exists()) return gzipResponse(req, new Response(file));
			}

			return gzipResponse(req, await appFetch(req, transformHtml));
		},
	});

	console.log(`Server running at http://localhost:${port}`);
}

// --- Development ---

else {
	const { createServer } = await import("vite");

	const vite = await createServer({
		server: { port },
		appType: "custom",
		plugins: [
			{
				name: "dev-server",
				configureServer(server) {
					// Returning a function makes this middleware run AFTER Vite's internal
					// handlers (transform, HMR, static assets), so only unhandled requests
					// (page navigations) reach our handler.
					return () =>
						server.middlewares.use(async (nodeReq, nodeRes, next) => {
							try {
								const origin = `http://${nodeReq.headers.host ?? `localhost:${port}`}`;
								const req = new Request(`${origin}${nodeReq.url ?? "/"}`, {
									method: nodeReq.method,
									headers: nodeReq.headers as HeadersInit,
								});

								const res = await appFetch(req, (html, url) =>
									server.transformIndexHtml(url, html),
								);

								nodeRes.writeHead(res.status, Object.fromEntries(res.headers.entries()));
								nodeRes.end(await res.text());
							} catch (e) {
								if (e instanceof Error) server.ssrFixStacktrace(e);
								next(e);
							}
						});
				},
			},
		],
	});

	await vite.listen();
	vite.printUrls();
}