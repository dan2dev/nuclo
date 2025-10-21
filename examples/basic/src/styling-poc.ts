// Type definitions for the utility-first CSS framework
type BreakpointName = string;
type MediaQuery = string;

interface BreakpointConfig {
  [key: BreakpointName]: MediaQuery;
}

interface StyleSetupConfig {
  size?: BreakpointConfig;
}

// Global style state management
const styleState = {
  initialized: false,
  sheet: new CSSStyleSheet(),
  classCache: new Set<string>(),
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

// Color utilities
const colors = {
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
} as const;

type ColorName = keyof typeof colors;

// Spacing scale (similar to Tailwind)
const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
} as const;

type SpacingValue = keyof typeof spacing;

// Width/Height utilities
const sizeValues = {
  ...spacing,
  auto: 'auto',
  full: '100%',
  screen: '100vh',
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '3/4': '75%',
} as const;

type SizeValue = keyof typeof sizeValues;

// Flexbox utilities
const flexDirections = {
  row: 'row',
  'row-reverse': 'row-reverse',
  col: 'column',
  'col-reverse': 'column-reverse',
} as const;

const justifyContent = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
} as const;

const alignItems = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  baseline: 'baseline',
  stretch: 'stretch',
} as const;

// Display utilities
const displayValues = {
  block: 'block',
  inline: 'inline',
  'inline-block': 'inline-block',
  flex: 'flex',
  'inline-flex': 'inline-flex',
  grid: 'grid',
  hidden: 'none',
} as const;

// Position utilities
const positionValues = {
  static: 'static',
  relative: 'relative',
  absolute: 'absolute',
  fixed: 'fixed',
  sticky: 'sticky',
} as const;

// Text utilities
const textAlign = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
} as const;

const fontWeight = {
  thin: '100',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// Border radius
const borderRadius = {
  none: '0',
  sm: '0.125rem',
  default: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// Main styleSetup function
export function styleSetup(config: StyleSetupConfig = {}) {
  const breakpoints = config.size || {};

  // Create responsive class name function
  function createResponsiveClassName(
    baseClass: string,
    breakpoint?: BreakpointName
  ): string {
    if (!breakpoint) return baseClass;
    return `${baseClass}-${breakpoint}`;
  }

  // Background color utilities
  function createBgColor(color: ColorName | string) {
    const colorValue = typeof color === 'string' ? color : colors[color];
    const className = generateClassName('bg', color.replace('#', ''));
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `background-color: ${colorValue};`);
    };
  }

  // Text color utilities
  function createTextColor(color: ColorName | string) {
    const colorValue = typeof color === 'string' ? color : colors[color];
    const className = generateClassName('text', color.replace('#', ''));
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `color: ${colorValue};`);
    };
  }

  // Spacing utilities (margin, padding)
  function createSpacing(
    property: 'm' | 'mt' | 'mr' | 'mb' | 'ml' | 'mx' | 'my' | 'p' | 'pt' | 'pr' | 'pb' | 'pl' | 'px' | 'py',
    value: SpacingValue | string,
    breakpoint?: BreakpointName
  ) {
    const spacingValue = typeof value === 'string' ? value : spacing[value];
    const className = createResponsiveClassName(`${property}-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      
      let cssProperty = '';
      switch (property) {
        case 'm': cssProperty = 'margin'; break;
        case 'mt': cssProperty = 'margin-top'; break;
        case 'mr': cssProperty = 'margin-right'; break;
        case 'mb': cssProperty = 'margin-bottom'; break;
        case 'ml': cssProperty = 'margin-left'; break;
        case 'mx': cssProperty = 'margin-left: margin-right'; break;
        case 'my': cssProperty = 'margin-top: margin-bottom'; break;
        case 'p': cssProperty = 'padding'; break;
        case 'pt': cssProperty = 'padding-top'; break;
        case 'pr': cssProperty = 'padding-right'; break;
        case 'pb': cssProperty = 'padding-bottom'; break;
        case 'pl': cssProperty = 'padding-left'; break;
        case 'px': cssProperty = 'padding-left: padding-right'; break;
        case 'py': cssProperty = 'padding-top: padding-bottom'; break;
      }
      
      const mediaQuery = breakpoint && breakpoints[breakpoint] 
        ? `@media (${breakpoints[breakpoint]}) { .${className} { ${cssProperty}: ${spacingValue}; } }`
        : `.${className} { ${cssProperty}: ${spacingValue}; }`;
      
      addCSSRule(className, cssProperty + ': ' + spacingValue + ';');
    };
  }

  // Width/Height utilities
  function createSize(
    property: 'w' | 'h',
    value: SizeValue | string,
    breakpoint?: BreakpointName
  ) {
    const sizeValue = typeof value === 'string' ? value : sizeValues[value];
    const className = createResponsiveClassName(`${property}-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      const cssProperty = property === 'w' ? 'width' : 'height';
      addCSSRule(className, `${cssProperty}: ${sizeValue};`);
    };
  }

  // Flexbox utilities
  function createFlex(
    direction?: keyof typeof flexDirections,
    justify?: keyof typeof justifyContent,
    align?: keyof typeof alignItems,
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
      if (direction) cssRules += ` flex-direction: ${flexDirections[direction]};`;
      if (justify) cssRules += ` justify-content: ${justifyContent[justify]};`;
      if (align) cssRules += ` align-items: ${alignItems[align]};`;
      
      addCSSRule(className, cssRules);
    };
  }

  // Display utilities
  function createDisplay(
    value: keyof typeof displayValues,
    breakpoint?: BreakpointName
  ) {
    const className = createResponsiveClassName(`d-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `display: ${displayValues[value]};`);
    };
  }

  // Text utilities
  function createTextAlign(
    value: keyof typeof textAlign,
    breakpoint?: BreakpointName
  ) {
    const className = createResponsiveClassName(`text-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `text-align: ${textAlign[value]};`);
    };
  }

  function createFontWeight(
    value: keyof typeof fontWeight,
    breakpoint?: BreakpointName
  ) {
    const className = createResponsiveClassName(`font-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `font-weight: ${fontWeight[value]};`);
    };
  }

  // Border radius
  function createBorderRadius(
    value: keyof typeof borderRadius,
    breakpoint?: BreakpointName
  ) {
    const className = createResponsiveClassName(`rounded-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `border-radius: ${borderRadius[value]};`);
    };
  }

  // Gap utility for flexbox and grid
  function createGap(
    value: SpacingValue | string,
    breakpoint?: BreakpointName
  ) {
    const gapValue = typeof value === 'string' ? value : spacing[value];
    const className = createResponsiveClassName(`gap-${value}`, breakpoint);
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `gap: ${gapValue};`);
    };
  }

  // Main cn function that handles responsive classes and generates CSS
  function cn(
    classes: string | Record<BreakpointName, string[]> | string[]
  ): (el: ExpandedElement, index: number) => void {
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
          classList.forEach(cls => {
            const responsiveClass = `${cls}-${breakpoint}`;
            el.classList?.add(responsiveClass);
            generateCSSForClass(cls, breakpoint);
          });
        } else {
          // Apply classes directly
          classList.forEach(cls => {
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

  // Parse class name to CSS rule
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
      const widthValue = getSizeValue(value);
      return `width: ${widthValue};`;
    }

    // Height
    if (className.startsWith('h-')) {
      const value = className.slice(2);
      const heightValue = getSizeValue(value);
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

    // Padding top
    if (className.startsWith('pt-')) {
      const value = className.slice(3);
      const paddingValue = getSpacingValue(value);
      return `padding-top: ${paddingValue};`;
    }

    // Padding right
    if (className.startsWith('pr-')) {
      const value = className.slice(3);
      const paddingValue = getSpacingValue(value);
      return `padding-right: ${paddingValue};`;
    }

    // Padding bottom
    if (className.startsWith('pb-')) {
      const value = className.slice(3);
      const paddingValue = getSpacingValue(value);
      return `padding-bottom: ${paddingValue};`;
    }

    // Padding left
    if (className.startsWith('pl-')) {
      const value = className.slice(3);
      const paddingValue = getSpacingValue(value);
      return `padding-left: ${paddingValue};`;
    }

    // Padding horizontal
    if (className.startsWith('px-')) {
      const value = className.slice(3);
      const paddingValue = getSpacingValue(value);
      return `padding-left: ${paddingValue}; padding-right: ${paddingValue};`;
    }

    // Padding vertical
    if (className.startsWith('py-')) {
      const value = className.slice(3);
      const paddingValue = getSpacingValue(value);
      return `padding-top: ${paddingValue}; padding-bottom: ${paddingValue};`;
    }

    // Margin top
    if (className.startsWith('mt-')) {
      const value = className.slice(3);
      const marginValue = getSpacingValue(value);
      return `margin-top: ${marginValue};`;
    }

    // Margin right
    if (className.startsWith('mr-')) {
      const value = className.slice(3);
      const marginValue = getSpacingValue(value);
      return `margin-right: ${marginValue};`;
    }

    // Margin bottom
    if (className.startsWith('mb-')) {
      const value = className.slice(3);
      const marginValue = getSpacingValue(value);
      return `margin-bottom: ${marginValue};`;
    }

    // Margin left
    if (className.startsWith('ml-')) {
      const value = className.slice(3);
      const marginValue = getSpacingValue(value);
      return `margin-left: ${marginValue};`;
    }

    // Margin horizontal
    if (className.startsWith('mx-')) {
      const value = className.slice(3);
      const marginValue = getSpacingValue(value);
      return `margin-left: ${marginValue}; margin-right: ${marginValue};`;
    }

    // Margin vertical
    if (className.startsWith('my-')) {
      const value = className.slice(3);
      const marginValue = getSpacingValue(value);
      return `margin-top: ${marginValue}; margin-bottom: ${marginValue};`;
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
      const radiusValue = getBorderRadiusValue(value);
      return `border-radius: ${radiusValue};`;
    }

    return null;
  }

  // Helper functions to get values
  function getColorValue(color: string): string {
    if (color in colors) {
      return colors[color as ColorName];
    }
    // Handle hex colors
    if (color.startsWith('#')) {
      return color;
    }
    // Handle custom colors
    return color;
  }

  function getSpacingValue(value: string): string {
    const numericValue = parseInt(value);
    if (!isNaN(numericValue) && numericValue in spacing) {
      return spacing[numericValue as keyof typeof spacing];
    }
    // Handle custom values like "500px"
    return value;
  }

  function getSizeValue(value: string): string {
    // Check if it's a numeric key first
    const numericValue = parseInt(value);
    if (!isNaN(numericValue) && numericValue in sizeValues) {
      return sizeValues[numericValue as keyof typeof sizeValues];
    }
    // Check if it's a string key
    if (value in sizeValues) {
      return sizeValues[value as keyof typeof sizeValues];
    }
    // Handle custom values like "500px"
    return value;
  }

  function getBorderRadiusValue(value: string): string {
    if (value in borderRadius) {
      return borderRadius[value as keyof typeof borderRadius];
    }
    return value;
  }

  // Return the utility functions and cn
  return {
    cn,
    // Color utilities
    bg: createBgColor,
    text: createTextColor,
    // Spacing utilities
    m: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('m', value, breakpoint),
    mt: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('mt', value, breakpoint),
    mr: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('mr', value, breakpoint),
    mb: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('mb', value, breakpoint),
    ml: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('ml', value, breakpoint),
    mx: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('mx', value, breakpoint),
    my: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('my', value, breakpoint),
    p: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('p', value, breakpoint),
    pt: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('pt', value, breakpoint),
    pr: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('pr', value, breakpoint),
    pb: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('pb', value, breakpoint),
    pl: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('pl', value, breakpoint),
    px: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('px', value, breakpoint),
    py: (value: SpacingValue | string, breakpoint?: BreakpointName) => createSpacing('py', value, breakpoint),
    // Size utilities
    w: (value: SizeValue | string, breakpoint?: BreakpointName) => createSize('w', value, breakpoint),
    h: (value: SizeValue | string, breakpoint?: BreakpointName) => createSize('h', value, breakpoint),
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
    gap: (value: SpacingValue | string, breakpoint?: BreakpointName) => createGap(value, breakpoint),
  };
}

// Export individual utilities for backward compatibility
export const bg = (colorValue: string) => (el: ExpandedElement, index: number) => {
  const className = `bg-${colorValue.replace("#", "")}`;
  el.classList?.add(className);
  addCSSRule(className, `background-color: ${colorValue};`);
  };

export const bgRed = (el: ExpandedElement, index: number) => {
  el.classList?.add("bg-red");
  addCSSRule("bg-red", "background-color: red;");
};

