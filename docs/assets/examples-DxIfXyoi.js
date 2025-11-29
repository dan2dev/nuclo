const e=[{id:"counter",title:"Counter",description:"The classic counter example showing basic state management and event handling.",code:`import 'nuclo';

let counter = 0;

function increment() {
  counter++;
  update();
}

function decrement() {
  counter--;
  update();
}

function reset() {
  counter = 0;
  update();
}

const app = div(
  { className: 'counter-app' },

  h1('Counter: ', span(() => counter)),

  div(
    { className: 'button-group' },
    button('-', on('click', decrement)),
    button('Reset', on('click', reset)),
    button('+', on('click', increment))
  ),

  // Show even/odd
  p(() => \`The counter is \${counter % 2 === 0 ? 'even' : 'odd'}\`)
);

render(app, document.body);`},{id:"todo",title:"Todo List",description:"A complete todo application with add, toggle, delete, and filter functionality.",code:`import 'nuclo';

type Todo = { id: number; text: string; done: boolean };
type Filter = 'all' | 'active' | 'completed';

let todos: Todo[] = [];
let nextId = 1;
let inputValue = '';
let filter: Filter = 'all';

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

function clearCompleted() {
  todos = todos.filter(t => !t.done);
  update();
}

function filteredTodos() {
  switch (filter) {
    case 'active': return todos.filter(t => !t.done);
    case 'completed': return todos.filter(t => t.done);
    default: return todos;
  }
}

function activeCount() {
  return todos.filter(t => !t.done).length;
}

const app = div(
  { className: 'todo-app' },

  h1('todos'),

  // Input section
  div(
    { className: 'input-section' },
    input(
      {
        type: 'text',
        placeholder: 'What needs to be done?',
        value: () => inputValue
      },
      on('input', e => {
        inputValue = e.target.value;
        update();
      }),
      on('keydown', e => {
        if (e.key === 'Enter') addTodo();
      })
    ),
    button('Add', on('click', addTodo))
  ),

  // Todo list
  when(() => todos.length > 0,
    div(
      // List
      list(() => filteredTodos(), (todo) =>
        div(
          { className: () => \`todo-item \${todo.done ? 'done' : ''}\` },

          input(
            {
              type: 'checkbox',
              checked: () => todo.done
            },
            on('change', () => toggleTodo(todo))
          ),

          span(
            { className: 'todo-text' },
            () => todo.text
          ),

          button(
            { className: 'delete-btn' },
            '×',
            on('click', () => deleteTodo(todo.id))
          )
        )
      ),

      // Footer
      div(
        { className: 'todo-footer' },

        span(() => \`\${activeCount()} item\${activeCount() !== 1 ? 's' : ''} left\`),

        div(
          { className: 'filters' },
          button(
            { className: () => filter === 'all' ? 'active' : '' },
            'All',
            on('click', () => { filter = 'all'; update(); })
          ),
          button(
            { className: () => filter === 'active' ? 'active' : '' },
            'Active',
            on('click', () => { filter = 'active'; update(); })
          ),
          button(
            { className: () => filter === 'completed' ? 'active' : '' },
            'Completed',
            on('click', () => { filter = 'completed'; update(); })
          )
        ),

        when(() => todos.some(t => t.done),
          button('Clear completed', on('click', clearCompleted))
        )
      )
    )
  ).else(
    p({ className: 'empty-state' }, 'No todos yet! Add one above.')
  )
);

render(app, document.body);`},{id:"subtasks",title:"Nested Subtasks",description:"A todo list with recursive subtasks, demonstrating nested list() and when() composition.",code:`import 'nuclo';

type Task = {
  id: number;
  text: string;
  done: boolean;
  subtasks: Task[];
  expanded: boolean;
};

let tasks: Task[] = [];
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
  // Optionally cascade to subtasks
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

// Recursive task renderer
function TaskItem(task: Task, parent?: Task, depth = 0): Element {
  let newSubtaskText = '';

  return div(
    { className: 'task-item' },
    { style: { marginLeft: \`\${depth * 20}px\` } },

    // Task header
    div(
      { className: 'task-header' },

      // Expand/collapse button (if has subtasks)
      when(() => task.subtasks.length > 0,
        button(
          { className: 'expand-btn' },
          () => task.expanded ? '▼' : '▶',
          on('click', () => toggleExpand(task))
        )
      ).else(
        span({ style: { width: '24px', display: 'inline-block' } })
      ),

      // Checkbox
      input(
        {
          type: 'checkbox',
          checked: () => task.done
        },
        on('change', () => toggleTask(task))
      ),

      // Task text
      span(
        {
          className: () => task.done ? 'done' : '',
          style: {
            textDecoration: () => task.done ? 'line-through' : 'none',
            opacity: () => task.done ? '0.6' : '1'
          }
        },
        () => task.text
      ),

      // Subtask count badge
      when(() => task.subtasks.length > 0,
        span(
          { className: 'subtask-count' },
          () => \`(\${task.subtasks.filter(t => t.done).length}/\${task.subtasks.length})\`
        )
      ),

      // Delete button
      button(
        { className: 'delete-btn' },
        '×',
        on('click', () => deleteTask(task, parent))
      )
    ),

    // Subtasks (when expanded)
    when(() => task.expanded && task.subtasks.length > 0,
      div(
        { className: 'subtasks' },
        list(() => task.subtasks, subtask =>
          TaskItem(subtask, task, depth + 1)
        )
      )
    ),

    // Add subtask form (when expanded)
    when(() => task.expanded,
      div(
        { className: 'add-subtask' },
        { style: { marginLeft: \`\${(depth + 1) * 20}px\` } },
        input(
          {
            type: 'text',
            placeholder: 'Add subtask...',
            value: () => newSubtaskText
          },
          on('input', e => {
            newSubtaskText = e.target.value;
            update();
          }),
          on('keydown', e => {
            if (e.key === 'Enter' && newSubtaskText.trim()) {
              addTask(newSubtaskText.trim(), task);
              newSubtaskText = '';
              update();
            }
          })
        )
      )
    )
  );
}

// Main app
let mainInputText = '';

const app = div(
  { className: 'task-app' },

  h1('Tasks with Subtasks'),

  // Add main task
  div(
    { className: 'add-task' },
    input(
      {
        type: 'text',
        placeholder: 'Add a task...',
        value: () => mainInputText
      },
      on('input', e => {
        mainInputText = e.target.value;
        update();
      }),
      on('keydown', e => {
        if (e.key === 'Enter' && mainInputText.trim()) {
          addTask(mainInputText.trim());
          mainInputText = '';
          update();
        }
      })
    ),
    button('Add', on('click', () => {
      if (mainInputText.trim()) {
        addTask(mainInputText.trim());
        mainInputText = '';
        update();
      }
    }))
  ),

  // Task list
  when(() => tasks.length > 0,
    div(
      { className: 'task-list' },
      list(() => tasks, task => TaskItem(task))
    )
  ).else(
    p({ className: 'empty' }, 'No tasks yet. Add one above!')
  )
);

render(app, document.body);`},{id:"search",title:"Search Filter",description:"Real-time search filtering with debouncing.",code:`import 'nuclo';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const users: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'User' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'Admin' },
  { id: 5, name: 'Eve Anderson', email: 'eve@example.com', role: 'User' }
];

let searchQuery = '';
let selectedRole = 'all';

function filteredUsers() {
  const query = searchQuery.toLowerCase();
  return users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    const matchesRole =
      selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });
}

const app = div(
  { className: 'user-directory' },

  h1('User Directory'),

  // Search and filters
  div(
    { className: 'search-section' },

    input(
      {
        type: 'search',
        placeholder: 'Search by name or email...',
        value: () => searchQuery
      },
      on('input', e => {
        searchQuery = e.target.value;
        update();
      })
    ),

    select(
      { value: () => selectedRole },
      on('change', e => {
        selectedRole = e.target.value;
        update();
      }),
      option({ value: 'all' }, 'All Roles'),
      option({ value: 'Admin' }, 'Admins'),
      option({ value: 'User' }, 'Users')
    )
  ),

  // Results count
  p(() => {
    const count = filteredUsers().length;
    return \`Showing \${count} user\${count !== 1 ? 's' : ''}\`;
  }),

  // User list
  when(() => filteredUsers().length > 0,
    div(
      { className: 'user-list' },
      list(() => filteredUsers(), user =>
        div(
          { className: 'user-card' },
          h3(user.name),
          p(user.email),
          span(
            { className: \`role-badge \${user.role.toLowerCase()}\` },
            user.role
          )
        )
      )
    )
  ).else(
    div(
      { className: 'empty-state' },
      p(() => searchQuery
        ? \`No users found matching "\${searchQuery}"\`
        : 'No users found'
      )
    )
  )
);

render(app, document.body);`},{id:"async",title:"Async Loading",description:"Handling asynchronous operations with loading states and error handling.",code:`import 'nuclo';

type Product = { id: number; title: string; category: string; price: number };
type State = {
  status: 'idle' | 'loading' | 'success' | 'error';
  products: Product[];
  error?: string;
};

let state: State = { status: 'idle', products: [] };
let searchQuery = 'phone';

async function fetchProducts() {
  if (!searchQuery.trim()) return;

  state.status = 'loading';
  state.error = undefined;
  update();

  try {
    const response = await fetch(
      \`https://dummyjson.com/products/search?q=\${searchQuery}\`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    state.products = data.products;
    state.status = 'success';
  } catch (err) {
    state.status = 'error';
    state.error = err.message;
  }

  update();
}

const app = div(
  { className: 'product-search' },

  h1('Product Search'),

  // Search input
  div(
    { className: 'search-bar' },
    input(
      {
        type: 'search',
        placeholder: 'Search products...',
        value: () => searchQuery,
        disabled: () => state.status === 'loading'
      },
      on('input', e => {
        searchQuery = e.target.value;
        update();
      }),
      on('keydown', e => {
        if (e.key === 'Enter') fetchProducts();
      })
    ),
    button(
      {
        disabled: () => state.status === 'loading' || !searchQuery.trim()
      },
      () => state.status === 'loading' ? 'Searching...' : 'Search',
      on('click', fetchProducts)
    )
  ),

  // Status display
  when(() => state.status === 'loading',
    div({ className: 'loading' }, 'Loading products...')
  ).when(() => state.status === 'error',
    div(
      { className: 'error' },
      'Error: ',
      () => state.error,
      button('Retry', on('click', fetchProducts))
    )
  ).when(() => state.status === 'success' && state.products.length > 0,
    div(
      p(() => \`Found \${state.products.length} products\`),
      div(
        { className: 'product-grid' },
        list(() => state.products, product =>
          div(
            { className: 'product-card' },
            h3(product.title),
            p({ className: 'category' }, product.category),
            p({ className: 'price' }, () => \`$\${product.price.toFixed(2)}\`)
          )
        )
      )
    )
  ).when(() => state.status === 'success' && state.products.length === 0,
    div({ className: 'empty' }, () => \`No products found for "\${searchQuery}"\`)
  ).else(
    div({ className: 'empty' }, 'Enter a search term and click Search')
  )
);

render(app, document.body);`},{id:"forms",title:"Form Handling",description:"Complete form with validation and submission.",code:`import 'nuclo';

type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

let formData: FormData = {
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
};

let errors: Errors = {};
let isSubmitting = false;
let submitStatus: 'idle' | 'success' | 'error' = 'idle';

function validateForm(): boolean {
  errors = {};

  if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }

  if (!formData.email.includes('@')) {
    errors.email = 'Please enter a valid email';
  }

  if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return Object.keys(errors).length === 0;
}

async function handleSubmit(e: Event) {
  e.preventDefault();

  if (!validateForm()) {
    update();
    return;
  }

  isSubmitting = true;
  submitStatus = 'idle';
  update();

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Success
    submitStatus = 'success';
    formData = { username: '', email: '', password: '', confirmPassword: '' };
  } catch (err) {
    submitStatus = 'error';
  }

  isSubmitting = false;
  update();
}

const app = div(
  { className: 'form-container' },

  h1('Sign Up'),

  when(() => submitStatus === 'success',
    div({ className: 'success-message' }, 'Account created successfully!')
  ),

  form(
    on('submit', handleSubmit),

    // Username field
    div(
      { className: 'form-field' },
      label('Username'),
      input(
        {
          type: 'text',
          value: () => formData.username,
          disabled: () => isSubmitting
        },
        on('input', e => {
          formData.username = e.target.value;
          delete errors.username;
          update();
        })
      ),
      when(() => !!errors.username,
        span({ className: 'error' }, () => errors.username)
      )
    ),

    // Email field
    div(
      { className: 'form-field' },
      label('Email'),
      input(
        {
          type: 'email',
          value: () => formData.email,
          disabled: () => isSubmitting
        },
        on('input', e => {
          formData.email = e.target.value;
          delete errors.email;
          update();
        })
      ),
      when(() => !!errors.email,
        span({ className: 'error' }, () => errors.email)
      )
    ),

    // Password field
    div(
      { className: 'form-field' },
      label('Password'),
      input(
        {
          type: 'password',
          value: () => formData.password,
          disabled: () => isSubmitting
        },
        on('input', e => {
          formData.password = e.target.value;
          delete errors.password;
          update();
        })
      ),
      when(() => !!errors.password,
        span({ className: 'error' }, () => errors.password)
      )
    ),

    // Confirm password field
    div(
      { className: 'form-field' },
      label('Confirm Password'),
      input(
        {
          type: 'password',
          value: () => formData.confirmPassword,
          disabled: () => isSubmitting
        },
        on('input', e => {
          formData.confirmPassword = e.target.value;
          delete errors.confirmPassword;
          update();
        })
      ),
      when(() => !!errors.confirmPassword,
        span({ className: 'error' }, () => errors.confirmPassword)
      )
    ),

    // Submit button
    button(
      {
        type: 'submit',
        disabled: () => isSubmitting
      },
      () => isSubmitting ? 'Creating account...' : 'Sign Up'
    )
  )
);

render(app, document.body);`},{id:"nested",title:"Nested Components",description:"Creating reusable component-like functions.",code:`import 'nuclo';

type User = {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
};

// Component functions
function UserCard(user: User, onFollow: (id: number) => void) {
  return div(
    { className: 'user-card' },
    img({ src: user.avatar, alt: user.name, className: 'avatar' }),
    h3(user.name),
    p({ className: 'bio' }, user.bio),
    p({ className: 'followers' }, () => \`\${user.followers} followers\`),
    button('Follow', on('click', () => onFollow(user.id)))
  );
}

function UserGrid(users: User[], onFollow: (id: number) => void) {
  return div(
    { className: 'user-grid' },
    list(() => users, user => UserCard(user, onFollow))
  );
}

// App state
let users: User[] = [
  {
    id: 1,
    name: 'Alice',
    avatar: '/avatars/alice.jpg',
    bio: 'Software developer',
    followers: 142
  },
  {
    id: 2,
    name: 'Bob',
    avatar: '/avatars/bob.jpg',
    bio: 'Designer',
    followers: 89
  }
];

function handleFollow(id: number) {
  const user = users.find(u => u.id === id);
  if (user) {
    user.followers++;
    update();
  }
}

const app = div(
  { className: 'app' },
  h1('User Directory'),
  UserGrid(users, handleFollow)
);

render(app, document.body);`},{id:"animations",title:"Animations",description:"Smooth transitions with CSS and reactive styles.",code:`import 'nuclo';

// Toggle a CSS keyframes animation
let isAnimating = false;

// Ensure keyframes exist
const style = document.createElement('style');
style.textContent = '@keyframes pulse { from { transform: scale(1); opacity: 0.85; } to { transform: scale(1.08); opacity: 1; } }';
document.head.appendChild(style);

const app = div(
  button(
    () => isAnimating ? 'Stop Animation' : 'Start Animation',
    on('click', () => { isAnimating = !isAnimating; update(); })
  ),

  div(
    {
      className: 'animated-box',
      style: {
        width: '200px',
        height: '200px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
        animation: () => isAnimating ? 'pulse 600ms ease-in-out infinite alternate' : 'none',
        willChange: () => isAnimating ? 'transform, opacity' : 'auto'
      }
    },
    'Animated Content'
  )
);

render(app, document.body);`},{id:"routing",title:"Simple Routing",description:"Client-side routing without a framework.",code:`import 'nuclo';

type Route = 'home' | 'about' | 'contact' | 'notfound';

let currentRoute: Route = 'home';
let params: Record<string, string> = {};

function navigate(route: Route) {
  currentRoute = route;
  window.history.pushState({}, '', \`/\${route}\`);
  update();
}

// Simple router
window.addEventListener('popstate', () => {
  const path = window.location.pathname.slice(1) || 'home';
  currentRoute = path as Route;
  update();
});

// Page components
function HomePage() {
  return div(
    h1('Home Page'),
    p('Welcome to our website!'),
    button('Go to About', on('click', () => navigate('about')))
  );
}

function AboutPage() {
  return div(
    h1('About Page'),
    p('Learn more about us.'),
    button('Go to Contact', on('click', () => navigate('contact')))
  );
}

function ContactPage() {
  return div(
    h1('Contact Page'),
    p('Get in touch!'),
    button('Go Home', on('click', () => navigate('home')))
  );
}

function NotFoundPage() {
  return div(
    h1('404 - Not Found'),
    p('Page not found'),
    button('Go Home', on('click', () => navigate('home')))
  );
}

const app = div(
  { className: 'app' },

  nav(
    button('Home', on('click', () => navigate('home'))),
    button('About', on('click', () => navigate('about'))),
    button('Contact', on('click', () => navigate('contact')))
  ),

  main(
    when(() => currentRoute === 'home', HomePage())
    .when(() => currentRoute === 'about', AboutPage())
    .when(() => currentRoute === 'contact', ContactPage())
    .else(NotFoundPage())
  )
);

render(app, document.body);`},{id:"styled-card",title:"Styled Card",description:"Using nuclo's CSS-in-JS styling system to create a polished product card component with hover effects.",code:`import 'nuclo';

// Setup style queries
const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

// Define reusable styles
const styles = {
  page: cn(
    bg('#f5f5f5')
      .minHeight('100vh')
      .padding('1rem'),
    { medium: padding('2rem') }
  ),

  header: cn(
    textAlign('center')
      .marginBottom('2rem')
  ),

  title: cn(
    margin('0 0 0.5rem 0')
      .fontSize('2rem')
      .color('#1a1a2e'),
    { large: fontSize('2.5rem') }
  ),

  subtitle: cn(
    margin('0')
      .color('#666')
  ),

  grid: cn(
    grid()
      .gridTemplateColumns('1fr')
      .gap('1.5rem')
      .maxWidth('1200px')
      .margin('0 auto'),
    {
      medium: gridTemplateColumns('repeat(2, 1fr)'),
      large: gridTemplateColumns('repeat(3, 1fr)').gap('2rem')
    }
  ),

  card: cn(
    bg('white')
      .borderRadius('12px')
      .overflow('hidden')
      .transition('all 0.3s ease')
      .cursor('pointer')
  ),

  cardImage: cn(
    position('relative')
      .overflow('hidden')
      .height('200px')
  ),

  image: cn(
    width('100%')
      .height('100%')
      .objectFit('cover')
      .transition('transform 0.3s ease')
  ),

  overlay: cn(
    position('absolute')
      .top('0')
      .left('0')
      .right('0')
      .bottom('0')
      .bg('rgba(0,0,0,0.5)')
      .flex()
      .alignItems('center')
      .justifyContent('center')
  ),

  overlayText: cn(
    color('white')
      .fontSize('1.25rem')
      .fontWeight('bold')
  ),

  content: cn(
    padding('1.5rem')
  ),

  cardTitle: cn(
    margin('0 0 0.5rem 0')
      .fontSize('1.25rem')
      .fontWeight('600')
      .color('#1a1a2e')
  ),

  cardDesc: cn(
    margin('0 0 1rem 0')
      .fontSize('0.9rem')
      .color('#666')
      .lineHeight('1.5')
  ),

  footer: cn(
    flex()
      .justifyContent('space-between')
      .alignItems('center')
  ),

  price: cn(
    fontSize('1.5rem')
      .fontWeight('bold')
      .color('#3b82f6')
  ),

  button: cn(
    color('white')
      .padding('0.75rem 1.5rem')
      .borderRadius('8px')
      .border('none')
      .fontSize('0.9rem')
      .fontWeight('600')
      .transition('background-color 0.2s')
  )
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
};

let products: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling headphones with 30-hour battery.',
    price: 299.99,
    image: '/images/headphones.jpg',
    inStock: true
  },
  {
    id: 2,
    name: 'Smart Watch',
    description: 'Track your fitness, receive notifications, and more.',
    price: 399.99,
    image: '/images/watch.jpg',
    inStock: true
  },
  {
    id: 3,
    name: 'Portable Speaker',
    description: 'Waterproof speaker with incredible bass and clarity.',
    price: 149.99,
    image: '/images/speaker.jpg',
    inStock: false
  }
];

function ProductCard(product: Product) {
  let isHovered = false;

  return div(
    styles.card,
    {
      // Reactive style: a function that returns the style object
      style: () => ({
        boxShadow: isHovered
          ? '0 10px 40px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
      })
    },
    on('mouseenter', () => { isHovered = true; update(); }),
    on('mouseleave', () => { isHovered = false; update(); }),

    // Image container
    div(styles.cardImage,
      img({
        src: product.image,
        alt: product.name,
        style: () => ({
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        })
      }, styles.image),

      // Out of stock overlay
      when(() => !product.inStock,
        div(styles.overlay,
          span(styles.overlayText, 'Out of Stock')
        )
      )
    ),

    // Content
    div(styles.content,
      h3(styles.cardTitle, product.name),
      p(styles.cardDesc, product.description),

      div(styles.footer,
        span(styles.price, () => \`$\${product.price.toFixed(2)}\`),

        button(
          styles.button,
          {
            style: () => ({
              backgroundColor: product.inStock ? '#3b82f6' : '#ccc',
              cursor: product.inStock ? 'pointer' : 'not-allowed'
            })
          },
          on('click', () => {
            if (product.inStock) {
              console.log(\`Added \${product.name} to cart\`);
            }
          }),
          product.inStock ? 'Add to Cart' : 'Unavailable'
        )
      )
    )
  );
}

const app = div(
  styles.page,

  div(styles.header,
    h1(styles.title, 'Featured Products'),
    p(styles.subtitle, 'Discover our latest collection')
  ),

  div(styles.grid,
    list(() => products, product => ProductCard(product))
  )
);

render(app, document.body);`}];export{e};
