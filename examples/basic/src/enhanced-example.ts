// Comprehensive example demonstrating enhanced styling system features
import "nuclo";
import { store } from "./store";
import { utils } from "./styling-utilities";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

// Enhanced configuration with all features
const enhancedConfig = {
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
  darkMode: 'class',
  important: false,
  prefix: '',
  separator: ':',
};

// Enhanced styleSetup function
function createEnhancedStyleSetup(userConfig: any = {}) {
  const mergedConfig = { ...enhancedConfig, ...userConfig };
  
  const styleState = {
    initialized: false,
    sheet: null as CSSStyleSheet | null,
    classCache: [] as string[],
    ruleCache: {} as Record<string, string>,
    darkMode: false,
  };

  if (!styleState.initialized) {
    styleState.initialized = true;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'nuclo-enhanced-styles';
    styleElement.setAttribute('data-nuclo', 'enhanced');
    document.head.appendChild(styleElement);
    styleState.sheet = styleElement.sheet;

    styleState.darkMode = document.documentElement.classList.contains('dark');
  }

  function addCSSRule(className: string, cssRule: string, mediaQuery?: string, darkMode = false): void {
    const cacheKey = `${className}-${mediaQuery || 'base'}-${darkMode ? 'dark' : 'light'}`;
    
    if (styleState.ruleCache[cacheKey]) return;
    
    styleState.ruleCache[cacheKey] = cssRule;
    
    if (!styleState.sheet) return;

    try {
      let finalRule = cssRule;
      
      if (darkMode && mergedConfig.darkMode === 'class') {
        finalRule = `.dark ${cssRule}`;
      }
      
      if (mediaQuery) {
        const mediaRule = `@media (${mediaQuery}) { .${className} { ${finalRule} } }`;
        styleState.sheet.insertRule(mediaRule, styleState.sheet.cssRules.length);
      } else {
        const regularRule = `.${className} { ${finalRule} }`;
        styleState.sheet.insertRule(regularRule, styleState.sheet.cssRules.length);
      }
    } catch (e) {
      console.warn('Failed to insert CSS rule:', className, e);
    }
  }

  function generateCSSForClass(className: string, breakpoint?: string, darkMode = false): void {
    const cacheKey = `${className}-${breakpoint || 'base'}-${darkMode ? 'dark' : 'light'}`;
    
    if (styleState.ruleCache[cacheKey]) return;
    
    const cssRule = parseClassNameToCSS(className, darkMode);
    if (cssRule) {
      if (breakpoint && mergedConfig.theme.screens[breakpoint]) {
        addCSSRule(className, cssRule, mergedConfig.theme.screens[breakpoint], darkMode);
      } else {
        addCSSRule(className, cssRule, undefined, darkMode);
      }
    }
  }

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

    return null;
  }

  function getColorValue(colorName: string, darkMode = false): string {
    if (colorName.indexOf('#') === 0) return colorName;
    
    if (colorName.indexOf('.') !== -1) {
      const parts = colorName.split('.');
      const baseColor = parts[0];
      const shade = parts[1];
      const colorObj = mergedConfig.theme.colors[baseColor];
      if (typeof colorObj === 'object' && colorObj !== null) {
        return (colorObj as any)[shade] || colorName;
      }
    }
    
    const colorValue = mergedConfig.theme.colors[colorName];
    if (typeof colorValue === 'string') {
      return colorValue;
    }
    
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

      for (const breakpoint in classes) {
        const classList = classes[breakpoint];
        if (breakpoint in mergedConfig.theme.screens) {
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

  function toggleDarkMode() {
    if (mergedConfig.darkMode === 'class') {
      document.documentElement.classList.toggle('dark');
      styleState.darkMode = document.documentElement.classList.contains('dark');
    }
  }

  return {
    cn,
    theme,
    config: mergedConfig,
    toggleDarkMode,
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
  };
}

// Initialize the enhanced style system
const style = createEnhancedStyleSetup();

// Demonstrate enhanced features
console.log('Enhanced styling system with utilities initialized!');
console.log('Primary color:', style.theme('colors.primary.500'));
console.log('Available spacing:', Object.keys(style.theme('spacing')).length, 'values');
console.log('Available colors:', Object.keys(style.theme('colors')).length, 'colors');

// Debug: Log generated CSS
setTimeout(() => {
  console.log('Generated CSS rules:', style.getGeneratedCSS().length);
  console.log('Cached classes:', style.getClassCache().length);
}, 1000);

// Enhanced responsive classes with utility functions
const enhancedStyle = style.cn({
  "sm": [
    ...utils.layout.stack(),
    ...utils.colors.primary('500'),
    ...utils.sizes.full(),
    ...utils.spacing.padding('4'),
    ...utils.borders.rounded('lg'),
    ...utils.shadows.md(),
  ],
  "lg": [
    ...utils.layout.row(),
    ...utils.colors.secondary('500'),
    ...utils.sizes.square('500px'),
    ...utils.spacing.padding('6'),
    ...utils.borders.rounded('xl'),
    ...utils.shadows.lg(),
  ],
});

// Add custom CSS for the enhanced design
const styleEl = document.createElement('style');
styleEl.textContent = `
  body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    margin: 0;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
    transition: background 0.3s ease;
  }

  #app {
    max-width: 600px;
    margin: 0 auto;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 2.5rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
  }

  .header-title {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    margin: 0 0 1rem 0;
    line-height: 1.2;
  }

  .subtitle {
    font-size: 1rem;
    color: #64748b;
    text-align: center;
    margin: 0 0 1.5rem 0;
    line-height: 1.6;
    transition: color 0.3s ease;
  }

  .counter-display {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 3rem 2rem;
    text-align: center;
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
  }

  .counter-label {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    letter-spacing: 0.5px;
  }

  .counter-value {
    font-size: 5rem;
    font-weight: 900;
    color: white;
    margin: 0;
    line-height: 1;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease;
  }

  .counter-value:hover {
    transform: scale(1.05);
  }

  .button-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .btn {
    padding: 1rem 2rem;
    font-size: 1.5rem;
    font-weight: 700;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    min-width: 80px;
  }

  .btn-primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }

  .btn-danger:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }

  .btn-danger:active {
    transform: translateY(0);
  }

  .btn-secondary {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  .btn-secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
  }

  .btn-secondary:active {
    transform: translateY(0);
  }

  .dark-mode-toggle {
    display: flex;
    justify-content: center;
  }

  .btn-outline {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  .btn-outline:hover {
    background: #667eea;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  }

  .footer-text {
    text-align: center;
    color: white;
    font-size: 0.875rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    line-height: 1.6;
    transition: all 0.3s ease;
  }

  /* Dark mode styles */
  html.dark body {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  }

  html.dark .glass-card {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  html.dark .header-title {
    background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  html.dark .subtitle {
    color: #cbd5e1;
  }

  html.dark .counter-display {
    background: linear-gradient(135deg, #4338ca 0%, #7c3aed 100%);
    box-shadow: 0 10px 40px rgba(67, 56, 202, 0.5);
  }

  html.dark .btn-outline {
    background: rgba(30, 41, 59, 0.8);
    color: #818cf8;
    border-color: #818cf8;
  }

  html.dark .btn-outline:hover {
    background: #818cf8;
    color: white;
  }

  html.dark .footer-text {
    background: rgba(30, 41, 59, 0.5);
    color: #e2e8f0;
  }
`;
document.head.appendChild(styleEl);

// Dark mode state management with localStorage persistence
const DARK_MODE_KEY = 'nuclo-dark-mode';

// Initialize dark mode from localStorage or default to false
let isDarkMode = localStorage.getItem(DARK_MODE_KEY) === 'true';

// Apply initial state
if (isDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

function toggleDark() {
  isDarkMode = !isDarkMode;

  // Update DOM
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Persist to localStorage
  localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));

  // Update UI
  update();
}

const app = div(
  // Header section
  div(
    { className: 'glass-card' },
    h1(
      { className: 'header-title' },
      "Nuclo Counter"
    ),
    p(
      { className: 'subtitle' },
      "A beautiful, reactive counter built with Nuclo's powerful utility system"
    ),
    div(
      { className: 'dark-mode-toggle' },
      button(
        { className: 'btn btn-outline' },
        () => isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode",
        on("click", toggleDark)
      )
    )
  ),

  // Counter display
  div(
    { className: 'counter-display' },
    p(
      { className: 'counter-label' },
      "CURRENT COUNT"
    ),
    h2(
      { className: 'counter-value' },
      () => store.counter
    )
  ),

  // Button controls
  div(
    { className: 'button-group' },
    button(
      { className: 'btn btn-primary' },
      "+",
      on("click", store.increment)
    ),
    button(
      { className: 'btn btn-secondary' },
      "Reset",
      on("click", store.reset)
    ),
    button(
      { className: 'btn btn-danger' },
      "−",
      on("click", store.decrement)
    )
  ),

  // Footer
  div(
    { className: 'footer-text' },
    "Powered by Nuclo - Simple, explicit, and reactive"
  )
);

render(app, appRoot);
