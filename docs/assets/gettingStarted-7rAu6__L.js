const e={installNpm:{lang:"bash",code:"npm install nuclo"},denoImport:{lang:"typescript",code:"import 'npm:nuclo';"},denoJson:{lang:"json",code:`{
  "imports": {
    "nuclo": "npm:nuclo"
  }
}`},denoUsage:{lang:"typescript",code:"import 'nuclo';"},tsconfigTypes:{lang:"json",code:`{
  "compilerOptions": {
    "types": ["nuclo/types"]
  }
}`},typesReference:{lang:"typescript",code:'/// <reference types="nuclo/types" />'},firstApp:{lang:"typescript",code:`import 'nuclo';

// State - just plain JavaScript variables
let count = 0;

// Create the UI
const app = div(
  h1(() => \`Count: \${count}\`),
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

// Render to the DOM
render(app, document.body);`},batchUpdates:{lang:"typescript",code:`// Good: Multiple changes, single update
function handleSubmit() {
  user.name = 'Alice';
  user.email = 'alice@example.com';
  user.age = 30;
  todos.push({ id: 1, text: 'New todo', done: false });
  update(); // One update for all changes
}

// Works but inefficient: Update after each change
function handleSubmit() {
  user.name = 'Alice';
  update();
  user.email = 'alice@example.com';
  update();
  user.age = 30;
  update();
  // 3 updates instead of 1!
}`},reactiveText:{lang:"typescript",code:`let name = 'World';

div(
  'Hello, ',
  () => name,  // Reactive
  '!'
);

// After name changes and update() is called,
// the div will show "Hello, Alice!"`},reactiveAttributes:{lang:"typescript",code:`let isActive = false;

div({
  className: () => isActive ? 'active' : 'inactive',
  'aria-pressed': () => isActive,
  disabled: () => !isActive
});`},reactiveStyles:{lang:"typescript",code:`let opacity = 1;

div({
  style: {
    opacity: () => opacity,
    display: () => opacity > 0 ? 'block' : 'none'
  }
});`},complexExpressions:{lang:"typescript",code:"let items = [1, 2, 3];\n\ndiv(\n  () => `You have ${items.length} item${items.length !== 1 ? 's' : ''}`\n);"},eventBasic:{lang:"typescript",code:`button('Click me',
  on('click', () => {
    console.log('Clicked!');
  })
);`},eventMultiple:{lang:"typescript",code:`input(
  on('input', (e) => {
    inputValue = e.target.value;
    update();
  }),
  on('focus', () => {
    isFocused = true;
    update();
  }),
  on('blur', () => {
    isFocused = false;
    update();
  })
);`},eventOptions:{lang:"typescript",code:`div(
  on('scroll', handleScroll, { passive: true }),
  on('click', handleClick, { capture: true, once: true })
);`},keyboardEvents:{lang:"typescript",code:`input(
  on('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  })
);`},stylingSetup:{lang:"typescript",code:`// Create once (typically in styles.ts)
const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

// Chain style helpers and wrap with cn()
const buttonStyle = cn(
  bg('#3b82f6')
    .color('white')
    .padding('0.75rem 1.5rem')
    .borderRadius('8px')
    .border('none')
    .cursor('pointer')
);

// Use in your component
button(buttonStyle, 'Click me');`},responsiveStyles:{lang:"typescript",code:`const responsiveCard = cn(
  padding('1rem').bg('white'),
  {
    medium: padding('1.5rem'),
    large: padding('2rem').maxWidth('800px')
  }
);`},dynamicStyles:{lang:"typescript",code:`// For dynamic styles, use a function that returns the style object
let isActive = false;

const baseStyle = cn(bg('white').transition('all 0.3s'));

div(
  baseStyle,
  {
    // Reactive style: function returns the style object
    style: () => ({
      backgroundColor: isActive ? 'green' : 'gray',
      transform: isActive ? 'scale(1.05)' : 'scale(1)'
    })
  },
  on('click', () => { isActive = !isActive; update(); }),
  'Toggle me'
);`},bestPracticeBatch:{lang:"typescript",code:`// Good
function handleMultipleChanges() {
  state.field1 = value1;
  state.field2 = value2;
  state.field3 = value3;
  update();
}

// Avoid
function handleMultipleChanges() {
  state.field1 = value1;
  update();
  state.field2 = value2;
  update();
  state.field3 = value3;
  update();
}`},bestPracticeComputed:{lang:"typescript",code:`// Extract complex logic into functions
function activeCount() {
  return todos.filter(t => !t.done).length;
}

div(
  () => \`\${activeCount()} tasks remaining\`
);`},componentFunctions:{lang:"typescript",code:`function UserCard(user) {
  return div(
    { className: 'user-card' },
    img({ src: user.avatar, alt: user.name }),
    h3(user.name),
    p(user.bio)
  );
}

// Use it
div(
  UserCard(currentUser)
);`},mutableState:{lang:"typescript",code:`// Just use plain objects and arrays
let user = {
  name: 'Alice',
  email: 'alice@example.com',
  preferences: {
    theme: 'dark',
    notifications: true
  }
};

let todos = [
  { id: 1, text: 'Learn nuclo', done: true },
  { id: 2, text: 'Build awesome app', done: false }
];`},asyncFlow:{lang:"typescript",code:`let status = 'idle'; // 'idle' | 'loading' | 'success' | 'error'
let data = null;
let error = null;

async function fetchData() {
  status = 'loading';
  update();

  try {
    const response = await fetch('/api/data');
    data = await response.json();
    status = 'success';
  } catch (err) {
    error = err.message;
    status = 'error';
  }

  update();
}`}};export{e as g};
