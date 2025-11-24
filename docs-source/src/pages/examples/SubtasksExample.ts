import "nuclo";
import { cn, s, colors } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { examplesContent } from "../../content/examples.ts";
import { setRoute } from "../../router.ts";

// Live demo state
type Task = {
  id: number;
  text: string;
  done: boolean;
  subtasks: Task[];
  expanded: boolean;
};

let tasks: Task[] = [
  {
    id: 1,
    text: "Learn Nuclo basics",
    done: true,
    expanded: true,
    subtasks: [
      { id: 2, text: "Read documentation", done: true, expanded: true, subtasks: [] },
      { id: 3, text: "Try examples", done: false, expanded: true, subtasks: [] },
    ]
  },
  {
    id: 4,
    text: "Build a project",
    done: false,
    expanded: true,
    subtasks: [
      { id: 5, text: "Setup environment", done: true, expanded: true, subtasks: [] },
      { id: 6, text: "Write components", done: false, expanded: true, subtasks: [] },
    ]
  },
];
let nextId = 7;
let mainInputText = "";

// Styles
const demoStyle = cn(
  backgroundColor(colors.bgCard)
    .padding("32px")
    .borderRadius("16px")
    .border(`1px solid ${colors.border}`)
    .marginBottom("32px")
);

const inputStyle = cn(
  padding("10px 14px")
    .backgroundColor(colors.bgLight)
    .color(colors.text)
    .border(`1px solid ${colors.border}`)
    .borderRadius("8px")
    .fontSize("14px")
    .outline("none")
    .flex("1")
    .transition("border-color 0.2s")
);

const btnStyle = cn(
  padding("10px 20px")
    .backgroundColor(colors.primary)
    .color(colors.bg)
    .border("none")
    .borderRadius("8px")
    .fontSize("14px")
    .fontWeight("600")
    .cursor("pointer")
    .transition("all 0.2s")
);

const taskItemStyle = cn(
  marginBottom("8px")
);

const taskHeaderStyle = cn(
  display("flex")
    .alignItems("center")
    .gap("10px")
    .padding("10px 14px")
    .backgroundColor(colors.bgLight)
    .borderRadius("8px")
    .transition("all 0.2s")
);

const expandBtnStyle = cn(
  width("24px")
    .height("24px")
    .backgroundColor("transparent")
    .border("none")
    .color(colors.textMuted)
    .cursor("pointer")
    .fontSize("12px")
    .display("flex")
    .alignItems("center")
    .justifyContent("center")
    .borderRadius("4px")
    .transition("all 0.2s")
);

const checkboxStyle = cn(
  width("18px")
    .height("18px")
    .cursor("pointer")
);

const deleteBtnStyle = cn(
  marginLeft("auto")
    .padding("4px 8px")
    .backgroundColor("transparent")
    .color(colors.textDim)
    .border("none")
    .borderRadius("4px")
    .cursor("pointer")
    .fontSize("16px")
    .transition("all 0.2s")
);

const subtaskCountStyle = cn(
  fontSize("12px")
    .color(colors.textDim)
    .marginLeft("8px")
);

const subtasksContainerStyle = cn(
  marginLeft("34px")
    .marginTop("8px")
);

const addSubtaskStyle = cn(
  marginLeft("34px")
    .marginTop("8px")
);

const smallInputStyle = cn(
  padding("6px 10px")
    .backgroundColor(colors.bg)
    .color(colors.text)
    .border(`1px solid ${colors.border}`)
    .borderRadius("6px")
    .fontSize("13px")
    .outline("none")
    .width("200px")
    .transition("border-color 0.2s")
);

function createTask(text: string): Task {
  return { id: nextId++, text, done: false, subtasks: [], expanded: true };
}

function addTask(text: string, parent?: Task) {
  const task = createTask(text);
  if (parent) {
    parent.subtasks.push(task);
  } else {
    tasks.push(task);
  }
  update();
}

function toggleTask(task: Task) {
  task.done = !task.done;
  function setDone(t: Task, done: boolean) {
    t.done = done;
    t.subtasks.forEach(st => setDone(st, done));
  }
  setDone(task, task.done);
  update();
}

function toggleExpand(task: Task) {
  task.expanded = !task.expanded;
  update();
}

function deleteTask(task: Task, parent?: Task) {
  if (parent) {
    parent.subtasks = parent.subtasks.filter(t => t.id !== task.id);
  } else {
    tasks = tasks.filter(t => t.id !== task.id);
  }
  update();
}

function TaskItem(task: Task, parent?: Task): ReturnType<typeof div> {
  let newSubtaskText = "";

  return div(
    taskItemStyle,
    div(
      taskHeaderStyle,
      when(
        () => task.subtasks.length > 0,
        button(
          expandBtnStyle,
          () => task.expanded ? "▼" : "▶",
          on("click", () => toggleExpand(task)),
          on("mouseenter", (e) => {
            (e.target as HTMLElement).style.backgroundColor = colors.bgCard;
          }),
          on("mouseleave", (e) => {
            (e.target as HTMLElement).style.backgroundColor = "transparent";
          })
        )
      ).else(
        span(cn(width("24px").display("inline-block")))
      ),
      input(
        checkboxStyle,
        { style: { accentColor: colors.primary } },
        { type: "checkbox", checked: () => task.done },
        on("change", () => toggleTask(task))
      ),
      span(
        cn(fontSize("14px").transition("all 0.2s")),
        {
          style: () => ({
            color: task.done ? colors.textDim : colors.text,
            textDecoration: task.done ? "line-through" : "none",
          })
        },
        () => task.text
      ),
      when(
        () => task.subtasks.length > 0,
        span(
          subtaskCountStyle,
          () => `(${task.subtasks.filter(t => t.done).length}/${task.subtasks.length})`
        )
      ),
      button(
        deleteBtnStyle,
        "×",
        on("click", () => deleteTask(task, parent)),
        on("mouseenter", (e) => {
          (e.target as HTMLElement).style.backgroundColor = "rgba(239, 68, 68, 0.1)";
          (e.target as HTMLElement).style.color = "#ef4444";
        }),
        on("mouseleave", (e) => {
          (e.target as HTMLElement).style.backgroundColor = "transparent";
          (e.target as HTMLElement).style.color = colors.textDim;
        })
      )
    ),
    when(
      () => task.expanded && task.subtasks.length > 0,
      div(
        subtasksContainerStyle,
        list(() => task.subtasks, subtask => TaskItem(subtask, task))
      )
    ),
    when(
      () => task.expanded,
      div(
        addSubtaskStyle,
        input(
          smallInputStyle,
          {
            type: "text",
            placeholder: "Add subtask...",
            value: () => newSubtaskText,
          },
          on("input", (e) => {
            newSubtaskText = (e.target as HTMLInputElement).value;
            update();
          }),
          on("keydown", (e) => {
            if (e.key === "Enter" && newSubtaskText.trim()) {
              addTask(newSubtaskText.trim(), task);
              newSubtaskText = "";
              update();
            }
          }),
          on("focus", (e) => {
            (e.target as HTMLElement).style.borderColor = colors.primary;
          }),
          on("blur", (e) => {
            (e.target as HTMLElement).style.borderColor = colors.border;
          })
        )
      )
    )
  );
}

function LiveSubtasks() {
  return div(
    demoStyle,
    h3(cn(fontSize("18px").fontWeight("600").color(colors.text).marginBottom("20px")), "Tasks with Subtasks"),
    div(
      s.flex,
      s.gap8,
      s.mb24,
      input(
        inputStyle,
        {
          type: "text",
          placeholder: "Add a new task...",
          value: () => mainInputText,
        },
        on("input", (e) => {
          mainInputText = (e.target as HTMLInputElement).value;
          update();
        }),
        on("keydown", (e) => {
          if (e.key === "Enter" && mainInputText.trim()) {
            addTask(mainInputText.trim());
            mainInputText = "";
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
        btnStyle,
        "Add Task",
        on("click", () => {
          if (mainInputText.trim()) {
            addTask(mainInputText.trim());
            mainInputText = "";
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
    when(
      () => tasks.length > 0,
      div(list(() => tasks, task => TaskItem(task)))
    ).else(
      p(cn(color(colors.textDim).textAlign("center").padding("32px")), "No tasks yet. Add one above!")
    )
  );
}

export function SubtasksExamplePage() {
  const example = examplesContent.find(e => e.id === "subtasks")!;

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
    LiveSubtasks(),
    h2(s.h2, "Source Code"),
    CodeBlock(example.code, "typescript")
  );
}
