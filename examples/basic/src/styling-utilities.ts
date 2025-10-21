// Enhanced styling utilities and helper functions
import type { StyleConfig } from './style-config';

// Utility functions for common styling patterns
export const stylingUtils = {
  // Layout utilities
  layout: {
    center: () => ['flex', 'items-center', 'justify-center'],
    centerVertical: () => ['flex', 'items-center'],
    centerHorizontal: () => ['flex', 'justify-center'],
    spaceBetween: () => ['flex', 'justify-between'],
    spaceAround: () => ['flex', 'justify-around'],
    spaceEvenly: () => ['flex', 'justify-evenly'],
    stack: () => ['flex', 'flex-col'],
    row: () => ['flex', 'flex-row'],
    wrap: () => ['flex', 'flex-wrap'],
    nowrap: () => ['flex', 'flex-nowrap'],
  },

  // Spacing utilities
  spacing: {
    padding: (size: string) => [`p-${size}`],
    margin: (size: string) => [`m-${size}`],
    paddingX: (size: string) => [`px-${size}`],
    paddingY: (size: string) => [`py-${size}`],
    marginX: (size: string) => [`mx-${size}`],
    marginY: (size: string) => [`my-${size}`],
    gap: (size: string) => [`gap-${size}`],
  },

  // Color utilities
  colors: {
    primary: (shade = '500') => [`bg-primary-${shade}`, `text-white`],
    secondary: (shade = '500') => [`bg-secondary-${shade}`, `text-white`],
    success: () => ['bg-success', 'text-white'],
    danger: () => ['bg-danger', 'text-white'],
    warning: () => ['bg-warning', 'text-white'],
    info: () => ['bg-info', 'text-white'],
    white: () => ['bg-white', 'text-gray-900'],
    black: () => ['bg-black', 'text-white'],
    transparent: () => ['bg-transparent'],
  },

  // Typography utilities
  typography: {
    heading: (size: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl') => [
      `text-${size}`,
      'font-bold',
      'text-gray-900'
    ],
    body: (size: 'xs' | 'sm' | 'base' | 'lg' = 'base') => [
      `text-${size}`,
      'text-gray-700'
    ],
    caption: () => ['text-sm', 'text-gray-500'],
    link: () => ['text-primary-500', 'hover:text-primary-600', 'underline'],
  },

  // Border utilities
  borders: {
    rounded: (size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' = 'md') => [`rounded-${size}`],
    border: (color = 'gray-300') => ['border', `border-${color}`],
    borderWidth: (width: '0' | '1' | '2' | '4' | '8') => [`border-${width}`],
    borderStyle: (style: 'solid' | 'dashed' | 'dotted' | 'none') => [`border-${style}`],
  },

  // Shadow utilities
  shadows: {
    none: () => ['shadow-none'],
    sm: () => ['shadow-sm'],
    md: () => ['shadow-md'],
    lg: () => ['shadow-lg'],
    xl: () => ['shadow-xl'],
    '2xl': () => ['shadow-2xl'],
    inner: () => ['shadow-inner'],
  },

  // Position utilities
  position: {
    static: () => ['static'],
    relative: () => ['relative'],
    absolute: () => ['absolute'],
    fixed: () => ['fixed'],
    sticky: () => ['sticky'],
    top: (value: string) => ['absolute', 'top-0', `top-${value}`],
    bottom: (value: string) => ['absolute', 'bottom-0', `bottom-${value}`],
    left: (value: string) => ['absolute', 'left-0', `left-${value}`],
    right: (value: string) => ['absolute', 'right-0', `right-${value}`],
  },

  // Size utilities
  sizes: {
    full: () => ['w-full', 'h-full'],
    screen: () => ['w-screen', 'h-screen'],
    auto: () => ['w-auto', 'h-auto'],
    square: (size: string) => [`w-${size}`, `h-${size}`],
    width: (size: string) => [`w-${size}`],
    height: (size: string) => [`h-${size}`],
  },

  // Opacity utilities
  opacity: {
    transparent: () => ['opacity-0'],
    semiTransparent: () => ['opacity-50'],
    opaque: () => ['opacity-100'],
    custom: (value: number) => [`opacity-${value}`],
  },

  // Z-index utilities
  zIndex: {
    auto: () => ['z-auto'],
    '0': () => ['z-0'],
    '10': () => ['z-10'],
    '20': () => ['z-20'],
    '30': () => ['z-30'],
    '40': () => ['z-40'],
    '50': () => ['z-50'],
  },
};

// Pre-built component styles
export const componentStyles = {
  // Button variants
  button: {
    primary: () => [
      'bg-primary-500',
      'text-white',
      'px-4',
      'py-2',
      'rounded-md',
      'font-medium',
      'hover:bg-primary-600',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary-500',
      'transition-colors'
    ],
    secondary: () => [
      'bg-secondary-500',
      'text-white',
      'px-4',
      'py-2',
      'rounded-md',
      'font-medium',
      'hover:bg-secondary-600',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-secondary-500',
      'transition-colors'
    ],
    outline: () => [
      'border',
      'border-primary-500',
      'text-primary-500',
      'px-4',
      'py-2',
      'rounded-md',
      'font-medium',
      'hover:bg-primary-500',
      'hover:text-white',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary-500',
      'transition-colors'
    ],
    ghost: () => [
      'text-primary-500',
      'px-4',
      'py-2',
      'rounded-md',
      'font-medium',
      'hover:bg-primary-50',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary-500',
      'transition-colors'
    ],
  },

  // Input styles
  input: {
    default: () => [
      'w-full',
      'px-3',
      'py-2',
      'border',
      'border-gray-300',
      'rounded-md',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary-500',
      'focus:border-primary-500',
      'transition-colors'
    ],
    error: () => [
      'w-full',
      'px-3',
      'py-2',
      'border',
      'border-red-500',
      'rounded-md',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-red-500',
      'focus:border-red-500',
      'transition-colors'
    ],
    success: () => [
      'w-full',
      'px-3',
      'py-2',
      'border',
      'border-green-500',
      'rounded-md',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-green-500',
      'focus:border-green-500',
      'transition-colors'
    ],
  },

  // Card styles
  card: {
    default: () => [
      'bg-white',
      'rounded-lg',
      'shadow-md',
      'p-6',
      'border',
      'border-gray-200'
    ],
    elevated: () => [
      'bg-white',
      'rounded-lg',
      'shadow-lg',
      'p-6',
      'border',
      'border-gray-200'
    ],
    flat: () => [
      'bg-white',
      'rounded-lg',
      'p-6',
      'border',
      'border-gray-200'
    ],
  },

  // Modal styles
  modal: {
    overlay: () => [
      'fixed',
      'inset-0',
      'bg-black',
      'bg-opacity-50',
      'flex',
      'items-center',
      'justify-center',
      'z-50'
    ],
    content: () => [
      'bg-white',
      'rounded-lg',
      'shadow-xl',
      'p-6',
      'max-w-md',
      'w-full',
      'mx-4'
    ],
  },

  // Navigation styles
  nav: {
    default: () => [
      'bg-white',
      'shadow-sm',
      'border-b',
      'border-gray-200',
      'px-4',
      'py-2'
    ],
    dark: () => [
      'bg-gray-900',
      'text-white',
      'px-4',
      'py-2'
    ],
  },

  // Form styles
  form: {
    group: () => [
      'mb-4'
    ],
    label: () => [
      'block',
      'text-sm',
      'font-medium',
      'text-gray-700',
      'mb-1'
    ],
    error: () => [
      'text-sm',
      'text-red-600',
      'mt-1'
    ],
    help: () => [
      'text-sm',
      'text-gray-500',
      'mt-1'
    ],
  },
};

// Responsive utility helpers
export const responsiveUtils = {
  // Mobile-first responsive classes
  mobile: (classes: string[]) => classes,
  tablet: (classes: string[]) => classes.map(cls => `md:${cls}`),
  desktop: (classes: string[]) => classes.map(cls => `lg:${cls}`),
  wide: (classes: string[]) => classes.map(cls => `xl:${cls}`),
  
  // Breakpoint-specific utilities
  sm: (classes: string[]) => classes.map(cls => `sm:${cls}`),
  md: (classes: string[]) => classes.map(cls => `md:${cls}`),
  lg: (classes: string[]) => classes.map(cls => `lg:${cls}`),
  xl: (classes: string[]) => classes.map(cls => `xl:${cls}`),
  '2xl': (classes: string[]) => classes.map(cls => `2xl:${cls}`),
};

// Animation utilities
export const animationUtils = {
  // Transition classes
  transition: {
    all: () => ['transition-all', 'duration-300', 'ease-in-out'],
    colors: () => ['transition-colors', 'duration-300', 'ease-in-out'],
    opacity: () => ['transition-opacity', 'duration-300', 'ease-in-out'],
    transform: () => ['transition-transform', 'duration-300', 'ease-in-out'],
  },

  // Hover effects
  hover: {
    scale: (scale = '105') => [`hover:scale-${scale}`],
    lift: () => ['hover:shadow-lg', 'hover:-translate-y-1'],
    glow: () => ['hover:shadow-xl', 'hover:shadow-primary-500/25'],
  },

  // Focus effects
  focus: {
    ring: (color = 'primary') => [`focus:ring-2`, `focus:ring-${color}-500`],
    outline: () => ['focus:outline-none'],
  },
};

// Dark mode utilities
export const darkModeUtils = {
  // Dark mode classes
  dark: (classes: string[]) => classes.map(cls => `dark:${cls}`),
  
  // Common dark mode patterns
  background: {
    light: () => ['bg-white', 'dark:bg-gray-900'],
    card: () => ['bg-white', 'dark:bg-gray-800'],
    surface: () => ['bg-gray-50', 'dark:bg-gray-700'],
  },
  
  text: {
    primary: () => ['text-gray-900', 'dark:text-white'],
    secondary: () => ['text-gray-600', 'dark:text-gray-300'],
    muted: () => ['text-gray-500', 'dark:text-gray-400'],
  },
  
  border: {
    default: () => ['border-gray-200', 'dark:border-gray-700'],
    strong: () => ['border-gray-300', 'dark:border-gray-600'],
  },
};

// Export all utilities
export const utils = {
  ...stylingUtils,
  components: componentStyles,
  responsive: responsiveUtils,
  animation: animationUtils,
  darkMode: darkModeUtils,
};
