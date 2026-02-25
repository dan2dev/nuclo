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

function apiRoutes(url: string): Response | null {
	if (url === "/api/hello") {
		return Response.json({ message: "Hello from server!" });
	}
	return null;
}

if (isProd) {
	const manifestFile = Bun.file("dist/.vite/manifest.json");
	if (!(await manifestFile.exists())) {
		console.error("Error: dist/.vite/manifest.json not found. Run 'pnpm run build' first.");
		process.exit(1);
	}
	const manifest: Record<string, { file: string; css?: string[] }> = JSON.parse(
		await manifestFile.text(),
	);
	const entry = manifest["src/main.ts"];
	const cssLinks = (entry.css ?? [])
		.map((css) => `<link rel="stylesheet" href="/${css}" />`)
		.join("\n    ");

	Bun.serve({
		port,
		async fetch(req) {
			const { pathname } = new URL(req.url);

			const apiRes = apiRoutes(pathname);
			if (apiRes) return apiRes;

			// Serve static assets from dist/
			if (pathname !== "/" && pathname !== "/index.html") {
				const file = Bun.file(`dist${pathname}`);
				if (await file.exists()) return new Response(file);
			}

			// Render HTML from server.ts template with production assets injected
			const html = htmlTemplate
				.replace("{{html}}", "this is the content")
				.replace(
					'<script type="module" src="/src/main.ts"></script>',
					`${cssLinks}\n    <script type="module" src="/${entry.file}"></script>`,
				);

			return new Response(html, {
				headers: { "Content-Type": "text/html" },
			});
		},
	});
	console.log(`Server running at http://localhost:${port}`);
} else {
	const { createServer: createViteServer } = await import("vite");
	const { createServer: createHttpServer } = await import("node:http");

	const vite = await createViteServer({
		server: { middlewareMode: true },
		appType: "custom",
	});

	const server = createHttpServer((req, res) => {
		const url = req.url ?? "/";

		const apiRes = apiRoutes(url);
		if (apiRes) {
			res.writeHead(apiRes.status, {
				"Content-Type": apiRes.headers.get("Content-Type") ?? "",
			});
			apiRes.text().then((body) => res.end(body));
			return;
		}

		vite.middlewares(req, res, async () => {
			try {
				let html = await vite.transformIndexHtml(url, htmlTemplate);
				html = html.replace("{{html}}", "this is the content");
				res.writeHead(200, { "Content-Type": "text/html" });
				res.end(html);
			} catch (e) {
				if (e instanceof Error) {
					vite.ssrFixStacktrace(e);
				}
				res.writeHead(500);
				res.end(String(e));
			}
		});
	});

	server.listen(port, () => {
		console.log(`Dev server running at http://localhost:${port}`);
	});
}