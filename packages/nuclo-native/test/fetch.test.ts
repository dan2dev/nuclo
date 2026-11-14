// fetch() over the host's one call (src/fetch.ts): the request it makes, and what each answer settles to.
import { expect, test } from "bun:test";

const g = globalThis;
const asked: unknown[][] = [];
g.__nuclo_host = () => {};
g.__nuclo_fetch = (...request: unknown[]) => void asked.push(request);
await import("../src/index");
const { hostFetch } = await import("../src/fetch");

const answer = (json: object) => g.__nuclo_event(asked.at(-1)![0] as number, "fetch", JSON.stringify(json));

test("a request reaches the host with its method, headers and body", async () => {
  const pending = hostFetch("https://example.test/people", { method: "post", headers: { "Content-Type": "application/json" }, body: '{"a":1}' });
  expect(asked.at(-1)!.slice(1)).toEqual(["POST", "https://example.test/people", '{"Content-Type":"application/json"}', '{"a":1}']);
  answer({ status: 201, statusText: "Created", url: "https://example.test/people", headers: { "content-type": "application/json" }, body: '{"id":7}' });
  const response = await pending;
  expect([response.ok, response.status, response.headers.get("Content-Type")]).toEqual([true, 201, "application/json"]);
  expect(await response.json()).toEqual({ id: 7 });
});

test("an error status is an answer; no answer rejects", async () => {
  const missing = hostFetch("https://example.test/none");
  expect(asked.at(-1)!.slice(1)).toEqual(["GET", "https://example.test/none", "{}", undefined]);
  answer({ status: 404, statusText: "Not Found", url: "https://example.test/none", headers: {}, body: "gone" });
  const response = await missing;
  expect([response.ok, response.status, await response.text()]).toEqual([false, 404, "gone"]);

  const offline = hostFetch("https://example.test/offline");
  answer({ error: "Unable to resolve host" });
  await expect(offline).rejects.toThrow("Unable to resolve host");
});
