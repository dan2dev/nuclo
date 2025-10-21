// Working example demonstrating Tailwind-like configuration for styleSetup
import "./style.css";
import "nuclo";
import { store } from "./store";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

// Simple configuration object similar to Tailwind
const config = {
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
    spacing: {
      '18': '4.5rem',
      '88': '22rem',
      '128': '32rem',
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    }
  }
};

// Simple styleSetup function that uses the configuration
function createStyleSetup(userConfig: any = {}) {
  const mergedConfig = { ...config, ...userConfig };
  
  // Access theme values
  function theme(path: string) {
    const keys = path.split('.');
    let value: any = mergedConfig.theme;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // Simple cn function that demonstrates the concept
  function cn(classes: string[] | string | Record<string, string[]>) {
    return (el: ExpandedElement, index: number) => {
      if (typeof classes === 'string') {
        el.classList?.add(classes);
        return;
      }

      if (Array.isArray(classes)) {
        classes.forEach(cls => {
          el.classList?.add(cls);
        });
        return;
      }

      // Handle responsive classes
      Object.entries(classes).forEach(([breakpoint, classList]) => {
        if (breakpoint in mergedConfig.theme.screens) {
          // Apply classes with breakpoint prefix
          classList?.forEach(cls => {
            const responsiveClass = `${cls}-${breakpoint}`;
            el.classList?.add(responsiveClass);
          });
        } else {
          // Apply classes directly
          classList?.forEach(cls => {
            el.classList?.add(cls);
          });
        }
      });
    };
  }

  return {
    cn,
    theme,
    config: mergedConfig,
  };
}

// Initialize the style system
const style = createStyleSetup();

// Demonstrate accessing theme values
console.log('Primary color:', style.theme('colors.primary.500'));
console.log('Custom spacing:', style.theme('spacing.18'));
console.log('Screen breakpoint:', style.theme('screens.lg'));

// Demonstrate responsive classes
const responsiveStyle = style.cn({
  "sm": ["flex", "flex-col", "bg-primary-500", "w-full", "h-full", "p-4"],
  "lg": ["flex", "flex-row", "bg-secondary-500", "w-500px", "h-500px", "p-6"],
});

const app = div(
  // Main container with responsive layout
  responsiveStyle,
  
  // Header section
  div(
    style.cn(["flex", "flex-col", "items-center", "justify-center", "p-4", "bg-secondary-800", "rounded-lg", "m-2"]),
    h1(
      style.cn(["text-white", "font-bold", "text-center"]),
      "Nuclo Counter App"
    ),
    p(
      style.cn(["text-secondary-300", "text-center"]),
      "Built with Tailwind-like configuration system"
    )
  ),
  
  // Counter display
  div(
    responsiveStyle,
    h2(
      style.cn(["text-primary-500", "font-extrabold", "text-center"]),
      "Counter: ",
      span(
        style.cn(["text-danger", "font-bold"]),
        () => store.counter
      )
    )
  ),
  
  // Button controls
  div(
    style.cn(["flex", "flex-row", "items-center", "justify-center", "gap-4"]),
    button(
      "+", 
      style.cn(["p-3", "m-1", "rounded-md", "bg-success", "text-white", "font-bold"]),
      on("click", store.increment)
    ),
    button(
      "Reset", 
      style.cn(["p-3", "m-1", "rounded-md", "bg-secondary-500", "text-white", "font-bold"]),
      on("click", store.reset)
    ),
    button(
      "-", 
      style.cn(["p-3", "m-1", "rounded-md", "bg-danger", "text-white", "font-bold"]),
      on("click", store.decrement)
    )
  ),
  
  // Footer
  div(
    style.cn(["text-white", "text-center", "p-2"]),
    "Tailwind-like configuration system for nuclo"
  )
);

render(app, appRoot);
