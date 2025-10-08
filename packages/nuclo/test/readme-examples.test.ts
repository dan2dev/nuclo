import { describe, it, expect, beforeEach } from 'vitest';
import '../src';

describe('README.md examples', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Counter example', () => {
    it('should render counter with reactive text', () => {
      let count = 0;

      const app = div(
        h1(() => `Count: ${count}`),
        button('Increment', on('click', () => {
          count++;
          update();
        })),
        button('Reset', on('click', () => {
          count = 0;
          update();
        }))
      );

      render(app);

      const h1El = document.querySelector('h1');
      expect(h1El?.textContent).toBe('Count: 0');

      count = 5;
      update();
      expect(h1El?.textContent).toBe('Count: 5');
    });
  });

  describe('Todo list example', () => {
    it('should render todo list with add/remove functionality', () => {
      type Todo = { id: number; text: string; done: boolean };

      let todos: Todo[] = [];
      let nextId = 1;
      let inputValue = '';

      function addTodo() {
        if (!inputValue.trim()) return;
        todos.push({ id: nextId++, text: inputValue, done: false });
        inputValue = '';
        update();
      }

      const app = div(
        { className: 'todo-app' },

        div(
          input({ value: () => inputValue },
            on('input', (e: Event) => {
              inputValue = (e.target as HTMLInputElement).value;
              update();
            }),
            on('keydown', (e: KeyboardEvent) => {
              if (e.key === 'Enter') addTodo();
            })
          ),
          button('Add', on('click', addTodo))
        ),

        when(() => todos.length > 0,
          list(() => todos, (todo) =>
            div(
              { className: () => todo.done ? 'done' : '' },
              input({ type: 'checkbox', checked: () => todo.done },
                on('change', () => {
                  todo.done = !todo.done;
                  update();
                })
              ),
              span(() => todo.text),
              button('×', on('click', () => {
                todos = todos.filter(t => t.id !== todo.id);
                update();
              }))
            )
          )
        ).else(
          p('No todos yet!')
        )
      );

      render(app);

      expect(document.querySelector('p')?.textContent).toBe('No todos yet!');

      inputValue = 'Test todo';
      addTodo();

      expect(document.querySelectorAll('span').length).toBe(1);
      expect(document.querySelector('span')?.textContent).toBe('Test todo');
    });
  });

  describe('Search filter example', () => {
    it('should filter users based on search query', () => {
      const users = [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
      ];

      let searchQuery = '';

      function filteredUsers() {
        const q = searchQuery.toLowerCase();
        return users.filter(u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      }

      const app = div(
        h1('User Directory'),

        input(
          {
            type: 'search',
            placeholder: 'Search users...',
            value: () => searchQuery
          },
          on('input', (e: Event) => {
            searchQuery = (e.target as HTMLInputElement).value;
            update();
          })
        ),

        when(() => filteredUsers().length > 0,
          list(() => filteredUsers(), user =>
            div(
              { className: 'user-card' },
              h3(user.name),
              p(user.email)
            )
          )
        ).else(
          p(() => `No users found for "${searchQuery}"`)
        )
      );

      render(app);

      expect(document.querySelectorAll('.user-card').length).toBe(3);

      searchQuery = 'Alice';
      update();

      expect(document.querySelectorAll('.user-card').length).toBe(1);
      expect(document.querySelector('h3')?.textContent).toBe('Alice Johnson');

      searchQuery = 'xyz';
      update();

      expect(document.querySelectorAll('.user-card').length).toBe(0);
      expect(document.querySelector('p')?.textContent).toBe('No users found for "xyz"');
    });
  });

  describe('Loading states example', () => {
    it('should handle loading, error, and success states', () => {
      type State = { status: 'idle' | 'loading' | 'error'; data: any[]; error?: string };

      let state: State = { status: 'idle', data: [] };

      const app = div(
        button('Load Data', on('click', () => {
          state.status = 'loading';
          update();
        })),

        when(() => state.status === 'loading',
          div('Loading...')
        ).when(() => state.status === 'error',
          div({ className: 'error' }, () => `Error: ${state.error}`)
        ).when(() => state.data.length > 0,
          list(() => state.data, item => div(item.name))
        ).else(
          div('No data loaded')
        )
      );

      render(app);

      expect(document.body.textContent).toContain('No data loaded');

      state.status = 'loading';
      update();
      expect(document.body.textContent).toContain('Loading...');

      state.status = 'error';
      state.error = 'Network failure';
      update();
      expect(document.body.textContent).toContain('Error: Network failure');

      state.status = 'idle';
      state.data = [{ name: 'Item 1' }, { name: 'Item 2' }];
      update();
      expect(document.body.textContent).toContain('Item 1');
      expect(document.body.textContent).toContain('Item 2');
    });
  });

  describe('API examples', () => {
    it('should support reactive attributes', () => {
      let isActive = false;
      let isValid = true;
      let isVisible = true;

      const app = div({
        className: () => isActive ? 'active' : '',
        disabled: () => !isValid,
        style: () => ({ opacity: isVisible ? 1 : 0 })
      });

      render(app);

      const divEl = document.querySelector('div') as HTMLDivElement;
      expect(divEl.className).toBe('');

      isActive = true;
      update();
      expect(divEl.className).toBe('active');

      isVisible = false;
      update();
      expect(divEl.style.opacity).toBe('0');
    });

    it('should support static attributes', () => {
      const app = div('Hello', {
        className: 'container',
        id: 'main',
        'data-test': 'value',
        style: { color: 'red', fontSize: '16px' }
      });

      render(app);

      const divEl = document.querySelector('div') as HTMLDivElement;
      expect(divEl.className).toBe('container');
      expect(divEl.id).toBe('main');
      expect(divEl.getAttribute('data-test')).toBe('value');
      expect(divEl.style.color).toBe('red');
      expect(divEl.style.fontSize).toBe('16px');
    });
  });

  describe('Advanced patterns', () => {
    it('should support nested when and list', () => {
      const user = {
        isLoggedIn: true,
        name: 'Alice',
        notifications: [
          { id: 1, message: 'New message', read: false },
          { id: 2, message: 'Update available', read: true }
        ]
      };

      const app = when(() => user.isLoggedIn,
        div(
          h1(() => `Welcome, ${user.name}`),
          list(() => user.notifications, n =>
            div(n.message, { className: () => n.read ? 'read' : 'unread' })
          )
        )
      ).else(
        div('Please log in')
      );

      render(app);

      expect(document.querySelector('h1')?.textContent).toBe('Welcome, Alice');
      expect(document.querySelectorAll('div').length).toBeGreaterThan(0);

      const notificationDivs = Array.from(document.querySelectorAll('div')).filter(
        div => div.textContent === 'New message' || div.textContent === 'Update available'
      );
      expect(notificationDivs.length).toBe(2);
    });

    it('should support component-like functions', () => {
      type User = { avatar: string; name: string; bio: string };

      function UserCard(user: User) {
        return div(
          { className: 'user-card' },
          img({ src: user.avatar }),
          h3(user.name),
          p(user.bio)
        );
      }

      const users: User[] = [
        { avatar: '/alice.jpg', name: 'Alice', bio: 'Developer' },
        { avatar: '/bob.jpg', name: 'Bob', bio: 'Designer' }
      ];

      const app = div(
        list(() => users, user => UserCard(user))
      );

      render(app);

      expect(document.querySelectorAll('.user-card').length).toBe(2);
      expect(document.querySelectorAll('h3')[0].textContent).toBe('Alice');
      expect(document.querySelectorAll('h3')[1].textContent).toBe('Bob');
    });

    it('should support computed values', () => {
      const todos = [
        { id: 1, text: 'Task 1', done: false },
        { id: 2, text: 'Task 2', done: true },
        { id: 3, text: 'Task 3', done: false }
      ];

      function activeCount() {
        return todos.filter(t => !t.done).length;
      }

      const app = div(
        () => `${activeCount()} remaining`
      );

      render(app);

      expect(document.querySelector('div')?.textContent).toBe('2 remaining');

      todos[0].done = true;
      update();
      expect(document.querySelector('div')?.textContent).toBe('1 remaining');
    });
  });
});
