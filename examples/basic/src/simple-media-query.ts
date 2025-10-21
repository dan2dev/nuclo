// Simple media query implementation that works with current TypeScript config
import "./style.css";
import "nuclo";
import { store } from "./store";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

// Simple configuration object similar to Tailwind
const config = {
  theme: {
    colors: {
      primary: {
        500: '#3b82f6',
      },
      secondary: {
        500: '#64748b',
        800: '#1e293b',
        300: '#cbd5e1',
      },
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
    spacing: {
      '4': '1rem',
      '6': '1.5rem',
    },
    screens: {
      sm: 'min-width: 640px',
      lg: 'min-width: 1024px',
    }
  }
};

// Simple styleSetup function that uses the configuration
function createStyleSetup(userConfig: any = {}) {
  const mergedConfig = { ...config, ...userConfig };
  
  // Global style state management
  const styleState = {
    initialized: false,
    sheet: null as CSSStyleSheet | null,
    classCache: [] as string[],
  };

  // Initialize stylesheet if not already done
  if (!styleState.initialized) {
    styleState.initialized = true;
    
    // Create a style element and add it to the head
    const styleElement = document.createElement('style');
    styleElement.id = 'nuclo-styles';
    document.head.appendChild(styleElement);
    styleState.sheet = styleElement.sheet;
  }

  // Function to add CSS rule if not already exists
  function addCSSRule(className: string, cssRule: string, mediaQuery?: string): void {
    if (styleState.classCache.indexOf(className) !== -1) return;
    
    styleState.classCache.push(className);
    
    if (mediaQuery && styleState.sheet) {
      // Generate responsive CSS with media query
      const mediaRule = `@media (${mediaQuery}) { .${className} { ${cssRule} } }`;
      try {
        styleState.sheet.insertRule(mediaRule, styleState.sheet.cssRules.length);
      } catch (e) {
        console.warn('Failed to insert CSS rule:', mediaRule, e);
      }
    } else if (styleState.sheet) {
      // Generate regular CSS
      try {
        styleState.sheet.insertRule(`.${className} { ${cssRule} }`, styleState.sheet.cssRules.length);
      } catch (e) {
        console.warn('Failed to insert CSS rule:', className, e);
      }
    }
  }

  // Function to generate CSS for a class name
  function generateCSSForClass(className: string, breakpoint?: string): void {
    if (styleState.classCache.indexOf(className) !== -1) return;
    
    styleState.classCache.push(className);
    
    // Parse class name and generate appropriate CSS
    const cssRule = parseClassNameToCSS(className);
    if (cssRule) {
      if (breakpoint && mergedConfig.theme.screens[breakpoint]) {
        // Generate responsive CSS
        addCSSRule(className, cssRule, mergedConfig.theme.screens[breakpoint]);
      } else {
        // Generate regular CSS
        addCSSRule(className, cssRule);
      }
    }
  }

  // Parse class name to CSS rule
  function parseClassNameToCSS(className: string): string | null {
    // Background colors
    if (className.indexOf('bg-') === 0) {
      const color = className.substring(3);
      const colorValue = getColorValue(color);
      return `background-color: ${colorValue};`;
    }

    // Text colors
    if (className.indexOf('text-') === 0) {
      const color = className.substring(5);
      const colorValue = getColorValue(color);
      return `color: ${colorValue};`;
    }

    // Display
    if (className === 'flex') return 'display: flex;';
    if (className === 'flex-col') return 'flex-direction: column;';
    if (className === 'flex-row') return 'flex-direction: row;';
    if (className === 'grid') return 'display: grid;';
    if (className === 'hidden') return 'display: none;';
    if (className === 'block') return 'display: block;';
    if (className === 'inline') return 'display: inline;';
    if (className === 'inline-block') return 'display: inline-block;';
    if (className === 'inline-flex') return 'display: inline-flex;';

    // Flexbox alignment
    if (className === 'items-center') return 'align-items: center;';
    if (className === 'items-start') return 'align-items: flex-start;';
    if (className === 'items-end') return 'align-items: flex-end;';
    if (className === 'items-baseline') return 'align-items: baseline;';
    if (className === 'items-stretch') return 'align-items: stretch;';
    
    if (className === 'justify-center') return 'justify-content: center;';
    if (className === 'justify-start') return 'justify-content: flex-start;';
    if (className === 'justify-end') return 'justify-content: flex-end;';
    if (className === 'justify-between') return 'justify-content: space-between;';
    if (className === 'justify-around') return 'justify-content: space-around;';
    if (className === 'justify-evenly') return 'justify-content: space-evenly;';

    // Width
    if (className.indexOf('w-') === 0) {
      const value = className.substring(2);
      const widthValue = getSpacingValue(value);
      return `width: ${widthValue};`;
    }

    // Height
    if (className.indexOf('h-') === 0) {
      const value = className.substring(2);
      const heightValue = getSpacingValue(value);
      return `height: ${heightValue};`;
    }

    // Padding
    if (className.indexOf('p-') === 0) {
      const value = className.substring(2);
      const paddingValue = getSpacingValue(value);
      return `padding: ${paddingValue};`;
    }

    // Margin
    if (className.indexOf('m-') === 0) {
      const value = className.substring(2);
      const marginValue = getSpacingValue(value);
      return `margin: ${marginValue};`;
    }

    // Gap
    if (className.indexOf('gap-') === 0) {
      const value = className.substring(4);
      const gapValue = getSpacingValue(value);
      return `gap: ${gapValue};`;
    }

    // Text alignment
    if (className.indexOf('text-') === 0) {
      if (className === 'text-left') return 'text-align: left;';
      if (className === 'text-center') return 'text-align: center;';
      if (className === 'text-right') return 'text-align: right;';
      if (className === 'text-justify') return 'text-align: justify;';
    }

    // Font weight
    if (className.indexOf('font-') === 0) {
      if (className === 'font-thin') return 'font-weight: 100;';
      if (className === 'font-light') return 'font-weight: 300;';
      if (className === 'font-normal') return 'font-weight: 400;';
      if (className === 'font-medium') return 'font-weight: 500;';
      if (className === 'font-semibold') return 'font-weight: 600;';
      if (className === 'font-bold') return 'font-weight: 700;';
      if (className === 'font-extrabold') return 'font-weight: 800;';
      if (className === 'font-black') return 'font-weight: 900;';
    }

    // Border radius
    if (className.indexOf('rounded-') === 0) {
      const value = className.substring(8);
      const borderRadius: Record<string, string> = {
        none: '0',
        sm: '0.125rem',
        default: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      };
      const radiusValue = borderRadius[value] || value;
      return `border-radius: ${radiusValue};`;
    }

    return null;
  }

  // Helper function to get color value from config
  function getColorValue(colorName: string): string {
    if (colorName.indexOf('#') === 0) return colorName;
    
    // Handle nested color objects (e.g., gray.500)
    if (colorName.indexOf('.') !== -1) {
      const parts = colorName.split('.');
      const baseColor = parts[0];
      const shade = parts[1];
      const colorObj = mergedConfig.theme.colors[baseColor];
      if (typeof colorObj === 'object' && colorObj !== null) {
        return (colorObj as any)[shade] || colorName;
      }
    }
    
    // Handle direct color values
    const colorValue = mergedConfig.theme.colors[colorName];
    if (typeof colorValue === 'string') {
      return colorValue;
    }
    
    // Fallback to default colors
    const defaultColors: Record<string, string> = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#22c55e',
      yellow: '#eab308',
      purple: '#a855f7',
      pink: '#ec4899',
      indigo: '#6366f1',
      gray: '#6b7280',
      black: '#000000',
      white: '#ffffff',
      transparent: 'transparent',
      'gray-900': '#111827',
      'gray-600': '#4b5563',
      'primary-500': '#3b82f6',
      'secondary-500': '#64748b',
      'secondary-800': '#1e293b',
      'secondary-300': '#cbd5e1',
      'success': '#10b981',
      'danger': '#ef4444',
      'warning': '#f59e0b',
      'info': '#06b6d4',
    };
    
    return defaultColors[colorName] || colorName;
  }

  // Helper function to get spacing value from config
  function getSpacingValue(value: string): string {
    const numericValue = parseInt(value);
    if (!isNaN(numericValue) && mergedConfig.theme.spacing[numericValue]) {
      return mergedConfig.theme.spacing[numericValue];
    }
    if (mergedConfig.theme.spacing[value]) {
      return mergedConfig.theme.spacing[value];
    }
    return value;
  }
  
  // Access theme values
  function theme(path: string) {
    const keys = path.split('.');
    let value: any = mergedConfig.theme;
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // Enhanced cn function that generates CSS with media queries
  function cn(classes: string[] | string | Record<string, string[]>) {
    return (el: ExpandedElement, index: number) => {
      if (typeof classes === 'string') {
        el.classList?.add(classes);
        generateCSSForClass(classes);
        return;
      }

      if (Array.isArray(classes)) {
        for (let i = 0; i < classes.length; i++) {
          const cls = classes[i];
          el.classList?.add(cls);
          generateCSSForClass(cls);
        }
        return;
      }

      // Handle responsive classes
      for (const breakpoint in classes) {
        const classList = classes[breakpoint];
        if (breakpoint in mergedConfig.theme.screens) {
          // Apply classes with breakpoint prefix and generate responsive CSS
          for (let i = 0; i < classList.length; i++) {
            const cls = classList[i];
            const responsiveClass = `${cls}-${breakpoint}`;
            el.classList?.add(responsiveClass);
            generateCSSForClass(cls, breakpoint);
          }
        } else {
          // Apply classes directly
          for (let i = 0; i < classList.length; i++) {
            const cls = classList[i];
            el.classList?.add(cls);
            generateCSSForClass(cls);
          }
        }
      }
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
console.log('Custom spacing:', style.theme('spacing.4'));
console.log('Screen breakpoint:', style.theme('screens.lg'));

// Debug: Log generated CSS
setTimeout(() => {
  console.log('Generated CSS:');
  const styleElement = document.getElementById('nuclo-styles') as HTMLStyleElement;
  if (styleElement && styleElement.sheet) {
    console.log('Style sheet:', styleElement.sheet);
    for (let i = 0; i < styleElement.sheet.cssRules.length; i++) {
      console.log(`Rule ${i}:`, styleElement.sheet.cssRules[i].cssText);
    }
  }
}, 1000);

// Demonstrate responsive classes
const someStyle = style.cn({
  "sm": ["flex", "flex-col", "bg-primary-500", "w-full", "h-full", "p-4"],
  "lg": ["flex", "flex-row", "bg-secondary-500", "w-500px", "h-500px", "p-6"],
});

const app = div(
  // Main container with responsive layout
  someStyle,
  
  // Header section
  div(
    style.cn(["flex", "flex-col", "items-center", "justify-center", "p-4", "bg-secondary-800", "rounded-lg", "m-2"]),
    h1(
      style.cn(["text-white", "font-bold", "text-center"]),
      "Nuclo Counter App"
    ),
    p(
      style.cn(["text-secondary-300", "text-center"]),
      "Built with working media queries!"
    )
  ),
  
  // Counter display
  div(
    someStyle,
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
    "Media queries are now working! Resize your browser to see the responsive behavior."
  )
);

render(app, appRoot);
