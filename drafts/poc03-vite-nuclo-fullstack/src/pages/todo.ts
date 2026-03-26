import { navBar } from '../components/nav.ts';

type Task = { id: number; text: string; done: boolean };

export function todoPage(pathname: string): NodeModFn<'div'> {
  const tasks: Task[] = [
    { id: 1, text: 'Buy groceries', done: false },
    { id: 2, text: 'Read the docs', done: false },
    { id: 3, text: 'Build something cool', done: true },
  ];

  function addTask(e: Event): void {
    e.preventDefault();
    const form = e.target as unknown as HTMLFormElement;
    const input = form.querySelector<HTMLInputElement>('[name="task"]')!;
    const text = input.value.trim();
    if (!text) return;
    tasks.push({ id: Date.now(), text, done: false });
    form.reset();
    update();
  }

  function toggleTask(task: Task): void {
    task.done = !task.done;
    update();
  }

  function deleteTask(task: Task): void {
    tasks.splice(tasks.indexOf(task), 1);
    update();
  }

  return div(
    { class: 'page todo-page' },
    navBar(pathname),
    main(
      { class: 'content' },
      h1('Todo'),
      form(
        { class: 'todo-form' },
        on('submit', addTask),
        input({
          type: 'text',
          name: 'task',
          class: 'todo-input',
          placeholder: 'Add a task…',
          autocomplete: 'off',
        }),
        button({ type: 'submit', class: 'btn btn-primary' }, 'Add'),
      ),
      ul(
        { class: 'todo-list' },
        list(
          () => tasks,
          (task) =>
            li(
              { class: () => `todo-item${task.done ? ' done' : ''}` },
              label(
                { class: 'todo-check' },
                input(
                  { type: 'checkbox', class: 'visually-hidden' },
                  task.done ? { checked: '' } : {},
                  on('change', () => toggleTask(task)),
                ),
                span({ class: 'checkmark', 'aria-hidden': 'true' }),
                span({ class: 'todo-text' }, task.text),
              ),
              button(
                { class: 'todo-delete', 'aria-label': `Delete "${task.text}"` },
                on('click', () => deleteTask(task)),
                '×',
              ),
            ),
        ),
      ),
    ),
  );
}
