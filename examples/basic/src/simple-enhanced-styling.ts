// Simplified enhanced styling system with Tailwind-like configuration
import type { StyleConfig } from './style-config';
import { mergeConfig, defaultConfig } from './style-config';

// Type definitions for the enhanced utility-first CSS framework
type BreakpointName = string;
type MediaQuery = string;

interface BreakpointConfig {
  [key: BreakpointName]: MediaQuery;
}

interface EnhancedStyleSetupConfig extends StyleConfig {
  size?: BreakpointConfig;
}

// Utility class type - simplified to accept any string
type UtilityClass = string;

// Responsive class type
type ResponsiveClasses<T extends BreakpointName> = {
  [K in T]?: UtilityClass[];
};

// Main cn function type
type CNFunction = {
  (classes: UtilityClass[] | string | ResponsiveClasses<BreakpointName>): (el: ExpandedElement, index: number) => void;
};

// Global style state management
const styleState = {
  initialized: false,
  sheet: new CSSStyleSheet(),
  classCache: new Set<string>(),
  config: defaultConfig,
};

// Initialize stylesheet if not already done
if (!styleState.initialized) {
  styleState.initialized = true;
  document.adoptedStyleSheets = [
    ...document.adoptedStyleSheets,
    styleState.sheet,
  ];
}

// Utility function to generate safe CSS class names
function generateClassName(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^a-zA-Z0-9]/g, '')}`;
}

// Function to add CSS rule if not already exists
function addCSSRule(className: string, cssRule: string): void {
  if (styleState.classCache.has(className)) return;
  
  styleState.classCache.add(className);
  styleState.sheet.insertRule(`
    .${className} {
      ${cssRule}
    }
  `);
}

// Enhanced styleSetup function with Tailwind-like configuration
export function enhancedStyleSetup(config: EnhancedStyleSetupConfig = {}): {
  cn: CNFunction;
  bg: (color: string) => (el: ExpandedElement, index: number) => void;
  text: (color: string) => (el: ExpandedElement, index: number) => void;
  m: (value: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  p: (value: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  w: (value: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  h: (value: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  flex: (direction?: string, justify?: string, align?: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  d: (value: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  textAlign: (value: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  fontWeight: (value: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  rounded: (value: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  gap: (value: string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  // Configuration access
  config: StyleConfig;
  theme: (path: string) => any;
} {
  // Merge user configuration with defaults
  const mergedConfig = mergeConfig(config);
  styleState.config = mergedConfig;
  
  const breakpoints = config.size || mergedConfig.theme?.screens || {};
  const colors = mergedConfig.theme?.colors || {};
  const spacing = mergedConfig.theme?.spacing || {};

  // Create responsive class name function
  function createResponsiveClassName(
    baseClass: string,
    breakpoint?: BreakpointName
  ): string {
    if (!breakpoint) return baseClass;
    return `${baseClass}-${breakpoint}`;
  }

  // Helper function to get color value from config
  function getColorValue(colorName: string): string {
    if (colorName.startsWith('#')) return colorName;
    
    // Handle nested color objects (e.g., gray.500)
    if (colorName.indexOf('.') !== -1) {
      const parts = colorName.split('.');
      const baseColor = parts[0];
      const shade = parts[1];
      const colorObj = colors[baseColor];
      if (typeof colorObj === 'object' && colorObj !== null) {
        return (colorObj as any)[shade] || colorName;
      }
    }
    
    // Handle direct color values
    const colorValue = colors[colorName];
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
      'secondary-500': '#6b7280',
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
    if (!isNaN(numericValue) && spacing[numericValue]) {
      return spacing[numericValue];
    }
    if (spacing[value]) {
      return spacing[value];
    }
    return value;
  }

  // Background color utilities
  function createBgColor(color: string) {
    const colorValue = getColorValue(color);
    const className = generateClassName('bg', color.replace('#', ''));
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `background-color: ${colorValue};`);
    };
  }

  // Text color utilities
  function createTextColor(color: string) {
    const colorValue = getColorValue(color);
    const className = generateClassName('text', color.replace('#', ''));
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `color: ${colorValue};`);
    };
  }

  // Spacing utilities (margin, padding)
  function createSpacing(
    property: 'm' | 'p',
    value: string,
    breakpoint?: BreakpointName
  ) {
    const spacingValue = getSpacingValue(value);
    const className = createResponsiveClassName(`${property}-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      const cssProperty = property === 'm' ? 'margin' : 'padding';
      addCSSRule(className, `${cssProperty}: ${spacingValue};`);
    };
  }

  // Width/Height utilities
  function createSize(
    property: 'w' | 'h',
    value: string,
    breakpoint?: BreakpointName
  ) {
    const sizeValue = getSpacingValue(value);
    const className = createResponsiveClassName(`${property}-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      const cssProperty = property === 'w' ? 'width' : 'height';
      addCSSRule(className, `${cssProperty}: ${sizeValue};`);
    };
  }

  // Flexbox utilities
  function createFlex(
    direction?: string,
    justify?: string,
    align?: string,
    breakpoint?: BreakpointName
  ) {
    const parts = ['flex'];
    if (direction) parts.push(direction);
    if (justify) parts.push(`justify-${justify}`);
    if (align) parts.push(`items-${align}`);
    
    const className = createResponsiveClassName(parts.join('-'), breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      
      let cssRules = 'display: flex;';
      if (direction) {
        const flexDirections: Record<string, string> = {
          row: 'row',
          'row-reverse': 'row-reverse',
          col: 'column',
          'col-reverse': 'column-reverse',
        };
        cssRules += ` flex-direction: ${flexDirections[direction] || direction};`;
      }
      if (justify) {
        const justifyContent: Record<string, string> = {
          start: 'flex-start',
          end: 'flex-end',
          center: 'center',
          between: 'space-between',
          around: 'space-around',
          evenly: 'space-evenly',
        };
        cssRules += ` justify-content: ${justifyContent[justify] || justify};`;
      }
      if (align) {
        const alignItems: Record<string, string> = {
          start: 'flex-start',
          end: 'flex-end',
          center: 'center',
          baseline: 'baseline',
          stretch: 'stretch',
        };
        cssRules += ` align-items: ${alignItems[align] || align};`;
      }
      
      addCSSRule(className, cssRules);
    };
  }

  // Display utilities
  function createDisplay(
    value: string,
    breakpoint?: BreakpointName
  ) {
    const className = createResponsiveClassName(`d-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      const displayValues: Record<string, string> = {
        block: 'block',
        inline: 'inline',
        'inline-block': 'inline-block',
        flex: 'flex',
        'inline-flex': 'inline-flex',
        grid: 'grid',
        hidden: 'none',
      };
      addCSSRule(className, `display: ${displayValues[value] || value};`);
    };
  }

  // Text utilities
  function createTextAlign(
    value: string,
    breakpoint?: BreakpointName
  ) {
    const className = createResponsiveClassName(`text-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `text-align: ${value};`);
    };
  }

  function createFontWeight(
    value: string,
    breakpoint?: BreakpointName
  ) {
    const className = createResponsiveClassName(`font-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      const fontWeight: Record<string, string> = {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      };
      addCSSRule(className, `font-weight: ${fontWeight[value] || value};`);
    };
  }

  // Border radius
  function createBorderRadius(
    value: string,
    breakpoint?: BreakpointName
  ) {
    const className = createResponsiveClassName(`rounded-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
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
      addCSSRule(className, `border-radius: ${borderRadius[value] || value};`);
    };
  }

  // Gap utility for flexbox and grid
  function createGap(
    value: string,
    breakpoint?: BreakpointName
  ) {
    const gapValue = getSpacingValue(value);
    const className = createResponsiveClassName(`gap-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `gap: ${gapValue};`);
    };
  }

  // Theme accessor function
  function theme(path: string): any {
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

  // Main cn function that handles responsive classes and generates CSS
  const cn: CNFunction = (
    classes: UtilityClass[] | string | ResponsiveClasses<BreakpointName>
  ): (el: ExpandedElement, index: number) => void => {
    return (el: ExpandedElement, index: number) => {
      if (typeof classes === 'string') {
        el.classList?.add(classes);
        generateCSSForClass(classes);
        return;
      }

      if (Array.isArray(classes)) {
        classes.forEach(cls => {
          el.classList?.add(cls);
          generateCSSForClass(cls);
        });
        return;
      }

      // Handle responsive classes
      Object.entries(classes).forEach(([breakpoint, classList]) => {
        if (breakpoint in breakpoints) {
          // Apply classes with breakpoint prefix and generate responsive CSS
          classList?.forEach(cls => {
            const responsiveClass = `${cls}-${breakpoint}`;
            el.classList?.add(responsiveClass);
            generateCSSForClass(cls, breakpoint);
          });
        } else {
          // Apply classes directly
          classList?.forEach(cls => {
            el.classList?.add(cls);
            generateCSSForClass(cls);
          });
        }
      });
    };
  }

  // Function to generate CSS for a class name
  function generateCSSForClass(className: string, breakpoint?: BreakpointName): void {
    if (styleState.classCache.has(className)) return;
    
    styleState.classCache.add(className);
    
    // Parse class name and generate appropriate CSS
    const cssRule = parseClassNameToCSS(className);
    if (cssRule) {
      if (breakpoint && breakpoints[breakpoint]) {
        // Generate responsive CSS
        const mediaQuery = `@media (${breakpoints[breakpoint]}) { .${className}-${breakpoint} { ${cssRule} } }`;
        styleState.sheet.insertRule(mediaQuery);
      } else {
        // Generate regular CSS
        styleState.sheet.insertRule(`.${className} { ${cssRule} }`);
      }
    }
  }

  // Parse class name to CSS rule using configuration
  function parseClassNameToCSS(className: string): string | null {
    // Background colors
    if (className.startsWith('bg-')) {
      const color = className.slice(3);
      const colorValue = getColorValue(color);
      return `background-color: ${colorValue};`;
    }

    // Text colors
    if (className.startsWith('text-')) {
      const color = className.slice(5);
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
    if (className.startsWith('w-')) {
      const value = className.slice(2);
      const widthValue = getSpacingValue(value);
      return `width: ${widthValue};`;
    }

    // Height
    if (className.startsWith('h-')) {
      const value = className.slice(2);
      const heightValue = getSpacingValue(value);
      return `height: ${heightValue};`;
    }

    // Padding
    if (className.startsWith('p-')) {
      const value = className.slice(2);
      const paddingValue = getSpacingValue(value);
      return `padding: ${paddingValue};`;
    }

    // Margin
    if (className.startsWith('m-')) {
      const value = className.slice(2);
      const marginValue = getSpacingValue(value);
      return `margin: ${marginValue};`;
    }

    // Gap
    if (className.startsWith('gap-')) {
      const value = className.slice(4);
      const gapValue = getSpacingValue(value);
      return `gap: ${gapValue};`;
    }

    // Text alignment
    if (className.startsWith('text-')) {
      if (className === 'text-left') return 'text-align: left;';
      if (className === 'text-center') return 'text-align: center;';
      if (className === 'text-right') return 'text-align: right;';
      if (className === 'text-justify') return 'text-align: justify;';
    }

    // Font weight
    if (className.startsWith('font-')) {
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
    if (className.startsWith('rounded-')) {
      const value = className.slice(8);
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

  // Return the utility functions and cn
  return {
    cn,
    // Color utilities
    bg: createBgColor,
    text: createTextColor,
    // Spacing utilities
    m: (value: string, breakpoint?: BreakpointName) => createSpacing('m', value, breakpoint),
    p: (value: string, breakpoint?: BreakpointName) => createSpacing('p', value, breakpoint),
    // Size utilities
    w: (value: string, breakpoint?: BreakpointName) => createSize('w', value, breakpoint),
    h: (value: string, breakpoint?: BreakpointName) => createSize('h', value, breakpoint),
    // Flexbox utilities
    flex: createFlex,
    // Display utilities
    d: createDisplay,
    // Text utilities
    textAlign: createTextAlign,
    fontWeight: createFontWeight,
    // Border utilities
    rounded: createBorderRadius,
    // Gap utility
    gap: (value: string, breakpoint?: BreakpointName) => createGap(value, breakpoint),
    // Configuration access
    config: mergedConfig,
    theme,
  } as const;
}
