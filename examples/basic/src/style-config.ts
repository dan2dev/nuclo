// Tailwind-like configuration system for nuclo styleSetup
// Based on https://v2.tailwindcss.com/docs/configuration

// Core configuration types
export interface StyleConfig {
  theme?: ThemeConfig;
  variants?: VariantsConfig;
  plugins?: Plugin[];
  presets?: Preset[];
  prefix?: string;
  important?: boolean | string;
  separator?: string;
  corePlugins?: CorePluginsConfig;
}

// Theme configuration (similar to Tailwind's theme)
export interface ThemeConfig {
  colors?: ColorsConfig;
  spacing?: SpacingConfig;
  fontSize?: FontSizeConfig;
  fontFamily?: FontFamilyConfig;
  fontWeight?: FontWeightConfig;
  lineHeight?: LineHeightConfig;
  letterSpacing?: LetterSpacingConfig;
  borderRadius?: BorderRadiusConfig;
  boxShadow?: BoxShadowConfig;
  screens?: ScreensConfig;
  extend?: Partial<ThemeConfig>;
}

// Color configuration
export interface ColorsConfig {
  [key: string]: string | ColorShades | ColorsConfig;
}

export interface ColorShades {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
}

// Spacing configuration
export interface SpacingConfig {
  [key: string]: string;
}

// Font size configuration
export interface FontSizeConfig {
  [key: string]: string | [string, { lineHeight?: string; letterSpacing?: string }];
}

// Font family configuration
export interface FontFamilyConfig {
  [key: string]: string[];
}

// Font weight configuration
export interface FontWeightConfig {
  [key: string]: string | number;
}

// Line height configuration
export interface LineHeightConfig {
  [key: string]: string;
}

// Letter spacing configuration
export interface LetterSpacingConfig {
  [key: string]: string;
}

// Border radius configuration
export interface BorderRadiusConfig {
  [key: string]: string;
}

// Box shadow configuration
export interface BoxShadowConfig {
  [key: string]: string;
}

// Screen/breakpoint configuration
export interface ScreensConfig {
  [key: string]: string;
}

// Variants configuration
export interface VariantsConfig {
  [key: string]: string[] | { extend?: { [key: string]: string[] } };
}

// Plugin system
export interface Plugin {
  (api: PluginAPI): void;
}

export interface PluginAPI {
  addUtilities: (utilities: Record<string, Record<string, string>>, options?: PluginOptions) => void;
  addComponents: (components: Record<string, Record<string, string>>, options?: PluginOptions) => void;
  addBase: (base: Record<string, Record<string, string>>) => void;
  addVariant: (name: string, variant: string | ((selector: string) => string)) => void;
  matchUtilities: (utilities: Record<string, (value: string) => Record<string, string>>, options?: PluginOptions) => void;
  theme: (path: string, defaultValue?: any) => any;
  config: (path: string, defaultValue?: any) => any;
}

export interface PluginOptions {
  respectPrefix?: boolean;
  respectImportant?: boolean;
  variants?: string[];
}

// Preset system
export interface Preset {
  theme?: ThemeConfig;
  variants?: VariantsConfig;
  plugins?: Plugin[];
}

// Core plugins configuration
export interface CorePluginsConfig {
  [key: string]: boolean;
}

// Default configuration values (similar to Tailwind's defaults)
export const defaultConfig: StyleConfig = {
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#ffffff',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      blue: {
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
      green: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
    },
    spacing: {
      px: '1px',
      0: '0',
      0.5: '0.125rem',
      1: '0.25rem',
      1.5: '0.375rem',
      2: '0.5rem',
      2.5: '0.625rem',
      3: '0.75rem',
      3.5: '0.875rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      11: '2.75rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    fontFamily: {
      sans: [
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
      serif: [
        'ui-serif',
        'Georgia',
        'Cambria',
        '"Times New Roman"',
        'Times',
        'serif',
      ],
      mono: [
        'ui-monospace',
        'SFMono-Regular',
        '"SF Mono"',
        'Consolas',
        '"Liberation Mono"',
        'Menlo',
        'Monaco',
        'Courier New',
        'monospace',
      ],
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
    borderRadius: {
      none: '0px',
      sm: '0.125rem',
      DEFAULT: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      none: 'none',
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  variants: {
    accessibility: ['responsive', 'focus'],
    alignContent: ['responsive'],
    alignItems: ['responsive'],
    alignSelf: ['responsive'],
    appearance: ['responsive'],
    backgroundAttachment: ['responsive'],
    backgroundClip: ['responsive'],
    backgroundColor: ['responsive', 'hover', 'focus'],
    backgroundImage: ['responsive'],
    backgroundOpacity: ['responsive', 'hover', 'focus'],
    backgroundPosition: ['responsive'],
    backgroundRepeat: ['responsive'],
    backgroundSize: ['responsive'],
    borderCollapse: ['responsive'],
    borderColor: ['responsive', 'hover', 'focus'],
    borderOpacity: ['responsive', 'hover', 'focus'],
    borderRadius: ['responsive'],
    borderStyle: ['responsive'],
    borderWidth: ['responsive'],
    boxShadow: ['responsive', 'hover', 'focus'],
    boxSizing: ['responsive'],
    cursor: ['responsive'],
    display: ['responsive'],
    divideColor: ['responsive'],
    divideOpacity: ['responsive'],
    divideStyle: ['responsive'],
    divideWidth: ['responsive'],
    fill: ['responsive'],
    flex: ['responsive'],
    flexDirection: ['responsive'],
    flexGrow: ['responsive'],
    flexShrink: ['responsive'],
    flexWrap: ['responsive'],
    float: ['responsive'],
    clear: ['responsive'],
    fontFamily: ['responsive'],
    fontSize: ['responsive'],
    fontSmoothing: ['responsive'],
    fontStyle: ['responsive'],
    fontVariantNumeric: ['responsive'],
    fontWeight: ['responsive'],
    gap: ['responsive'],
    gradientColorStops: ['responsive'],
    grayscale: ['responsive'],
    gridAutoColumns: ['responsive'],
    gridAutoFlow: ['responsive'],
    gridAutoRows: ['responsive'],
    gridColumn: ['responsive'],
    gridColumnEnd: ['responsive'],
    gridColumnStart: ['responsive'],
    gridRow: ['responsive'],
    gridRowEnd: ['responsive'],
    gridRowStart: ['responsive'],
    gridTemplateColumns: ['responsive'],
    gridTemplateRows: ['responsive'],
    height: ['responsive'],
    hueRotate: ['responsive'],
    inset: ['responsive'],
    invert: ['responsive'],
    isolation: ['responsive'],
    justifyContent: ['responsive'],
    justifyItems: ['responsive'],
    justifySelf: ['responsive'],
    letterSpacing: ['responsive'],
    lineHeight: ['responsive'],
    listStylePosition: ['responsive'],
    listStyleType: ['responsive'],
    margin: ['responsive'],
    maxHeight: ['responsive'],
    maxWidth: ['responsive'],
    minHeight: ['responsive'],
    minWidth: ['responsive'],
    mixBlendMode: ['responsive'],
    objectFit: ['responsive'],
    objectPosition: ['responsive'],
    opacity: ['responsive', 'hover', 'focus'],
    order: ['responsive'],
    outline: ['responsive', 'focus'],
    overflow: ['responsive'],
    overscrollBehavior: ['responsive'],
    padding: ['responsive'],
    placeContent: ['responsive'],
    placeItems: ['responsive'],
    placeSelf: ['responsive'],
    placeholderColor: ['responsive', 'focus'],
    placeholderOpacity: ['responsive', 'focus'],
    pointerEvents: ['responsive'],
    position: ['responsive'],
    resize: ['responsive'],
    ringColor: ['responsive', 'focus'],
    ringOffsetColor: ['responsive', 'focus'],
    ringOffsetWidth: ['responsive', 'focus'],
    ringOpacity: ['responsive', 'focus'],
    ringWidth: ['responsive', 'focus'],
    rotate: ['responsive', 'hover', 'focus'],
    saturate: ['responsive'],
    scale: ['responsive', 'hover', 'focus'],
    sepia: ['responsive'],
    skew: ['responsive', 'hover', 'focus'],
    space: ['responsive'],
    stroke: ['responsive'],
    strokeWidth: ['responsive'],
    tableLayout: ['responsive'],
    textAlign: ['responsive'],
    textColor: ['responsive', 'hover', 'focus'],
    textDecoration: ['responsive', 'hover', 'focus'],
    textOpacity: ['responsive', 'hover', 'focus'],
    textOverflow: ['responsive'],
    textTransform: ['responsive'],
    transform: ['responsive'],
    transformOrigin: ['responsive'],
    transitionDelay: ['responsive'],
    transitionDuration: ['responsive'],
    transitionProperty: ['responsive'],
    transitionTimingFunction: ['responsive'],
    translate: ['responsive', 'hover', 'focus'],
    userSelect: ['responsive'],
    verticalAlign: ['responsive'],
    visibility: ['responsive'],
    whitespace: ['responsive'],
    width: ['responsive'],
    wordBreak: ['responsive'],
    zIndex: ['responsive'],
  },
  plugins: [],
  prefix: '',
  important: false,
  separator: ':',
  corePlugins: {
    preflight: true,
    container: true,
    accessibility: true,
    pointerEvents: true,
    visibility: true,
    position: true,
    inset: true,
    isolation: true,
    zIndex: true,
    order: true,
    gridColumn: true,
    gridColumnStart: true,
    gridColumnEnd: true,
    gridRow: true,
    gridRowStart: true,
    gridRowEnd: true,
    float: true,
    clear: true,
    transform: true,
    transformOrigin: true,
    translate: true,
    rotate: true,
    scale: true,
    skew: true,
    appearance: true,
    cursor: true,
    outline: true,
    resize: true,
    userSelect: true,
    fill: true,
    stroke: true,
    strokeWidth: true,
    objectFit: true,
    objectPosition: true,
    overflow: true,
    overscrollBehavior: true,
    scrollBehavior: true,
    textOverflow: true,
    whitespace: true,
    wordBreak: true,
    hyphens: true,
    content: true,
  },
};

// Utility function to merge configurations
export function mergeConfig(userConfig: StyleConfig = {}): StyleConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    theme: {
      ...defaultConfig.theme,
      ...userConfig.theme,
      ...(userConfig.theme?.extend && {
        colors: {
          ...defaultConfig.theme?.colors,
          ...userConfig.theme?.colors,
          ...userConfig.theme?.extend?.colors,
        },
        spacing: {
          ...defaultConfig.theme?.spacing,
          ...userConfig.theme?.spacing,
          ...userConfig.theme?.extend?.spacing,
        },
        fontSize: {
          ...defaultConfig.theme?.fontSize,
          ...userConfig.theme?.fontSize,
          ...userConfig.theme?.extend?.fontSize,
        },
        fontFamily: {
          ...defaultConfig.theme?.fontFamily,
          ...userConfig.theme?.fontFamily,
          ...userConfig.theme?.extend?.fontFamily,
        },
        fontWeight: {
          ...defaultConfig.theme?.fontWeight,
          ...userConfig.theme?.fontWeight,
          ...userConfig.theme?.extend?.fontWeight,
        },
        lineHeight: {
          ...defaultConfig.theme?.lineHeight,
          ...userConfig.theme?.lineHeight,
          ...userConfig.theme?.extend?.lineHeight,
        },
        letterSpacing: {
          ...defaultConfig.theme?.letterSpacing,
          ...userConfig.theme?.letterSpacing,
          ...userConfig.theme?.extend?.letterSpacing,
        },
        borderRadius: {
          ...defaultConfig.theme?.borderRadius,
          ...userConfig.theme?.borderRadius,
          ...userConfig.theme?.extend?.borderRadius,
        },
        boxShadow: {
          ...defaultConfig.theme?.boxShadow,
          ...userConfig.theme?.boxShadow,
          ...userConfig.theme?.extend?.boxShadow,
        },
        screens: {
          ...defaultConfig.theme?.screens,
          ...userConfig.theme?.screens,
          ...userConfig.theme?.extend?.screens,
        },
      }),
    },
    variants: {
      ...defaultConfig.variants,
      ...userConfig.variants,
    },
    plugins: [
      ...(defaultConfig.plugins || []),
      ...(userConfig.plugins || []),
    ],
    presets: [
      ...(defaultConfig.presets || []),
      ...(userConfig.presets || []),
    ],
  };
}

// Example usage configurations
export const exampleConfigs = {
  // Basic configuration
  basic: {
    theme: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#06b6d4',
      },
    },
  },

  // Dark mode configuration
  darkMode: {
    theme: {
      colors: {
        dark: {
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
      },
    },
  },

  // Custom spacing
  customSpacing: {
    theme: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },

  // Custom fonts
  customFonts: {
    theme: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
};
