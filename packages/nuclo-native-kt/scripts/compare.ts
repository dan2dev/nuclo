// usage: bun scripts/compare.ts <expected.log> <actual.log> [--structure] [--tolerance <n>]
// Compares the dump blocks (NUCLO_DUMP_BEGIN … NUCLO_DUMP_END) of two logs; everything else is ignored.
const args = process.argv.slice(2)
const structure = args.includes("--structure")
const t = args.indexOf("--tolerance")
const tolerance = t >= 0 ? Number(args[t + 1]) : 1
const files = args.filter((a, i) => !a.startsWith("--") && (t < 0 || i !== t + 1))

const blocks = async (file: string) => {
  const out: string[][] = []
  let cur: string[] | null = null
  for (const line of (await Bun.file(file).text()).split("\n")) {
    if (line.startsWith("NUCLO_DUMP_BEGIN")) cur = []
    else if (line.startsWith("NUCLO_DUMP_END")) { if (cur) out.push(cur); cur = null }
    else if (cur && line.length) cur.push(line)
  }
  return out
}

const expected = await blocks(files[0])
const actual = await blocks(files[1])
const problems: string[] = []
if (expected.length !== actual.length) problems.push(`expected ${expected.length} dumps, got ${actual.length}`)
for (let d = 0; d < Math.min(expected.length, actual.length); d++) {
  const e = expected[d], a = actual[d]
  if (e.length !== a.length) problems.push(`dump ${d + 1}: expected ${e.length} lines, got ${a.length}`)
  for (let i = 0; i < Math.min(e.length, a.length); i++) {
    const [ek, ex, ey, ew, eh, ...et] = e[i].split("|")
    const [ak, ax, ay, aw, ah, ...at] = a[i].split("|")
    const same = ek === ak && et.join("|") === at.join("|") &&
      (structure || [[ex, ax], [ey, ay], [ew, aw], [eh, ah]].every(([p, q]) => Math.abs(Number(p) - Number(q)) <= tolerance))
    if (!same) problems.push(`dump ${d + 1} line ${i + 1}: expected ${e[i]} | got ${a[i]}`)
  }
}
for (const p of problems.slice(0, 20)) console.log(p)
if (problems.length > 20) console.log(`… and ${problems.length - 20} more`)
process.exit(problems.length ? 1 : 0)
