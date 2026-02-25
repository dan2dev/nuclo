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

	Bun.serve({
		port,
		async fetch(req) {
			const url = new URL(req.url);

			const apiRes = apiRoutes(url.pathname);
			if (apiRes) return apiRes;

			if (url.pathname !== "/" && url.pathname !== "/index.html") {
				const file = Bun.file(`dist${url.pathname}`);
				if (await file.exists()) return new Response(file);
			}

			const params = Object.fromEntries(url.searchParams);
			const cookies = parseCookies(req.headers.get("cookie") ?? "");
			const html = htmlTemplate
				.replace("{{html}}", renderPage(req.url, params, cookies))
				.replace('<script type="module" src="/src/main.ts"></script>', prodAssets);

			return new Response(html, { headers: { "Content-Type": "text/html" } });
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
					return () => {
						server.middlewares.use(async (req, res, next) => {
							const url = new URL(req.url ?? "/", `http://localhost:${port}`);

							const apiRes = apiRoutes(url.pathname);
							if (apiRes) {
								res.writeHead(apiRes.status, { "Content-Type": apiRes.headers.get("Content-Type") ?? "" });
								res.end(await apiRes.text());
								return;
							}

							try {
								const params = Object.fromEntries(url.searchParams);
								const cookies = parseCookies(req.headers["cookie"] ?? "");
								let html = await server.transformIndexHtml(req.url ?? "/", htmlTemplate);
								html = html.replace("{{html}}", renderPage(url.href, params, cookies));
								res.writeHead(200, { "Content-Type": "text/html" });
								res.end(html);
							} catch (e) {
								if (e instanceof Error) server.ssrFixStacktrace(e);
								next(e);
							}
						});
					};
				},
			},
		],
	});

	await vite.listen();
	vite.printUrls();
}