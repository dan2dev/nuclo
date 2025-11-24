// Auto-generated from /tmp/nuclo-api.html to preserve API reference code samples
export const apiCode = {
  updateUsage: { lang: 'typescript', code: `let count = 0;

button('Increment', on('click', () => {
  count++;
  update(); // Trigger UI update
}));` },
  renderUsage: { lang: 'typescript', code: `const app = div(
  h1('My App'),
  p('Hello, world!')
);

render(app, document.body);` },
  listBasic: { lang: 'typescript', code: `let todos = [
  { id: 1, text: 'Learn nuclo', done: false },
  { id: 2, text: 'Build app', done: false }
];

list(() => todos, (todo, index) =>
  div(
    { className: () => todo.done ? 'done' : '' },
    span(() => \`\${index + 1}. \${todo.text}\`),
    button('Toggle', on('click', () => {
      todo.done = !todo.done;
      update();
    }))
  )
);` },
  listIdentity: { lang: 'typescript', code: `// ✓ Good: Mutate the object
todos[0].done = true;
update();

// ✗ Bad: Creates a new object, element will be recreated
todos[0] = { ...todos[0], done: true };
update();

// ✓ Good: Mutate the array
todos.push(newTodo);
todos.sort((a, b) => a.id - b.id);
update();

// ✓ Also good: Reassign with filtered array
todos = todos.filter(t => !t.done);
update();` },
  listNested: { lang: 'typescript', code: `// Nested lists
list(() => categories, category =>
  div(
    h3(category.name),
    list(() => category.items, item =>
      div(item.name)
    )
  )
);

// Filtered lists
list(() => todos.filter(t => !t.done), todo =>
  div(todo.text)
);` },
  whenBasic: { lang: 'typescript', code: `let isLoggedIn = false;

when(() => isLoggedIn,
  div('Welcome back!')
).else(
  div('Please log in')
);` },
  whenRoles: { lang: 'typescript', code: `let role = 'user'; // 'admin' | 'user' | 'guest'

when(() => role === 'admin',
  div('Admin Panel')
).when(() => role === 'user',
  div('User Dashboard')
).else(
  div('Guest View')
);` },
  whenElseBranch: { lang: 'typescript', code: `when(() => showDetails,
  h2('Details'),
  p('Here are the details...'),
  button('Close', on('click', () => {
    showDetails = false;
    update();
  }))
);` },
  whenPreserve: { lang: 'typescript', code: `// Elements persist across updates if the same branch is active
let count = 0;

when(() => count > 0,
  div('Count is positive')  // This div stays alive while count > 0
).else(
  div('Count is zero or negative')
);

// Multiple updates with count > 0 won't recreate the div
count = 5; update();
count = 10; update();
count = 15; update();  // Same div element throughout` },
  whenNestedConditions: { lang: 'typescript', code: `when(() => user.isAuthenticated,
  when(() => user.hasPermission,
    div('Protected Content')
  ).else(
    div('Access Denied')
  )
).else(
  div('Please log in')
);` },
  onClick: { lang: 'typescript', code: `button('Click me',
  on('click', (e) => {
    console.log('Button clicked!', e);
  })
);` },
  onMultipleEvents: { lang: 'typescript', code: `input(
  on('input', (e) => {
    value = e.target.value;
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
);` },
  onPassive: { lang: 'typescript', code: `// Passive event for better scroll performance
div(
  on('scroll', handleScroll, { passive: true })
);

// Capture phase
div(
  on('click', handleClick, { capture: true })
);

// One-time event
button('Click once',
  on('click', handleClick, { once: true })
);` },
  onKeyboard: { lang: 'typescript', code: `input(
  on('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  })
);` },
  onFormSubmit: { lang: 'typescript', code: `form(
  on('submit', (e) => {
    e.preventDefault();
    handleFormSubmit();
  }),

  input({ type: 'text', name: 'username' },
    on('input', (e) => {
      username = e.target.value;
      update();
    })
  ),

  button({ type: 'submit' }, 'Submit')
);` },
  tagBuilderBasic: { lang: 'typescript', code: `// Just children
div('Hello, world!');

// Attributes + children
div(
  { className: 'container', id: 'main' },
  'Hello, world!'
);

// Nested elements
div(
  h1('Title'),
  p('Paragraph'),
  ul(
    li('Item 1'),
    li('Item 2')
  )
);` },
  svgExample: { lang: 'typescript', code: `const icon = svg(
  { viewBox: '0 0 24 24', width: '24', height: '24' },
  circle({ cx: '12', cy: '12', r: '10', fill: 'blue' }),
  path({ d: 'M12 2 L12 22', stroke: 'white', 'stroke-width': '2' })
);` },
  attributesStatic: { lang: 'typescript', code: `div({
  id: 'main',
  className: 'container',
  'data-test': 'value',
  'aria-label': 'Main content'
});` },
  attributesReactive: { lang: 'typescript', code: `div({
  className: () => isActive ? 'active' : 'inactive',
  'aria-pressed': () => isActive,
  disabled: () => !isValid,
  hidden: () => !isVisible
});` },
  attributesStyle: { lang: 'typescript', code: `// Object style
div({
  style: {
    color: 'red',
    fontSize: '16px',
    backgroundColor: () => isActive ? 'blue' : 'gray'
  }
});

// String style
div({
  style: 'color: red; font-size: 16px;'
});

// Reactive string style
div({
  style: () => \`color: \${color}; font-size: \${size}px;\`
});` },
  attributesBoolean: { lang: 'typescript', code: `input({
  type: 'checkbox',
  checked: () => isChecked,
  disabled: () => isDisabled,
  required: true,
  readonly: false
});` },
  specialAttributes: { lang: 'typescript', code: `// className (maps to 'class')
div({ className: 'my-class' });

// htmlFor (maps to 'for')
label({ htmlFor: 'input-id' }, 'Label');

// Data attributes
div({ 'data-id': '123', 'data-type': 'user' });` },
  classNameMerging: { lang: 'typescript', code: `// Multiple className sources are merged
div(
  { className: 'base-class' },
  { className: 'additional-class' },
  { className: () => isActive ? 'active' : 'inactive' }
);
// Result: "base-class additional-class active" (or "inactive")` },
  classNameConditional: { lang: 'typescript', code: `let isOpen = false;
let isError = false;

div({
  className: 'dropdown'  // Static class
}, {
  className: () => isOpen ? 'open' : ''  // Reactive class
}, {
  className: () => isError ? 'error' : ''  // Another reactive class
});

// With isOpen=true, isError=false: "dropdown open"
// With isOpen=true, isError=true: "dropdown open error"` },
  styleHelperMerging: { lang: 'typescript', code: `// Style helpers that generate classes are also merged
const cardStyle = new StyleBuilder()
  .bg('white')
  .padding('1rem')
  .build();

div(
  { className: 'my-card' },
  cardStyle,  // Generated class is merged
  'Content'
);
// Result: "my-card n-abc123" (merged classes)` },
  classNameStatusPattern: { lang: 'typescript', code: `// Common pattern for conditional styling
let status = 'active'; // 'active' | 'pending' | 'error'

div({
  className: () => {
    const classes = ['status-badge'];
    if (status === 'active') classes.push('badge-green');
    if (status === 'pending') classes.push('badge-yellow');
    if (status === 'error') classes.push('badge-red');
    return classes.join(' ');
  }
}, () => status);` },
  styleHelpersCreateQueries: { lang: 'typescript', code: `// Create style queries helper (usually done once in styles.ts)
const cn = createStyleQueries({
  medium: '@media (min-width: 768px)',
  large: '@media (min-width: 1024px)'
});

// Chain style methods, wrap with cn() to get class name
const cardStyle = cn(
  bg('white')
    .padding('1.5rem')
    .borderRadius('12px')
    .boxShadow('0 4px 6px rgba(0,0,0,0.1)')
);

// Use in your component
div(cardStyle, 'Card content');` },
  styleHelpersResponsive: { lang: 'typescript', code: `// Pass breakpoint overrides as second argument
const responsiveStyle = cn(
  padding('1rem').fontSize('14px'),
  {
    medium: padding('1.5rem').fontSize('16px'),
    large: padding('2rem').fontSize('18px')
  }
);` },
  styleHelpersFullList: { lang: 'typescript', code: `// All helpers return StyleBuilder and can be chained
bg('#f0f0f0').color('#333').padding('1rem')

// Layout
display('flex'), position('relative'), width('100%')

// Spacing
padding('1rem'), margin('0 auto')

// Typography
fontSize('16px'), fontWeight('bold'), textAlign('center')

// Flexbox
flex(), flexDirection('column'), gap('1rem')
center()  // shorthand for centering both axes

// Effects
boxShadow('...'), opacity('0.5'), transition('all 0.3s')` },
  styleHelpersReactiveStyles: { lang: 'typescript', code: `// Use a function that returns the style object
let isHovered = false;

const baseStyle = cn(
  bg('white').transition('all 0.3s ease')
);

div(
  baseStyle,
  {
    // Reactive style: function returns the entire style object
    style: () => ({
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
    })
  },
  on('mouseenter', () => { isHovered = true; update(); }),
  on('mouseleave', () => { isHovered = false; update(); }),
  'Hover me'
);` },
  modifiersEvents: { lang: 'typescript', code: `button('Click',
  on('click', handleClick),
  on('mouseenter', handleHover)
);` },
  modifiersStyles: { lang: 'typescript', code: `div(
  bg('blue'),     // Style modifier
  padding('1rem') // Style modifier
);` },
  modifiersCustomFocus: { lang: 'typescript', code: `// Example: Focus modifier
function focus() {
  return {
    __modifier: true,
    apply(element) {
      requestAnimationFrame(() => element.focus());
    }
  };
}

// Usage
input(focus());

// Example: Tooltip modifier
function tooltip(text: string) {
  return {
    __modifier: true,
    apply(element) {
      element.setAttribute('title', text);
      element.setAttribute('data-tooltip', text);
    }
  };
}

// Usage
button('Hover me', tooltip('Click to submit'));` },
} as const;
