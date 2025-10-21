// Enhanced styling system with Tailwind-like configuration
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

// Strong types for all utility classes
type ColorName = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'indigo' | 'gray' | 'black' | 'white' | 'transparent' | 'gray-900' | 'gray-600' | 'primary-500' | 'secondary-500' | 'success' | 'danger' | 'warning' | 'info';
type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
type SizeValue = SpacingValue | 'auto' | 'full' | 'screen' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4';
type FlexDirection = 'row' | 'row-reverse' | 'col' | 'col-reverse';
type JustifyContent = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
type AlignItems = 'start' | 'end' | 'center' | 'baseline' | 'stretch';
type DisplayValue = 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'hidden';
type TextAlign = 'left' | 'center' | 'right' | 'justify';
type FontWeight = 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
type BorderRadius = 'none' | 'sm' | 'default' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

// Utility class types
type BackgroundColor = `bg-${ColorName}` | `bg-#${string}`;
type TextColor = `text-${ColorName}` | `text-#${string}`;
type Width = `w-${SizeValue}` | `w-${string}`;
type Height = `h-${SizeValue}` | `h-${string}`;
type Padding = `p-${SpacingValue}` | `p-${string}`;
type PaddingTop = `pt-${SpacingValue}` | `pt-${string}`;
type PaddingRight = `pr-${SpacingValue}` | `pr-${string}`;
type PaddingBottom = `pb-${SpacingValue}` | `pb-${string}`;
type PaddingLeft = `pl-${SpacingValue}` | `pl-${string}`;
type PaddingX = `px-${SpacingValue}` | `px-${string}`;
type PaddingY = `py-${SpacingValue}` | `py-${string}`;
type Margin = `m-${SpacingValue}` | `m-${string}`;
type MarginTop = `mt-${SpacingValue}` | `mt-${string}`;
type MarginRight = `mr-${SpacingValue}` | `mr-${string}`;
type MarginBottom = `mb-${SpacingValue}` | `mb-${string}`;
type MarginLeft = `ml-${SpacingValue}` | `ml-${string}`;
type MarginX = `mx-${SpacingValue}` | `mx-${string}`;
type MarginY = `my-${SpacingValue}` | `my-${string}`;
type Gap = `gap-${SpacingValue}` | `gap-${string}`;
type TextAlignClass = `text-${TextAlign}`;
type FontWeightClass = `font-${FontWeight}`;
type BorderRadiusClass = `rounded-${BorderRadius}`;

// Flexbox classes
type FlexDirectionClass = `flex-${FlexDirection}`;
type JustifyContentClass = `justify-${JustifyContent}`;
type AlignItemsClass = `items-${AlignItems}`;

// Display classes
type DisplayClass = DisplayValue;

// Combined utility class type - made more flexible to accept any string
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
  bg: (color: ColorName | string) => (el: ExpandedElement, index: number) => void;
  text: (color: ColorName | string) => (el: ExpandedElement, index: number) => void;
  m: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  mt: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  mr: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  mb: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  ml: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  mx: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  my: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  p: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  pt: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  pr: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  pb: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  pl: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  px: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  py: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  w: (value: SizeValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  h: (value: SizeValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  flex: (direction?: FlexDirection, justify?: JustifyContent, align?: AlignItems, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  d: (value: DisplayValue, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  textAlign: (value: TextAlign, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  fontWeight: (value: FontWeight, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  rounded: (value: BorderRadius, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
  gap: (value: SpacingValue | string, breakpoint?: BreakpointName) => (el: ExpandedElement, index: number) => void;
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
  const fontSize = mergedConfig.theme?.fontSize || {};
  const fontFamily = mergedConfig.theme?.fontFamily || {};
  const fontWeight = mergedConfig.theme?.fontWeight || {};
  const lineHeight = mergedConfig.theme?.lineHeight || {};
  const letterSpacing = mergedConfig.theme?.letterSpacing || {};
  const borderRadius = mergedConfig.theme?.borderRadius || {};
  const boxShadow = mergedConfig.theme?.boxShadow || {};

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
    if (colorName.includes('.')) {
      const [baseColor, shade] = colorName.split('.');
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
    const defaultColors = {
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
    };
    
    return defaultColors[colorName as keyof typeof defaultColors] || colorName;
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
  function createBgColor(color: ColorName | string) {
    const colorValue = getColorValue(typeof color === 'string' ? color : color);
    const className = generateClassName('bg', color.toString().replace('#', ''));
    
    return (el: ExpandedElement, index: number) => {
      el.classList?.add(className);
      addCSSRule(className, `background-color: ${colorValue};`);
    };
  }

  // Text color utilities
  function createTextColor(color: ColorName | string) {
    const colorValue = getColorValue(typeof color === 'string' ? color : color);
    const className = generateClassName('text', color.toString().replace('#', ''));
    
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
    const spacingValue = getSpacingValue(typeof value === 'string' ? value : value.toString());
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
      
      addCSSRule(className, cssProperty + ': ' + spacingValue + ';');
    };
  }

  // Width/Height utilities
  function createSize(
    property: 'w' | 'h',
    value: SizeValue | string,
    breakpoint?: BreakpointName
  ) {
    const sizeValue = getSpacingValue(typeof value === 'string' ? value : value.toString());
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
    const gapValue = getSpacingValue(typeof value === 'string' ? value : value.toString());
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
    // Configuration access
    config: mergedConfig,
    theme,
  } as const;
}

// Flexbox direction mapping
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
