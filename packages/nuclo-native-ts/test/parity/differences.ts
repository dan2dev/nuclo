/** Comparing a target's output with bun's (test/parity.test.ts, test/devices.test.ts). */

/** `## name` blocks of a harness's output, in order. */
export function blocks(text: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  let lines: string[] = [];
  for (const line of text.replace(/\n$/, "").split("\n")) {
    if (line.startsWith("## ")) out.set(line.slice(3), (lines = []));
    else lines.push(line);
  }
  return out;
}

/** Every check that differs, with its first differing line; "" when the outputs are the same. */
export function differences(expected: string, actual: string): string {
  const want = blocks(expected);
  const got = blocks(actual);
  const found: string[] = [];
  for (const [name, lines] of want) {
    const have = got.get(name);
    if (!have) {
      found.push(`${name}: missing`);
      continue;
    }
    const i = lines.findIndex((l, i) => l !== have[i]);
    if (i >= 0) found.push(`${name}, line ${i + 1}:\n    bun:    ${JSON.stringify(lines[i])}\n    target: ${JSON.stringify(have[i] ?? "(no line)")}`);
    else if (have.length > lines.length) found.push(`${name}, line ${lines.length + 1}: extra line ${JSON.stringify(have[lines.length])}`);
  }
  for (const name of got.keys()) if (!want.has(name)) found.push(`${name}: not in bun's output`);
  return found.join("\n");
}
