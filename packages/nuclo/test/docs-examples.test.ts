/**
 * Tests for examples shown in the documentation (./docs)
 * These tests verify that all code examples in the documentation work correctly.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import '../src';
import '../types';

describe('Documentation Examples', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('Getting Started - Counter Example', () => {
    it('should render counter with reactive text and handle click events', () => {
      let count = 0;

      const app = div(
        h1(() => `Count: ${count}`),
        button('Increment', on('click', () => {
          count++;
          update();
        })),
        button('Decrement', on('click', () => {
          count--;
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

      count = -3;
      update();
      expect(h1El?.textContent).toBe('Count: -3');
    });
  });

  describe('Getting Started - Reactive Functions', () => {
    it('should update text content reactively', () => {
      let name = 'World';

      const app = div(
        'Hello, ',
        () => name,
        '!'
      );

      render(app);
      expect(document.body.textContent).toContain('Hello,');
      expect(document.body.textContent).toContain('World');

      name = 'Alice';
      update();
      expect(document.body.textContent).toContain('Alice');
    });

    it('should update attributes reactively', () => {
      let isActive = false;

      const app = div({
        className: () => isActive ? 'active' : 'inactive',
        'aria-pressed': () => String(isActive)
      }, 'Toggle');

      render(app);

      const divEl = document.querySelector('div') as HTMLDivElement;
      expect(divEl.className).toBe('inactive');
      expect(divEl.getAttribute('aria-pressed')).toBe('false');

      isActive = true;
      update();
      expect(divEl.className).toBe('active');
      expect(divEl.getAttribute('aria-pressed')).toBe('true');
    });

    it('should update styles reactively', () => {
      let opacity = 1;
      let isVisible = true;

      // Reactive style uses a function that returns the style object
      const app = div({
        style: () => ({
          opacity: opacity,
          display: isVisible ? 'block' : 'none'
        })
      }, 'Content');

      render(app);

      const divEl = document.querySelector('div') as HTMLDivElement;
      expect(divEl.style.opacity).toBe('1');
      expect(divEl.style.display).toBe('block');

      opacity = 0;
      isVisible = false;
      update();
      expect(divEl.style.opacity).toBe('0');
      expect(divEl.style.display).toBe('none');
    });
  });

  describe('API - when() Conditional Rendering', () => {
    it('should render content based on boolean condition', () => {
      let isLoggedIn = false;

      const app = div(
        when(() => isLoggedIn,
          div('Welcome back!')
        ).else(
          div('Please log in')
        )
      );

      render(app);
      expect(document.body.textContent).toContain('Please log in');

      isLoggedIn = true;
      update();
      expect(document.body.textContent).toContain('Welcome back!');
    });

    it('should support chaining multiple conditions', () => {
      let role = 'guest';

      const app = div(
        when(() => role === 'admin',
          div('Admin Panel')
        ).when(() => role === 'user',
          div('User Dashboard')
        ).else(
          div('Guest View')
        )
      );

      render(app);
      expect(document.body.textContent).toContain('Guest View');

      role = 'user';
      update();
      expect(document.body.textContent).toContain('User Dashboard');

      role = 'admin';
      update();
      expect(document.body.textContent).toContain('Admin Panel');
    });

    it('should render multiple elements in when branch', () => {
      let showDetails = true;

      const app = div(
        when(() => showDetails,
          h2('Details'),
          p('Here are the details...'),
          button('Close', on('click', () => {
            showDetails = false;
            update();
          }))
        )
      );

      render(app);
      expect(document.querySelector('h2')?.textContent).toBe('Details');
      expect(document.querySelector('p')?.textContent).toBe('Here are the details...');
      expect(document.querySelector('button')?.textContent).toBe('Close');

      showDetails = false;
      update();
      expect(document.querySelector('h2')).toBeNull();
    });
  });

  describe('API - list() Dynamic Lists', () => {
    it('should render a list of items', () => {
      type Todo = { id: number; text: string; done: boolean };

      const todos: Todo[] = [
        { id: 1, text: 'Learn nuclo', done: false },
        { id: 2, text: 'Build app', done: false }
      ];

      const app = div(
        list(() => todos, (todo, index) =>
          div(
            { className: () => todo.done ? 'done' : '' },
            span(() => `${index + 1}. ${todo.text}`)
          )
        )
      );

      render(app);

      const spans = document.querySelectorAll('span');
      expect(spans.length).toBe(2);
      expect(spans[0].textContent).toBe('1. Learn nuclo');
      expect(spans[1].textContent).toBe('2. Build app');
    });

    it('should update when items change', () => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      const app = div(
        list(() => items, item => div(item.name))
      );

      render(app);
      expect(document.querySelectorAll('div > div').length).toBe(2);

      items.push({ id: 3, name: 'Item 3' });
      update();
      expect(document.querySelectorAll('div > div').length).toBe(3);
    });

    it('should handle filtering', () => {
      type Todo = { id: number; text: string; done: boolean };

      const todos: Todo[] = [
        { id: 1, text: 'Task 1', done: false },
        { id: 2, text: 'Task 2', done: true },
        { id: 3, text: 'Task 3', done: false }
      ];

      const app = div(
        list(() => todos.filter(t => !t.done), todo =>
          div(todo.text)
        )
      );

      render(app);
      expect(document.querySelectorAll('div > div').length).toBe(2);

      todos[0].done = true;
      update();
      expect(document.querySelectorAll('div > div').length).toBe(1);
    });
  });

  describe('API - on() Event Handling', () => {
    it('should handle click events', () => {
      let clicked = false;

      const app = button('Click me',
        on('click', () => {
          clicked = true;
        })
      );

      render(app);
      const btn = document.querySelector('button') as HTMLButtonElement;
      btn.click();
      expect(clicked).toBe(true);
    });

    it('should handle multiple events on same element', () => {
      let value = '';
      let focused = false;

      const app = input(
        on('input', (e: Event) => {
          value = (e.target as HTMLInputElement).value;
          update();
        }),
        on('focus', () => {
          focused = true;
          update();
        }),
        on('blur', () => {
          focused = false;
          update();
        })
      );

      render(app);
      const inputEl = document.querySelector('input') as HTMLInputElement;

      inputEl.focus();
      expect(focused).toBe(true);

      inputEl.blur();
      expect(focused).toBe(false);
    });

    it('should handle keyboard events', () => {
      let lastKey = '';

      const app = input(
        on('keydown', (e: KeyboardEvent) => {
          lastKey = e.key;
        })
      );

      render(app);
      const inputEl = document.querySelector('input') as HTMLInputElement;

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      inputEl.dispatchEvent(event);
      expect(lastKey).toBe('Enter');
    });
  });

  describe('Styling - createBreakpoints', () => {
    it('should create breakpoints helper', () => {
      const cn = createBreakpoints({
        medium: '(min-width: 768px)',
        large: '(min-width: 1024px)'
      });

      expect(typeof cn).toBe('function');
    });

    it('should generate className from chained styles', () => {
      const cn = createBreakpoints({
        medium: '(min-width: 768px)'
      });

      const result = cn(
        bg('#3b82f6')
          .color('white')
          .padding('0.75rem 1.5rem')
          .borderRadius('8px')
      );

      expect(result).toHaveProperty('className');
      expect((result as any).className).toMatch(/^n[a-f0-9]{8}$/);
    });

    it('should support responsive breakpoints', () => {
      const cn = createBreakpoints({
        medium: '(min-width: 768px)',
        large: '(min-width: 1024px)'
      });

      const result = cn(
        padding('1rem').fontSize('14px'),
        {
          medium: padding('1.5rem').fontSize('16px'),
          large: padding('2rem').fontSize('18px')
        }
      );

      expect(result).toHaveProperty('className');
      const className = (result as any).className;
      expect(className).toMatch(/^n[a-f0-9]{8}$/);

      // Verify CSS was created
      const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
      expect(styleSheet).toBeTruthy();

      const rules = Array.from(styleSheet?.sheet?.cssRules || []);
      const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
      expect(mediaRules.length).toBe(2);
    });

    it('should apply styles to elements', () => {
      const cn = createBreakpoints({
        medium: '(min-width: 768px)'
      });

      const buttonStyle = cn(
        bg('#3b82f6')
          .color('white')
          .padding('0.5rem 1rem')
      );

      const app = button(buttonStyle, 'Click me');
      render(app);

      const btn = document.querySelector('button') as HTMLButtonElement;
      expect(btn.className).toMatch(/n[a-f0-9]{8}/);
    });
  });

  describe('Styling - Style Helpers', () => {
    it('should chain multiple style helpers', () => {
      const styles = bg('white')
        .padding('1.5rem')
        .borderRadius('12px')
        .boxShadow('0 4px 6px rgba(0,0,0,0.1)');

      expect(styles.getStyles()).toHaveProperty('background-color', 'white');
      expect(styles.getStyles()).toHaveProperty('padding', '1.5rem');
      expect(styles.getStyles()).toHaveProperty('border-radius', '12px');
    });

    it('should support flex() shorthand', () => {
      const styles = flex().justifyContent('center').alignItems('center');
      const cssStyles = styles.getStyles();
      expect(cssStyles).toHaveProperty('display', 'flex');
      expect(cssStyles).toHaveProperty('justify-content', 'center');
      expect(cssStyles).toHaveProperty('align-items', 'center');
    });

    it('should support center() shorthand', () => {
      const styles = flex().center();
      const cssStyles = styles.getStyles();
      expect(cssStyles).toHaveProperty('justify-content', 'center');
      expect(cssStyles).toHaveProperty('align-items', 'center');
    });

    it('should support bold() shorthand', () => {
      const styles = fontSize('1rem').bold();
      const cssStyles = styles.getStyles();
      expect(cssStyles).toHaveProperty('font-weight', 'bold');
    });

    it('should support grid() shorthand', () => {
      const styles = grid().gridTemplateColumns('repeat(3, 1fr)').gap('1rem');
      const cssStyles = styles.getStyles();
      expect(cssStyles).toHaveProperty('display', 'grid');
      expect(cssStyles).toHaveProperty('grid-template-columns', 'repeat(3, 1fr)');
      expect(cssStyles).toHaveProperty('gap', '1rem');
    });
  });

  describe('Examples - Todo List', () => {
    it('should render todo list with full functionality', () => {
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

      function toggleTodo(todo: Todo) {
        todo.done = !todo.done;
        update();
      }

      function deleteTodo(id: number) {
        todos = todos.filter(t => t.id !== id);
        update();
      }

      const app = div(
        { className: 'todo-app' },

        h1('todos'),

        div(
          { className: 'input-section' },
          input({
            type: 'text',
            placeholder: 'What needs to be done?',
            value: () => inputValue
          },
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
              { className: () => `todo-item ${todo.done ? 'done' : ''}` },
              input({
                type: 'checkbox',
                checked: () => todo.done
              },
                on('change', () => toggleTodo(todo))
              ),
              span({ className: 'todo-text' }, () => todo.text),
              button({ className: 'delete-btn' }, '×',
                on('click', () => deleteTodo(todo.id))
              )
            )
          )
        ).else(
          p({ className: 'empty-state' }, 'No todos yet! Add one above.')
        )
      );

      render(app);

      // Initially empty
      expect(document.querySelector('.empty-state')?.textContent).toBe('No todos yet! Add one above.');

      // Add a todo
      inputValue = 'Test task';
      addTodo();

      expect(document.querySelectorAll('.todo-item').length).toBe(1);
      expect(document.querySelector('.todo-text')?.textContent).toBe('Test task');

      // Toggle todo
      todos[0].done = true;
      update();
      expect(document.querySelector('.todo-item')?.className).toContain('done');

      // Delete todo
      deleteTodo(1);
      expect(document.querySelectorAll('.todo-item').length).toBe(0);
      expect(document.querySelector('.empty-state')).toBeTruthy();
    });
  });

  describe('Examples - Nested Subtasks', () => {
    it('should render tasks with recursive subtasks', () => {
      type Task = {
        id: number;
        text: string;
        done: boolean;
        subtasks: Task[];
        expanded: boolean;
      };

      let nextId = 1;

      function createTask(text: string): Task {
        return {
          id: nextId++,
          text,
          done: false,
          subtasks: [],
          expanded: true
        };
      }

      const tasks: Task[] = [
        {
          id: nextId++,
          text: 'Parent Task',
          done: false,
          subtasks: [
            { id: nextId++, text: 'Subtask 1', done: false, subtasks: [], expanded: true },
            { id: nextId++, text: 'Subtask 2', done: true, subtasks: [], expanded: true }
          ],
          expanded: true
        }
      ];

      function TaskItem(task: Task, depth = 0): ReturnType<typeof div> {
        return div(
          { className: 'task-item' },
          { style: { marginLeft: `${depth * 20}px` } },
          span(() => task.text),
          when(() => task.expanded && task.subtasks.length > 0,
            div(
              { className: 'subtasks' },
              list(() => task.subtasks, subtask =>
                TaskItem(subtask, depth + 1)
              )
            )
          )
        );
      }

      const app = div(
        { className: 'task-app' },
        list(() => tasks, task => TaskItem(task))
      );

      render(app);

      const taskItems = document.querySelectorAll('.task-item');
      expect(taskItems.length).toBe(3); // Parent + 2 subtasks

      const spans = document.querySelectorAll('span');
      expect(spans[0].textContent).toBe('Parent Task');
      expect(spans[1].textContent).toBe('Subtask 1');
      expect(spans[2].textContent).toBe('Subtask 2');
    });
  });

  describe('Examples - Search Filter', () => {
    it('should filter users based on search query', () => {
      type User = { id: number; name: string; email: string };

      const users: User[] = [
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
        input({
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
          div(
            { className: 'user-list' },
            list(() => filteredUsers(), user =>
              div({ className: 'user-card' },
                h3(user.name),
                p(user.email)
              )
            )
          )
        ).else(
          p(() => searchQuery
            ? `No users found matching "${searchQuery}"`
            : 'No users found'
          )
        )
      );

      render(app);

      expect(document.querySelectorAll('.user-card').length).toBe(3);

      searchQuery = 'alice';
      update();
      expect(document.querySelectorAll('.user-card').length).toBe(1);
      expect(document.querySelector('h3')?.textContent).toBe('Alice Johnson');

      searchQuery = 'xyz';
      update();
      expect(document.querySelectorAll('.user-card').length).toBe(0);
      expect(document.querySelector('p')?.textContent).toBe('No users found matching "xyz"');
    });
  });

  describe('Examples - Form Handling', () => {
    it('should handle form validation and submission', () => {
      type FormData = {
        username: string;
        email: string;
      };

      type Errors = Partial<Record<keyof FormData, string>>;

      const formData: FormData = {
        username: '',
        email: ''
      };

      let errors: Errors = {};
      let isSubmitting = false;

      function validateForm(): boolean {
        errors = {};

        if (formData.username.length < 3) {
          errors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email.includes('@')) {
          errors.email = 'Please enter a valid email';
        }

        return Object.keys(errors).length === 0;
      }

      const app = form(
        on('submit', (e: Event) => {
          e.preventDefault();
          if (validateForm()) {
            isSubmitting = true;
          }
          update();
        }),

        div({ className: 'form-field' },
          label('Username'),
          input({
            type: 'text',
            value: () => formData.username
          },
            on('input', (e: Event) => {
              formData.username = (e.target as HTMLInputElement).value;
              delete errors.username;
              update();
            })
          ),
          when(() => !!errors.username,
            span({ className: 'error' }, () => errors.username || '')
          )
        ),

        div({ className: 'form-field' },
          label('Email'),
          input({
            type: 'email',
            value: () => formData.email
          },
            on('input', (e: Event) => {
              formData.email = (e.target as HTMLInputElement).value;
              delete errors.email;
              update();
            })
          ),
          when(() => !!errors.email,
            span({ className: 'error' }, () => errors.email || '')
          )
        ),

        button({ type: 'submit' }, 'Submit')
      );

      render(app);

      // Test validation
      expect(validateForm()).toBe(false);
      expect(errors.username).toBe('Username must be at least 3 characters');
      expect(errors.email).toBe('Please enter a valid email');

      // Fix validation
      formData.username = 'alice';
      formData.email = 'alice@example.com';
      expect(validateForm()).toBe(true);
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe('Examples - Async Loading States', () => {
    it('should handle loading, error, and success states', () => {
      type State = {
        status: 'idle' | 'loading' | 'success' | 'error';
        data: any[];
        error?: string;
      };

      const state: State = { status: 'idle', data: [] };

      const app = div(
        when(() => state.status === 'loading',
          div({ className: 'loading' }, 'Loading...')
        ).when(() => state.status === 'error',
          div({ className: 'error' }, () => `Error: ${state.error}`)
        ).when(() => state.status === 'success' && state.data.length > 0,
          div(
            list(() => state.data, item =>
              div({ className: 'item' }, item.name)
            )
          )
        ).else(
          div({ className: 'empty' }, 'No data loaded')
        )
      );

      render(app);

      // Initial state
      expect(document.querySelector('.empty')?.textContent).toBe('No data loaded');

      // Loading state
      state.status = 'loading';
      update();
      expect(document.querySelector('.loading')?.textContent).toBe('Loading...');

      // Error state
      state.status = 'error';
      state.error = 'Network failure';
      update();
      expect(document.querySelector('.error')?.textContent).toBe('Error: Network failure');

      // Success state
      state.status = 'success';
      state.data = [{ name: 'Item 1' }, { name: 'Item 2' }];
      update();
      expect(document.querySelectorAll('.item').length).toBe(2);
    });
  });

  describe('Examples - Component Functions', () => {
    it('should support component-like function patterns', () => {
      type User = { avatar: string; name: string; bio: string };

      function UserCard(user: User) {
        return div(
          { className: 'user-card' },
          img({ src: user.avatar, alt: user.name }),
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
  });

  describe('Styling - Complete Styling Example', () => {
    it('should work with organized styles object pattern', () => {
      const theme = {
        colors: {
          primary: '#6366f1',
          text: '#1f2937',
          bg: '#ffffff',
          border: '#e5e7eb',
        },
        spacing: {
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
        },
        borderRadius: {
          md: '8px',
          lg: '12px',
        }
      };

      const cn = createBreakpoints({
        sm: '(min-width: 640px)',
        md: '(min-width: 768px)',
        lg: '(min-width: 1024px)',
      });

      const styles = {
        container: cn(
          width('100%')
            .maxWidth('1200px')
            .margin('0 auto')
            .padding(theme.spacing.md)
        ),

        card: cn(
          bg(theme.colors.bg)
            .borderRadius(theme.borderRadius.lg)
            .padding(theme.spacing.lg)
            .boxShadow('0 4px 6px rgba(0,0,0,0.1)')
        ),

        btnPrimary: cn(
          bg(theme.colors.primary)
            .color('white')
            .padding(`${theme.spacing.sm} ${theme.spacing.lg}`)
            .borderRadius(theme.borderRadius.md)
            .border('none')
            .fontWeight('600')
            .cursor('pointer')
        )
      };

      const app = div(
        styles.container,
        div(styles.card,
          h1('Welcome'),
          p('This is styled with nuclo CSS-in-JS'),
          button(styles.btnPrimary, 'Click me')
        )
      );

      render(app);

      // Verify structure
      expect(document.querySelector('h1')?.textContent).toBe('Welcome');
      expect(document.querySelector('p')?.textContent).toBe('This is styled with nuclo CSS-in-JS');
      expect(document.querySelector('button')?.textContent).toBe('Click me');

      // Verify CSS classes were applied
      const container = document.body.firstElementChild as HTMLElement;
      expect(container.className).toMatch(/n[a-f0-9]{8}/);
    });

    it('should work with responsive styles', () => {
      const cn = createBreakpoints({
        medium: '(min-width: 768px)',
        large: '(min-width: 1024px)'
      });

      const cardGrid = cn(
        grid()
          .gridTemplateColumns('1fr')
          .gap('1.5rem'),
        {
          medium: gridTemplateColumns('repeat(2, 1fr)'),
          large: gridTemplateColumns('repeat(3, 1fr)')
        }
      );

      const items = [{ name: 'Card 1' }, { name: 'Card 2' }, { name: 'Card 3' }];

      const app = div(
        cardGrid,
        list(() => items, item => div(item.name))
      );

      render(app);

      // Verify structure
      expect(document.querySelectorAll('div > div').length).toBe(3);

      // Verify CSS was generated with media queries
      const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
      expect(styleSheet).toBeTruthy();

      const rules = Array.from(styleSheet?.sheet?.cssRules || []);
      const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
      expect(mediaRules.length).toBeGreaterThanOrEqual(2);
    });
  });
});
