// Improved styling system with enhanced features
import "./style.css";
import "nuclo";
import { store } from "./store";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

// Enhanced configuration with more features
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
      white: '#ffffff',
      black: '#000000',
    },
    spacing: {
      '0': '0',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '8': '2rem',
      '10': '2.5rem',
      '12': '3rem',
      '16': '4rem',
      '20': '5rem',
      '24': '6rem',
      '32': '8rem',
      '40': '10rem',
      '48': '12rem',
      '56': '14rem',
      '64': '16rem',
    },
    fontSize: {
      'xs': '0.75rem',
      'sm': '0.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      'thin': '100',
      'light': '300',
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'bold': '700',
      'extrabold': '800',
      'black': '900',
    },
    borderRadius: {
      'none': '0',
      'sm': '0.125rem',
      'default': '0.25rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'xl': '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      'full': '9999px',
    },
    boxShadow: {
      'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'default': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      'none': 'none',
    },
    screens: {
      sm: 'min-width: 640px',
      md: 'min-width: 768px',
      lg: 'min-width: 1024px',
      xl: 'min-width: 1280px',
      '2xl': 'min-width: 1536px',
    }
  },
  // Enhanced features
  darkMode: 'class', // or 'media'
  important: false,
  prefix: '',
  separator: ':',
};

// Enhanced styleSetup function with improved features
function createImprovedStyleSetup(userConfig: any = {}) {
  const mergedConfig = { ...config, ...userConfig };
  
  // Enhanced style state management
  const styleState = {
    initialized: false,
    sheet: null as CSSStyleSheet | null,
    classCache: [] as string[],
    ruleCache: new Map<string, string>(),
    mediaQueries: new Map<string, string>(),
    darkMode: false,
  };

  // Initialize stylesheet if not already done
  if (!styleState.initialized) {
    styleState.initialized = true;
    
    // Create a style element and add it to the head
    const styleElement = document.createElement('style');
    styleElement.id = 'nuclo-styles';
    styleElement.setAttribute('data-nuclo', 'true');
    document.head.appendChild(styleElement);
    styleState.sheet = styleElement.sheet;

    // Initialize dark mode detection
    if (mergedConfig.darkMode === 'media') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      styleState.darkMode = mediaQuery.matches;
      mediaQuery.addEventListener('change', (e) => {
        styleState.darkMode = e.matches;
        // Regenerate styles for dark mode
        regenerateStyles();
      });
    } else if (mergedConfig.darkMode === 'class') {
      styleState.darkMode = document.documentElement.classList.contains('dark');
    }
  }

  // Function to regenerate styles (useful for dark mode)
  function regenerateStyles() {
    if (styleState.sheet) {
      // Clear existing rules
      while (styleState.sheet.cssRules.length > 0) {
        styleState.sheet.deleteRule(0);
      }
    }
    styleState.classCache = [];
    styleState.ruleCache.clear();
  }

  // Enhanced function to add CSS rule with better error handling
  function addCSSRule(className: string, cssRule: string, mediaQuery?: string, darkMode = false): void {
    const cacheKey = `${className}-${mediaQuery || 'base'}-${darkMode ? 'dark' : 'light'}`;
    
    if (styleState.ruleCache.has(cacheKey)) return;
    
    styleState.ruleCache.set(cacheKey, cssRule);
    
    if (!styleState.sheet) return;

    try {
      let finalRule = cssRule;
      
      // Add dark mode prefix if needed
      if (darkMode && mergedConfig.darkMode === 'class') {
        finalRule = `.dark ${cssRule}`;
      }
      
      if (mediaQuery) {
        // Generate responsive CSS with media query
        const mediaRule = `@media (${mediaQuery}) { .${className} { ${finalRule} } }`;
        styleState.sheet.insertRule(mediaRule, styleState.sheet.cssRules.length);
      } else {
        // Generate regular CSS
        const regularRule = `.${className} { ${finalRule} }`;
        styleState.sheet.insertRule(regularRule, styleState.sheet.cssRules.length);
      }
    } catch (e) {
      console.warn('Failed to insert CSS rule:', className, e);
    }
  }

  // Enhanced function to generate CSS for a class name
  function generateCSSForClass(className: string, breakpoint?: string, darkMode = false): void {
    const cacheKey = `${className}-${breakpoint || 'base'}-${darkMode ? 'dark' : 'light'}`;
    
    if (styleState.ruleCache.has(cacheKey)) return;
    
    // Parse class name and generate appropriate CSS
    const cssRule = parseClassNameToCSS(className, darkMode);
    if (cssRule) {
      if (breakpoint && mergedConfig.theme.screens[breakpoint]) {
        // Generate responsive CSS
        addCSSRule(className, cssRule, mergedConfig.theme.screens[breakpoint], darkMode);
      } else {
        // Generate regular CSS
        addCSSRule(className, cssRule, undefined, darkMode);
      }
    }
  }

  // Enhanced parse class name to CSS rule with more utilities
  function parseClassNameToCSS(className: string, darkMode = false): string | null {
    // Background colors
    if (className.indexOf('bg-') === 0) {
      const color = className.substring(3);
      const colorValue = getColorValue(color, darkMode);
      return `background-color: ${colorValue};`;
    }

    // Text colors
    if (className.indexOf('text-') === 0) {
      const color = className.substring(5);
      const colorValue = getColorValue(color, darkMode);
      return `color: ${colorValue};`;
    }

    // Border colors
    if (className.indexOf('border-') === 0) {
      const color = className.substring(7);
      const colorValue = getColorValue(color, darkMode);
      return `border-color: ${colorValue};`;
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

    // Padding top
    if (className.indexOf('pt-') === 0) {
      const value = className.substring(3);
      const paddingValue = getSpacingValue(value);
      return `padding-top: ${paddingValue};`;
    }

    // Padding right
    if (className.indexOf('pr-') === 0) {
      const value = className.substring(3);
      const paddingValue = getSpacingValue(value);
      return `padding-right: ${paddingValue};`;
    }

    // Padding bottom
    if (className.indexOf('pb-') === 0) {
      const value = className.substring(3);
      const paddingValue = getSpacingValue(value);
      return `padding-bottom: ${paddingValue};`;
    }

    // Padding left
    if (className.indexOf('pl-') === 0) {
      const value = className.substring(3);
      const paddingValue = getSpacingValue(value);
      return `padding-left: ${paddingValue};`;
    }

    // Padding horizontal
    if (className.indexOf('px-') === 0) {
      const value = className.substring(3);
      const paddingValue = getSpacingValue(value);
      return `padding-left: ${paddingValue}; padding-right: ${paddingValue};`;
    }

    // Padding vertical
    if (className.indexOf('py-') === 0) {
      const value = className.substring(3);
      const paddingValue = getSpacingValue(value);
      return `padding-top: ${paddingValue}; padding-bottom: ${paddingValue};`;
    }

    // Margin
    if (className.indexOf('m-') === 0) {
      const value = className.substring(2);
      const marginValue = getSpacingValue(value);
      return `margin: ${marginValue};`;
    }

    // Margin top
    if (className.indexOf('mt-') === 0) {
      const value = className.substring(3);
      const marginValue = getSpacingValue(value);
      return `margin-top: ${marginValue};`;
    }

    // Margin right
    if (className.indexOf('mr-') === 0) {
      const value = className.substring(3);
      const marginValue = getSpacingValue(value);
      return `margin-right: ${marginValue};`;
    }

    // Margin bottom
    if (className.indexOf('mb-') === 0) {
      const value = className.substring(3);
      const marginValue = getSpacingValue(value);
      return `margin-bottom: ${marginValue};`;
    }

    // Margin left
    if (className.indexOf('ml-') === 0) {
      const value = className.substring(3);
      const marginValue = getSpacingValue(value);
      return `margin-left: ${marginValue};`;
    }

    // Margin horizontal
    if (className.indexOf('mx-') === 0) {
      const value = className.substring(3);
      const marginValue = getSpacingValue(value);
      return `margin-left: ${marginValue}; margin-right: ${marginValue};`;
    }

    // Margin vertical
    if (className.indexOf('my-') === 0) {
      const value = className.substring(3);
      const marginValue = getSpacingValue(value);
      return `margin-top: ${marginValue}; margin-bottom: ${marginValue};`;
    }

    // Gap
    if (className.indexOf('gap-') === 0) {
      const value = className.substring(4);
      const gapValue = getSpacingValue(value);
      return `gap: ${gapValue};`;
    }

    // Font size
    if (className.indexOf('text-') === 0 && mergedConfig.theme.fontSize[className.substring(5)]) {
      const size = className.substring(5);
      const fontSize = mergedConfig.theme.fontSize[size];
      return `font-size: ${fontSize};`;
    }

    // Font weight
    if (className.indexOf('font-') === 0) {
      const weight = className.substring(5);
      const fontWeight = mergedConfig.theme.fontWeight[weight];
      if (fontWeight) {
        return `font-weight: ${fontWeight};`;
      }
    }

    // Text alignment
    if (className.indexOf('text-') === 0) {
      if (className === 'text-left') return 'text-align: left;';
      if (className === 'text-center') return 'text-align: center;';
      if (className === 'text-right') return 'text-align: right;';
      if (className === 'text-justify') return 'text-align: justify;';
    }

    // Border radius
    if (className.indexOf('rounded-') === 0) {
      const value = className.substring(8);
      const borderRadius = mergedConfig.theme.borderRadius[value];
      if (borderRadius) {
        return `border-radius: ${borderRadius};`;
      }
    }

    // Box shadow
    if (className.indexOf('shadow-') === 0) {
      const value = className.substring(7);
      const boxShadow = mergedConfig.theme.boxShadow[value];
      if (boxShadow) {
        return `box-shadow: ${boxShadow};`;
      }
    }

    // Border width
    if (className.indexOf('border-') === 0) {
      const value = className.substring(7);
      if (value === '0') return 'border-width: 0;';
      if (value === '1') return 'border-width: 1px;';
      if (value === '2') return 'border-width: 2px;';
      if (value === '4') return 'border-width: 4px;';
      if (value === '8') return 'border-width: 8px;';
    }

    // Border style
    if (className === 'border-solid') return 'border-style: solid;';
    if (className === 'border-dashed') return 'border-style: dashed;';
    if (className === 'border-dotted') return 'border-style: dotted;';
    if (className === 'border-none') return 'border-style: none;';

    // Position
    if (className === 'static') return 'position: static;';
    if (className === 'relative') return 'position: relative;';
    if (className === 'absolute') return 'position: absolute;';
    if (className === 'fixed') return 'position: fixed;';
    if (className === 'sticky') return 'position: sticky;';

    // Z-index
    if (className.indexOf('z-') === 0) {
      const value = className.substring(2);
      return `z-index: ${value};`;
    }

    // Opacity
    if (className.indexOf('opacity-') === 0) {
      const value = className.substring(8);
      return `opacity: ${parseInt(value) / 100};`;
    }

    return null;
  }

  // Enhanced helper function to get color value from config
  function getColorValue(colorName: string, darkMode = false): string {
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

  // Enhanced helper function to get spacing value from config
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
  
  // Enhanced theme access with better error handling
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

  // Enhanced cn function with better performance and features
  function cn(classes: string[] | string | Record<string, string[]>) {
    return (el: ExpandedElement, index: number) => {
      if (typeof classes === 'string') {
        el.classList?.add(classes);
        generateCSSForClass(classes);
        if (styleState.darkMode) {
          generateCSSForClass(classes, undefined, true);
        }
        return;
      }

      if (Array.isArray(classes)) {
        for (let i = 0; i < classes.length; i++) {
          const cls = classes[i];
          el.classList?.add(cls);
          generateCSSForClass(cls);
          if (styleState.darkMode) {
            generateCSSForClass(cls, undefined, true);
          }
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
            if (styleState.darkMode) {
              generateCSSForClass(cls, breakpoint, true);
            }
          }
        } else {
          // Apply classes directly
          for (let i = 0; i < classList.length; i++) {
            const cls = classList[i];
            el.classList?.add(cls);
            generateCSSForClass(cls);
            if (styleState.darkMode) {
              generateCSSForClass(cls, undefined, true);
            }
          }
        }
      }
    };
  }

  // Utility functions for common patterns
  function container(maxWidth = '1200px') {
    return cn(['mx-auto', 'px-4', 'max-w-full']);
  }

  function card() {
    return cn(['bg-white', 'rounded-lg', 'shadow-md', 'p-6', 'border', 'border-gray-200']);
  }

  function button(variant = 'primary') {
    const variants: Record<string, string[]> = {
      primary: ['bg-primary-500', 'text-white', 'hover:bg-primary-600', 'px-4', 'py-2', 'rounded-md', 'font-medium'],
      secondary: ['bg-secondary-500', 'text-white', 'hover:bg-secondary-600', 'px-4', 'py-2', 'rounded-md', 'font-medium'],
      success: ['bg-success', 'text-white', 'hover:bg-green-600', 'px-4', 'py-2', 'rounded-md', 'font-medium'],
      danger: ['bg-danger', 'text-white', 'hover:bg-red-600', 'px-4', 'py-2', 'rounded-md', 'font-medium'],
    };
    return cn(variants[variant] || variants.primary);
  }

  function input() {
    return cn(['w-full', 'px-3', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500']);
  }

  // Dark mode toggle function
  function toggleDarkMode() {
    if (mergedConfig.darkMode === 'class') {
      document.documentElement.classList.toggle('dark');
      styleState.darkMode = document.documentElement.classList.contains('dark');
      regenerateStyles();
    }
  }

  return {
    cn,
    theme,
    config: mergedConfig,
    container,
    card,
    button,
    input,
    toggleDarkMode,
    // Debug functions
    getGeneratedCSS: () => {
      if (styleState.sheet) {
        const rules = [];
        for (let i = 0; i < styleState.sheet.cssRules.length; i++) {
          rules.push(styleState.sheet.cssRules[i].cssText);
        }
        return rules;
      }
      return [];
    },
    getClassCache: () => styleState.classCache,
    clearCache: () => {
      regenerateStyles();
    }
  };
}

// Initialize the improved style system
const style = createImprovedStyleSetup();

// Demonstrate enhanced features
console.log('Enhanced styling system initialized!');
console.log('Primary color:', style.theme('colors.primary.500'));
console.log('Available spacing:', style.theme('spacing'));
console.log('Available colors:', style.theme('colors'));

// Debug: Log generated CSS
setTimeout(() => {
  console.log('Generated CSS rules:', style.getGeneratedCSS().length);
  console.log('Cached classes:', style.getClassCache().length);
}, 1000);

// Enhanced responsive classes with more utilities
const enhancedStyle = style.cn({
  "sm": ["flex", "flex-col", "bg-primary-500", "w-full", "h-full", "p-4", "rounded-lg", "shadow-md"],
  "lg": ["flex", "flex-row", "bg-secondary-500", "w-500px", "h-500px", "p-6", "rounded-xl", "shadow-lg"],
});

const app = div(
  // Main container with enhanced responsive layout
  enhancedStyle,
  
  // Header section with card styling
  div(
    style.card(),
    h1(
      style.cn(["text-2xl", "font-bold", "text-center", "mb-4"]),
      "Enhanced Nuclo Counter App"
    ),
    p(
      style.cn(["text-gray-600", "text-center", "mb-6"]),
      "Built with improved styling system featuring enhanced utilities!"
    ),
    // Dark mode toggle button
    button(
      "Toggle Dark Mode",
      style.button('secondary'),
      on("click", style.toggleDarkMode)
    )
  ),
  
  // Counter display with enhanced styling
  div(
    style.cn(["bg-white", "rounded-xl", "shadow-lg", "p-8", "text-center", "mb-6"]),
    h2(
      style.cn(["text-4xl", "font-extrabold", "text-primary-500", "mb-2"]),
      "Counter: ",
      span(
        style.cn(["text-6xl", "font-black", "text-danger"]),
        () => store.counter
      )
    )
  ),
  
  // Enhanced button controls with better styling
  div(
    style.cn(["flex", "flex-row", "items-center", "justify-center", "gap-4", "mb-6"]),
    button(
      "+", 
      style.button('success'),
      on("click", store.increment)
    ),
    button(
      "Reset", 
      style.button('secondary'),
      on("click", store.reset)
    ),
    button(
      "-", 
      style.button('danger'),
      on("click", store.decrement)
    )
  ),
  
  // Enhanced footer with more styling
  div(
    style.cn(["text-center", "p-4", "bg-gray-100", "rounded-lg", "text-gray-700"]),
    "Enhanced styling system with improved utilities, better performance, and more features!"
  )
);

render(app, appRoot);
