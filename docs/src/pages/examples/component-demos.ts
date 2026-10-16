/**
 * Component examples: plain functions, static and dynamic params, children,
 * lists matched by identity and nested data. Every preview counts mounts with
 * onMount, so "nothing was rebuilt" is a number on screen, not a claim.
 */
import { css, colors, cx } from "../../styles.ts";
import { es } from "./styles.ts";

export interface ComponentExample {
  id: string;
  docs: string;
  title: string;
  desc: string;
  code: string;
  preview: () => NodeModLike<"div">;
}

const mono = "ui-monospace, monospace";

const cs = {
  wrap: css("pages-examples-component-demos-wrap", { display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "400px" }),
  stats: css("pages-examples-component-demos-stats", { display: "flex", gap: "14px", fontFamily: mono, fontSize: "0.75rem", color: colors.textMuted, "& b": { color: colors.primaryInk, fontWeight: "600" } }),
  card: css("pages-examples-component-demos-card", { padding: "12px 14px", borderRadius: "10px", border: `1px solid ${colors.border}`, backgroundColor: colors.bgCard, display: "flex", flexDirection: "column", gap: "6px" }),
  cardHead: css("pages-examples-component-demos-cardHead", { display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "0.9375rem", "& small": { marginLeft: "auto", fontFamily: mono, fontWeight: "400", fontSize: "0.6875rem", color: colors.textMuted } }),
  badge: css("pages-examples-component-demos-badge", { display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 9px", borderRadius: "999px", border: `1px solid ${colors.borderLight}`, fontSize: "0.8125rem", "& b": { fontFamily: mono, color: colors.primaryInk } }),
  row: css("pages-examples-component-demos-row", { display: "flex", alignItems: "center", gap: "8px", "& input": { flex: "1", minWidth: "0", height: "36px", padding: "0 10px", borderRadius: "8px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bg, color: colors.text, fontFamily: "inherit", fontSize: "0.875rem", outline: "none", focus: { borderColor: colors.primary } } }),
  tag: css("pages-examples-component-demos-tag", { fontFamily: mono, fontSize: "0.6875rem", color: colors.textMuted, whiteSpace: "nowrap" }),
  iconBtn: css("pages-examples-component-demos-iconBtn", { width: "32px", height: "32px", borderRadius: "8px", color: colors.textMuted, fontSize: "0.875rem", hover: { color: colors.text, backgroundColor: colors.bgSecondary } }),
  small: css("pages-examples-component-demos-small", { height: "34px", padding: "0 12px", fontSize: "0.8125rem" }),
  actions: css("pages-examples-component-demos-actions", { display: "flex", flexWrap: "wrap", gap: "6px" }),
  switch: css("pages-examples-component-demos-switch", { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: colors.textDim, cursor: "pointer", "& input": { width: "16px", height: "16px", accentColor: colors.primary } }),
  tasks: css("pages-examples-component-demos-tasks", { display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "10px", borderLeft: `2px solid ${colors.border}` }),
  task: css("pages-examples-component-demos-task", { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", "& input[type=checkbox]": { accentColor: colors.primary } }),
  done: css("pages-examples-component-demos-done", { textDecoration: "line-through", color: colors.textMuted }),
  hint: css("pages-examples-component-demos-hint", { fontSize: "0.8125rem", color: colors.textDim, lineHeight: "1.55" }),
};

/**
 * Counts mounts. onMount runs during a render, so the readout refreshes a tick
 * later, and only its own scope: a full update() here would re-run the demo's
 * list() and, with identity broken on purpose, mount again forever.
 */
function mountCounter() {
  let mounts = 0;
  let scheduled = false;
  const id = `mounts-${Math.random().toString(36).slice(2, 8)}`;
  const bump = () => {
    mounts++;
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; update(id); });
  };
  return { count: () => mounts, mark: () => on("mount", bump), scope: () => scope(id) };
}

// ── Static and dynamic params ────────────────────────────────────────────

function PropsDemo() {
  const m = mountCounter();
  let updates = 0;
  let cart = 2;
  let user = { name: "Ada", plan: "Pro" };
  const price = () => cart * 9;

  // A static param is read once, when the component is built.
  // A dynamic param is a function: it is read again on every update().
  function Stat(label: string, value: () => string | number) {
    return span(cs.badge, m.mark(), label, b(() => String(value())));
  }
  function Profile(u: { name: string; plan: string }) {
    return div(cs.card, m.mark(), div(cs.cardHead, u.name, small("static: built with its values")), span(cs.tag, `plan ${u.plan}`));
  }
  function LiveProfile(u: () => { name: string; plan: string }) {
    return div(cs.card, m.mark(), div(cs.cardHead, () => u().name, small("dynamic: reads a function")), span(cs.tag, () => `plan ${u().plan}`));
  }

  const commit = () => { updates++; update(); };

  return div(
    cs.wrap,
    div(cs.stats, m.scope(), span("mounts ", b(() => String(m.count()))), span("updates ", b(() => String(updates)))),
    div(cs.actions, Stat("items", () => cart), Stat("price", () => `$${price()}`), Stat("user", () => user.name)),
    Profile(user),
    LiveProfile(() => user),
    div(
      cs.actions,
      button(es.button, cs.small, "Add item", { onClick: () => { cart++; commit(); } }),
      button(es.button, cs.small, "Rename user", { onClick: () => { user = { ...user, name: user.name === "Ada" ? "Grace" : "Ada" }; commit(); } }),
      button(es.button, cs.small, "Toggle plan", { onClick: () => { user = { ...user, plan: user.plan === "Pro" ? "Free" : "Pro" }; commit(); } }),
    ),
    p(cs.hint, "The mount count never moves: update() re-runs the functions and patches text. The static card keeps the values it was built with, by design."),
  );
}

const PROPS_CODE = `import 'nuclo'

let cart = 2
let user = { name: 'Ada', plan: 'Pro' }
let updates = 0
let mounts = 0
const price = () => cart * 9

// Every component below carries mounted(). It counts each time a node
// is built, and refreshes only the "stats" scope (not the whole page).
const mounted = () =>
  on('mount', () => {
    mounts++
    queueMicrotask(() => update('stats'))
  })
const commit = () => { updates++; update() }
const row = { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } }

// A component is a plain function. What it is passed decides what
// can change later:
//   a value     is read once, when the component is built
//   a function  is a dynamic value, read again on every update()
// Either way the component itself runs once. update() never calls
// it again; it only re-runs the functions inside it.

function Stat(label: string, value: () => string | number) {
  return span(mounted(), label, ' ', b(() => String(value())))
}

// Static: built with a snapshot. Rename the user and it stays "Ada".
function Profile(u: { name: string; plan: string }) {
  return div(
    mounted(),
    div(h3(u.name), small('static: built with its values')),
    span(\`plan \${u.plan}\`),
  )
}

// Dynamic: reads through a function, so a new user object shows up.
function LiveProfile(u: () => { name: string; plan: string }) {
  return div(
    mounted(),
    div(h3(() => u().name), small('dynamic: reads a function')),
    span(() => \`plan \${u().plan}\`),
  )
}

export const App = () =>
  div(
    div(scope('stats'), span('mounts ', b(() => String(mounts))), span('updates ', b(() => String(updates)))),
    div(row, Stat('items', () => cart), Stat('price', () => \`$\${price()}\`), Stat('user', () => user.name)),
    Profile(user),
    LiveProfile(() => user),
    div(
      row,
      button('Add item', { onClick: () => { cart++; commit() } }),
      button('Rename user', {
        onClick: () => { user = { ...user, name: user.name === 'Ada' ? 'Grace' : 'Ada' }; commit() },
      }),
      button('Toggle plan', {
        onClick: () => { user = { ...user, plan: user.plan === 'Pro' ? 'Free' : 'Pro' }; commit() },
      }),
    ),
    p('The mount count never moves: update() re-runs the functions and patches text. The static card keeps the values it was built with, by design.'),
  )`;

// ── Children and modifiers ───────────────────────────────────────────────

function ChildrenDemo() {
  const m = mountCounter();
  let open = true;
  let saved = 0;

  // Children are anything a tag builder accepts: builders, text, attributes,
  // modifiers. The component passes them on with a spread.
  function Card(title: string | (() => string), ...children: NodeModLike<"div">[]) {
    return div(cs.card, m.mark(), div(cs.cardHead, title, small("Card")), ...children);
  }
  // A modifier receives the element and runs once: here it sets a title.
  const tooltip = (text: string) => (el: ExpandedElement<"div">) => { el.title = text; };

  return div(
    cs.wrap,
    div(cs.stats, m.scope(), span("mounts ", b(() => String(m.count())))),
    Card(
      "Settings",
      p(cs.hint, "Children, text, an attribute object and a modifier, all passed through."),
      { "data-section": "settings" },
      tooltip("Hover: a modifier set this title"),
      div(cs.actions, button(es.button, cs.small, () => `Saved ${saved}×`, { onClick: () => { saved++; update(); } })),
    ),
    Card(
      () => (open ? "Details (open)" : "Details (closed)"),
      when(() => open, p(cs.hint, "This paragraph is inside a when(): closing removes it, opening builds it again. The card around it stays.")),
      div(cs.actions, button(es.button, cs.small, () => (open ? "Close" : "Open"), { onClick: () => { open = !open; update(); } })),
    ),
  );
}

const CHILDREN_CODE = `import 'nuclo'

let open = true
let saved = 0
let mounts = 0

// Counts every Card built, refreshing only the "stats" scope.
const mounted = () =>
  on('mount', () => {
    mounts++
    queueMicrotask(() => update('stats'))
  })
const row = { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } }

// Children are whatever a tag builder accepts: builders, text, attribute
// objects and modifiers. A component forwards them with a spread, so a
// caller can add attributes or hooks without the component knowing.
function Card(title: string | (() => string), ...children: NodeModLike<'div'>[]) {
  return div(mounted(), div(h3(title), small('Card')), ...children)
}

// A modifier is a function with a parameter: it gets the element once.
const tooltip = (text: string) => (el: ExpandedElement<'div'>) => {
  el.title = text
}

export const App = () =>
  div(
    div(scope('stats'), span('mounts ', b(() => String(mounts)))),
    Card(
      'Settings',
      p('Children, text, an attribute object and a modifier, all passed through.'),
      { 'data-section': 'settings' },
      tooltip('Hover: a modifier set this title'),
      div(row, button(() => \`Saved \${saved}×\`, {
        onClick: () => { saved++; update() },
      })),
    ),
    Card(
      () => (open ? 'Details (open)' : 'Details (closed)'), // dynamic title
      // Conditional children go in when(): the card is never rebuilt.
      when(() => open, p('This paragraph is inside a when(): closing removes it, opening builds it again. The card around it stays.')),
      div(row, button(() => (open ? 'Close' : 'Open'), {
        onClick: () => { open = !open; update() },
      })),
    ),
  )`;

// ── List identity ────────────────────────────────────────────────────────

interface Person { id: number; name: string }

function ListDemo() {
  const m = mountCounter();
  let people: Person[] = [
    { id: 1, name: "Ada" }, { id: 2, name: "Grace" }, { id: 3, name: "Linus" },
  ];
  let nextId = 4;
  let clone = false;

  // With the switch on, every update() hands list() fresh copies of the
  // objects. They are not the same items any more, so every row is rebuilt.
  const items = () => (clone ? people.map((p) => ({ ...p })) : people);

  function Row(p: Person) {
    return div(
      cs.row,
      m.mark(),
      span(cs.tag, `#${p.id}`),
      input({ placeholder: `Type here: ${p.name}`, "aria-label": `Note for ${p.name}` }),
      span(() => p.name),
      button(cs.iconBtn, { "aria-label": `Remove ${p.name}` }, "✕", { onClick: () => { people = people.filter((x) => x.id !== p.id); update(); } }),
    );
  }

  return div(
    cs.wrap,
    div(cs.stats, m.scope(), span("rows ", b(() => String(people.length))), span("mounts ", b(() => String(m.count())))),
    list(items, Row),
    div(
      cs.actions,
      button(es.button, cs.small, "Reverse", { onClick: () => { people = [...people].reverse(); update(); } }),
      button(es.button, cs.small, "Sort by name", { onClick: () => { people = [...people].sort((a, b) => a.name.localeCompare(b.name)); update(); } }),
      button(es.button, cs.small, "Insert at top", { onClick: () => { people = [{ id: nextId, name: `Person ${nextId++}` }, ...people]; update(); } }),
      button(es.button, cs.small, "Rename first", { onClick: () => { people[0].name += "!"; update(); } }),
    ),
    label(cs.switch, input({ type: "checkbox" }, { checked: () => clone }, { onChange: () => { clone = !clone; update(); } }), "Clone the objects on every update (breaks identity)"),
    p(cs.hint, "Type into a row, then reorder or insert: the row keeps its input and its focus, and the mount count only grows by what was inserted. Flip the switch and every change rebuilds every row."),
  );
}

const LIST_CODE = `import 'nuclo'

interface Person { id: number; name: string }

let people: Person[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
  { id: 3, name: 'Linus' },
]
let nextId = 4
let clone = false
let mounts = 0

// Counts every row built, refreshing only the "stats" scope.
const mounted = () =>
  on('mount', () => {
    mounts++
    queueMicrotask(() => update('stats'))
  })
const row = { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } }

// list() matches rows to items by identity (===). A row whose item is
// still in the array is kept: its DOM, its input's text, its focus.
// Reordering moves the same nodes. Only new items build new rows.
// With the switch on, every update() hands list() fresh copies of the
// objects. They are not the same items any more, so every row is rebuilt.
const items = () => (clone ? people.map((p) => ({ ...p })) : people)

function Row(p: Person) {
  return div(
    mounted(),
    { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
    small(\`#\${p.id}\`),
    input({ placeholder: \`Type here: \${p.name}\`, 'aria-label': \`Note for \${p.name}\` }),
    span(() => p.name),   // dynamic: a rename shows without a rebuild
    button('✕', {
      'aria-label': \`Remove \${p.name}\`,
      onClick: () => { people = people.filter((x) => x.id !== p.id); update() },
    }),
  )
}

export const App = () =>
  div(
    div(scope('stats'), span('rows ', b(() => String(people.length))), span('mounts ', b(() => String(mounts)))),
    list(items, Row),
    div(
      row,
      button('Reverse', {
        onClick: () => { people = [...people].reverse(); update() },
      }),
      button('Sort by name', {
        onClick: () => { people = [...people].sort((a, b) => a.name.localeCompare(b.name)); update() },
      }),
      button('Insert at top', {
        onClick: () => {
          people = [{ id: nextId, name: \`Person \${nextId++}\` }, ...people]
          update()
        },
      }),
      // Mutate the item in place: the row is kept and the text updates.
      button('Rename first', {
        onClick: () => { people[0].name += '!'; update() },
      }),
    ),
    // The pitfall: new objects every update are new items to list(),
    // so every row is torn down and rebuilt, and typed text is lost.
    label(
      input({ type: 'checkbox' }, { checked: () => clone }, { onChange: () => { clone = !clone; update() } }),
      'Clone the objects on every update (breaks identity)',
    ),
    p('Type into a row, then reorder or insert: the row keeps its input and its focus, and the mount count only grows by what was inserted. Flip the switch and every change rebuilds every row.'),
  )`;

// ── Nested data ──────────────────────────────────────────────────────────

interface Task { id: number; title: string; done: boolean }
interface Member { id: number; name: string; tasks: Task[] }

function TreeDemo() {
  const m = mountCounter();
  let nextId = 100;
  const team: { name: string; members: Member[] } = {
    name: "Core",
    members: [
      { id: 1, name: "Ada", tasks: [{ id: 11, title: "Write the parser", done: true }, { id: 12, title: "Review PR 42", done: false }] },
      { id: 2, name: "Grace", tasks: [{ id: 21, title: "Ship 0.4", done: false }] },
    ],
  };

  // One component per level. Each reads its own object and renders the
  // next level with list(), so a change deep down patches only its node.
  function TaskRow(member: Member, task: Task) {
    return div(
      cs.task,
      m.mark(),
      input({ type: "checkbox", "aria-label": task.title }, { checked: () => task.done }, { onChange: () => { task.done = !task.done; update(); } }),
      span({ className: () => cx(task.done ? cs.done : null).className }, () => task.title),
      button(cs.iconBtn, { "aria-label": `Remove ${task.title}` }, "✕", { onClick: () => { member.tasks = member.tasks.filter((t) => t !== task); update(); } }),
    );
  }
  function MemberCard(member: Member) {
    const open = () => member.tasks.filter((t) => !t.done).length;
    return div(
      cs.card,
      m.mark(),
      div(cs.cardHead, () => member.name, small(() => `${open()} open of ${member.tasks.length}`)),
      div(cs.tasks, list(() => member.tasks, (t) => TaskRow(member, t))),
      div(
        cs.actions,
        button(es.button, cs.small, "Add task", { onClick: () => { member.tasks.push({ id: nextId, title: `Task ${nextId++}`, done: false }); update(); } }),
        button(es.button, cs.small, "Rename", { onClick: () => { member.name = member.name.endsWith("!") ? member.name.slice(0, -1) : `${member.name}!`; update(); } }),
      ),
    );
  }

  const allOpen = () => team.members.reduce((n, mem) => n + mem.tasks.filter((t) => !t.done).length, 0);

  return div(
    cs.wrap,
    div(cs.stats, m.scope(), span("open tasks ", b(() => String(allOpen()))), span("mounts ", b(() => String(m.count())))),
    list(() => team.members, MemberCard),
    div(
      cs.actions,
      button(es.button, cs.small, "Swap members", { onClick: () => { team.members.reverse(); update(); } }),
      button(es.button, cs.small, "Add member", { onClick: () => { team.members.push({ id: nextId, name: `Member ${nextId++}`, tasks: [] }); update(); } }),
    ),
    p(cs.hint, "Check a task, rename a member or swap the cards: the counts at every level follow, and the mount count only grows for what was actually added."),
  );
}

const TREE_CODE = `import 'nuclo'

interface Task { id: number; title: string; done: boolean }
interface Member { id: number; name: string; tasks: Task[] }

let nextId = 100
let mounts = 0
const team: { name: string; members: Member[] } = {
  name: 'Core',
  members: [
    { id: 1, name: 'Ada', tasks: [
      { id: 11, title: 'Write the parser', done: true },
      { id: 12, title: 'Review PR 42', done: false },
    ] },
    { id: 2, name: 'Grace', tasks: [
      { id: 21, title: 'Ship 0.4', done: false },
    ] },
  ],
}

// Counts every node built, refreshing only the "stats" scope.
const mounted = () =>
  on('mount', () => {
    mounts++
    queueMicrotask(() => update('stats'))
  })
const row = { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } }

// One component per level of the data. Each takes its own object and
// renders the level below with list(). Derived numbers are functions
// over the same objects, so they follow every change with no bookkeeping.

function TaskRow(member: Member, task: Task) {
  return div(
    mounted(),
    { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
    input({
      type: 'checkbox',
      checked: () => task.done,
      onChange: () => { task.done = !task.done; update() },
    }),
    span(
      { style: () => ({ textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? '0.5' : '1' }) },
      () => task.title,
    ),
    button('✕', {
      'aria-label': \`Remove \${task.title}\`,
      onClick: () => {
        member.tasks = member.tasks.filter((t) => t !== task)
        update()
      },
    }),
  )
}

function MemberCard(member: Member) {
  const open = () => member.tasks.filter((t) => !t.done).length
  return div(
    mounted(),
    div(h3(() => member.name), small(() => \`\${open()} open of \${member.tasks.length}\`)),
    div(
      { style: { display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '10px', borderLeft: '2px solid #ddd' } },
      list(() => member.tasks, (t) => TaskRow(member, t)),
    ),
    div(
      row,
      button('Add task', {
        onClick: () => {
          member.tasks.push({ id: nextId, title: \`Task \${nextId++}\`, done: false })
          update()
        },
      }),
      button('Rename', {
        onClick: () => {
          member.name = member.name.endsWith('!') ? member.name.slice(0, -1) : \`\${member.name}!\`
          update()
        },
      }),
    ),
  )
}

const allOpen = () =>
  team.members.reduce((n, m) => n + m.tasks.filter((t) => !t.done).length, 0)

export const Team = () =>
  div(
    div(scope('stats'), span('open tasks ', b(() => String(allOpen()))), span('mounts ', b(() => String(mounts)))),
    list(() => team.members, MemberCard),
    div(
      row,
      // The cards are the same nodes after the swap: list() moves them.
      button('Swap members', {
        onClick: () => { team.members.reverse(); update() },
      }),
      button('Add member', {
        onClick: () => {
          team.members.push({ id: nextId, name: \`Member \${nextId++}\`, tasks: [] })
          update()
        },
      }),
    ),
    p('Check a task, rename a member or swap the cards: the counts at every level follow, and the mount count only grows for what was actually added.'),
  )`;

export const COMPONENT_EXAMPLES: ComponentExample[] = [
  { id: "component-props", docs: "components", title: "Static & Dynamic Params", desc: "A value param is read once, when the component is built. A function param is read on every update(). The component itself runs once either way, and the mount count proves it.", code: PROPS_CODE, preview: PropsDemo },
  { id: "component-children", docs: "components", title: "Children & Modifiers", desc: "A component forwards its children with a spread: builders, text, attribute objects and modifiers. Conditional parts go in when(), so the component around them is never rebuilt.", code: CHILDREN_CODE, preview: ChildrenDemo },
  { id: "component-list", docs: "api-list", title: "List Identity", desc: "list() keeps a row while its item is in the array: reorder, insert and rename without losing inputs or focus. A switch clones the objects on every update to show what breaking identity costs.", code: LIST_CODE, preview: ListDemo },
  { id: "component-tree", docs: "api-list", title: "Nested Data", desc: "A team with members with tasks: one component per level, nested list() calls, derived counts as functions over the same objects. Deep changes patch only their own nodes.", code: TREE_CODE, preview: TreeDemo },
];
