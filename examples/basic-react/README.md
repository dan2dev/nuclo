# Basic React - Nuclo Example

This is a React implementation of the [basic example](../basic) that demonstrates the same functionality as the Nuclo version. This example is built with React, TypeScript, and Vite.

## Features

This example implements the exact same features as the Nuclo basic example:

- **Todo List**: Add, toggle completion, and delete todos
- **Counter**: Increment counter manually or automatically with play/stop controls
- **Visibility Toggle**: Toggle visibility state demonstration
- **Beautiful UI**: Styled with the same color scheme and layout as the Nuclo version

## Running the Example

```bash
# Install dependencies (from the root of the repository)
pnpm install

# Run development server
pnpm --filter basic-react dev

# Build for production
pnpm --filter basic-react build

# Preview production build
pnpm --filter basic-react preview
```

## Comparing with Nuclo

This React version demonstrates how the same application can be built with React. You can compare:

- **State Management**: React uses `useState` hooks vs Nuclo's reactive state
- **Effects**: React uses `useEffect` vs Nuclo's automatic updates
- **Styling**: React uses CSS classes vs Nuclo's CSS-in-JS utilities
- **File Structure**: React separates HTML/CSS/JS vs Nuclo's component approach

See the [basic example](../basic) for the Nuclo implementation.
