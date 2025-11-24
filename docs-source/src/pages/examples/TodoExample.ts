import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo states
type Todo = { id: number; text: string; done: boolean };
let todos: Todo[] = [
  { id: 1, text: "Learn Nuclo", done: true },
  { id: 2, text: "Build something awesome", done: false },
  { id: 3, text: "Share with friends", done: false },
];
let todoInput = "";
let todoNextId = 4;

const demoStyle = cn(backgroundColor(colors.bgCard)
  .padding("32px")
  .borderRadius("16px")
  .border(`1px solid ${colors.border}`)
  .marginBottom("32px"));

const demoBtnStyle = cn(padding("10px 20px")
  .backgroundColor(colors.primary)
  .color(colors.bg)
  .border("none")
  .borderRadius("8px")
  .fontSize("14px")
  .fontWeight("600")
  .cursor("pointer")
  .transition("all 0.2s"));

const demoInputStyle = cn(padding("10px 14px")
  .backgroundColor(colors.bgLight)
  .color(colors.text)
  .border(`1px solid ${colors.border}`)
  .borderRadius("8px")
  .fontSize("14px")
  .outline("none")
  .width("220px")
  .transition("border-color 0.2s"));

function LiveTodoList() {
  const checkboxStyle = cn(width("20px").height("20px").cursor("pointer"));
  const checkboxStyleObj = { accentColor: colors.primary };

  const todoItemStyle = cn(display("flex")
    .alignItems("center")
    .gap("14px")
    .padding("14px 16px")
    .backgroundColor(colors.bgLight)
    .borderRadius("10px")
    .marginBottom("10px")
    .transition("all 0.2s"));

  const deleteBtnStyle = cn(marginLeft("auto")
    .padding("6px 10px")
    .backgroundColor("transparent")
    .color(colors.textDim)
    .border("none")
    .borderRadius("6px")
    .cursor("pointer")
    .fontSize("18px")
    .transition("all 0.2s"));

  return div(
    demoStyle,
    div(
      s.flex,
      s.gap8,
      s.mb24,
      input(
        demoInputStyle,
        {
          type: "text",
          placeholder: "Add a new task...",
          value: () => todoInput,
        },
        on("input", (e) => {
          todoInput = (e.target as HTMLInputElement).value;
          update();
        }),
        on("keydown", (e) => {
          if (e.key === "Enter" && todoInput.trim()) {
            todos.push({ id: todoNextId++, text: todoInput, done: false });
            todoInput = "";
            update();
          }
        }),
        on("focus", (e) => {
          (e.target as HTMLElement).style.borderColor = colors.primary;
        }),
        on("blur", (e) => {
          (e.target as HTMLElement).style.borderColor = colors.border;
        })
      ),
      button(
        demoBtnStyle,
        "Add Task",
        on("click", () => {
          if (todoInput.trim()) {
            todos.push({ id: todoNextId++, text: todoInput, done: false });
            todoInput = "";
            update();
          }
        }),
        on("mouseenter", (e) => {
          (e.target as HTMLElement).style.backgroundColor = colors.primaryHover;
        }),
        on("mouseleave", (e) => {
          (e.target as HTMLElement).style.backgroundColor = colors.primary;
        })
      )
    ),
    div(
      () =>
        `${todos.filter((t) => !t.done).length} remaining · ${todos.filter((t) => t.done).length} completed`,
      cn(fontSize("13px").color(colors.textDim).marginBottom("20px").fontWeight("500"))
    ),
    when(
      () => todos.length > 0,
      list(
        () => todos,
        (todo) =>
          div(
            todoItemStyle,
            input(
              checkboxStyle,
              { style: checkboxStyleObj },
              {
                type: "checkbox",
                checked: () => todo.done,
              },
              on("change", () => {
                todo.done = !todo.done;
                update();
              })
            ),
            span(
              () => todo.done
                ? cn(color(colors.textDim).textDecoration("line-through").fontSize("15px"))
                : cn(color(colors.text).fontSize("15px")),
              () => todo.text
            ),
            button(
              deleteBtnStyle,
              "×",
              on("click", () => {
                todos = todos.filter((t) => t.id !== todo.id);
                update();
              }),
              on("mouseenter", (e) => {
                (e.target as HTMLElement).style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                (e.target as HTMLElement).style.color = "#ef4444";
              }),
              on("mouseleave", (e) => {
                (e.target as HTMLElement).style.backgroundColor = "transparent";
                (e.target as HTMLElement).style.color = colors.textDim;
              })
            )
          )
      )
    ).else(
      p(
        cn(color(colors.textDim).textAlign("center").padding("32px").fontSize("15px")),
        "No tasks yet. Add one above!"
      )
    )
  );
}

export function TodoExamplePage() {
  const example = examplesContent.find(e => e.id === "todo")!;

  return div(
    s.pageContent,
    a(
      cn(color(colors.textMuted).fontSize("14px").marginBottom("16px").display("inline-block").cursor("pointer")),
      "← Back to Examples",
      on("click", (e) => {
        e.preventDefault();
        setRoute("examples");
      })
    ),
    h1(s.pageTitle, example.title),
    p(s.pageSubtitle, example.description),
    LiveTodoList(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
