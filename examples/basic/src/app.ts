import { getTodos, getInputValue, setInputValue, addTodo, toggleTodo, deleteTodo, reorderTodos } from "./todoState.ts";
import { globalStyles as s, cn } from "./styles.ts";
import { sortable } from "./sortable.ts";

let visible = false
let counter = 0;
let intervalId: number | null = null;
// const els: any = {};
// els.el = document.createElement("div");
// els.el.textContent = "Hello, Nuclo!";
// document.body.appendChild(els.el);
// els.el.addEventListener("click", () => {
//   alert("Hello from Nuclo!");
// });

// document.body.removeChild(els.el);

function start() {
  console.log("Started");
  if (intervalId === null) {
    intervalId = setInterval(function () {
      counter += 1;
      update();
    }, 1000) as unknown as number;
  }
}

function stop() {
  console.log("Stopped");
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
// delete els.el;

export const app = div(
  s.body,
  div(
    s.container,
    h1(s.header, "📝 Todo List"),

    div(
      s.inputContainer,
      input(
        s.input,
        {
          type: "text",
          placeholder: "What needs to be done?",
          value: function() { return getInputValue(); },
        },
        on("input", function(e) {
          setInputValue((e.target as HTMLInputElement).value);
        }),
        on("keydown", function(e) {
          if (e.key === "Enter") {
            addTodo();
          }
        })
      ),
      button(s.addButton, "Add", on("click", function() { addTodo(); }))
    ),
    div(
      input(
        { type: "checkbox", id: "visibilityToggle" },
        on("change", function(e) {
          visible = (e.target as HTMLInputElement).checked;
          update();
        })
      ),
      span("is this visible: "),
      when(function() { return visible; }, "yes").else("no"),
    ),
    div(
      s.inputContainer,
      button(
        s.addButton,
        "Play",
        on("click", function() {
          start();
        })
      ),
      button(
        s.deleteButton,
        "Stop",
        on("click", function() {
          stop();
        })
      )
    ),
    div(
      button(on("click", function() { counter++; update(); }), "Increment Counter"),
      div("Counter: ", function() { return counter; })
    ),
    when(function() { return getTodos().length === 0; },
      div("No todos yet! Add one above.")
    ).else(
      div(
        // scope("todos"),
        s.todoList,
        list(
          function() { return getTodos(); },
          function(todo) {
            return div(
              // sortable(reorderTodos),
              s.todoItem,
              span(
                {
                  "data-drag-handle": "true",
                },
                cn(height("20").cursor("grab").width("20").bg("#ccc").display("inline-block")),
                "⇅"),
              input(
                s.checkbox,
                {
                  type: "checkbox",
                  checked: function() { return todo.completed; },
                },
                on("change", function() { toggleTodo(todo.id); })
              ),
              span(
                function() { return todo.completed ? s.todoTextCompleted : s.todoText; },
                function() { return todo.text; }
              ),
              button(s.deleteButton, "Delete", on("click", function() { deleteTodo(todo.id); }))
            );
          }
        )
      ))
  )
);