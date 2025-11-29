import"./nuclo-DGvy5emh.js";import{s as e,c as o,a as t}from"./index-j9rk5y6I.js";import{C as i,I as n}from"./CodeBlock-oAw7VzQV.js";function c(){return div(e.pageContent,h1(e.pageTitle,"Common Pitfalls"),p(e.pageSubtitle,"Avoid these common mistakes when building with Nuclo. Learn the patterns that work and why."),h2(e.h2,{id:"conditional-elements"},"Conditional Element Rendering"),div(o(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(o(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(e.p,"Using a reactive function to conditionally return different elements won't work:"),i(`// ❌ Wrong - reactive function returning elements won't render
button(
  () => isOpen ? CloseIcon() : MenuIcon()  // This won't display anything!
)`,"typescript"),h3(o(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(e.p,"Use ",n("when()")," for conditional element rendering:"),i(`// ✅ Correct - use when() for conditional elements
button(
  when(() => isOpen, CloseIcon()).else(MenuIcon())
)`,"typescript"),h3(o(fontSize("16px").fontWeight("600").color(t.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(e.p,"Reactive functions ",n("() => value")," work great for text content and attribute values because Nuclo can update them in place. But elements need to be mounted/unmounted from the DOM, which requires ",n("when()")," to manage properly.")),h2(e.h2,{id:"forgetting-update"},"Forgetting to Call update()"),div(o(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(o(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(e.p,"Changing state without calling ",n("update()")," won't refresh the UI:"),i(`// ❌ Wrong - UI won't update
let count = 0;

button('Increment', on('click', () => {
  count++;  // State changed but UI stays the same
}))`,"typescript"),h3(o(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(e.p,"Always call ",n("update()")," after changing state:"),i(`// ✅ Correct - call update() to refresh
let count = 0;

button('Increment', on('click', () => {
  count++;
  update();  // Now the UI will reflect the new count
}))`,"typescript")),h2(e.h2,{id:"list-identity"},"Replacing Objects in Lists"),div(o(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(o(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(e.p,"Replacing objects instead of mutating them causes unnecessary DOM recreation:"),i(`// ❌ Wrong - creates a new object, element will be recreated
todos[0] = { ...todos[0], done: true };
update();`,"typescript"),h3(o(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(e.p,"Mutate the existing object to preserve its DOM element:"),i(`// ✅ Correct - mutate the object, element is preserved
todos[0].done = true;
update();`,"typescript"),h3(o(fontSize("16px").fontWeight("600").color(t.textMuted).marginTop("20px").marginBottom("12px")),"Why?"),p(e.p,"Nuclo's ",n("list()")," tracks items by object identity (reference). When you replace an object with a new one, Nuclo sees it as a different item and recreates the DOM element. Mutating preserves identity and enables efficient updates.")),h2(e.h2,{id:"multiple-updates"},"Multiple update() Calls"),div(o(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(o(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(e.p,"Calling ",n("update()")," multiple times is wasteful:"),i(`// ❌ Inefficient - 3 updates instead of 1
function handleSubmit() {
  user.name = 'Alice';
  update();
  user.email = 'alice@example.com';
  update();
  user.age = 30;
  update();
}`,"typescript"),h3(o(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(e.p,"Batch all state changes, then call ",n("update()")," once:"),i(`// ✅ Efficient - batch changes, single update
function handleSubmit() {
  user.name = 'Alice';
  user.email = 'alice@example.com';
  user.age = 30;
  update();  // One update for all changes
}`,"typescript")),h2(e.h2,{id:"static-vs-reactive"},"Static Values Instead of Reactive"),div(o(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`).marginBottom("24px")),h3(o(fontSize("16px").fontWeight("600").color("#ef4444").marginBottom("12px")),"The Problem"),p(e.p,"Using a static value when you need it to update:"),i(`// ❌ Wrong - count is captured once, never updates
let count = 0;

div(
  \`Count: \${count}\`  // Always shows "Count: 0"
)`,"typescript"),h3(o(fontSize("16px").fontWeight("600").color(t.primary).marginTop("20px").marginBottom("12px")),"The Solution"),p(e.p,"Wrap in a function to make it reactive:"),i(`// ✅ Correct - function is called on each update()
let count = 0;

div(
  () => \`Count: \${count}\`  // Updates when count changes
)`,"typescript")),h2(e.h2,{id:"summary"},"Quick Reference"),div(o(padding("20px").backgroundColor(t.bgCard).borderRadius("12px").border(`1px solid ${t.border}`)),ul(e.ul,li(e.li,strong("Conditional elements:")," Use ",n("when()"),", not ",n("() => condition ? A : B")),li(e.li,strong("State changes:")," Always call ",n("update()")," after modifying state"),li(e.li,strong("Lists:")," Mutate objects, don't replace them"),li(e.li,strong("Batching:")," Group state changes before a single ",n("update()")),li(e.li,strong("Dynamic content:")," Wrap in ",n("() =>")," to make reactive"))))}export{c as PitfallsPage};
