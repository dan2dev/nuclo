# Enhanced Style Configuration System

This enhanced styling system provides a Tailwind CSS-like configuration interface for the nuclo framework, allowing you to customize colors, spacing, typography, and more.

## Features

- **Tailwind-like Configuration**: Similar API to Tailwind CSS configuration
- **Theme Customization**: Colors, spacing, fonts, border radius, shadows
- **Responsive Design**: Custom breakpoints and responsive utilities
- **Type Safety**: Full TypeScript support with autocomplete
- **Extensible**: Easy to extend with custom values
- **Performance**: Optimized CSS generation and caching

## Basic Usage

```typescript
import { enhancedStyleSetup } from './enhanced-styling';

const style = enhancedStyleSetup({
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
      secondary: '#6b7280',
      success: '#10b981',
      danger: '#ef4444',
    },
    spacing: {
      '18': '4.5rem',
      '88': '22rem',
      '128': '32rem',
    }
  }
});

// Use in your components
const element = div(
  style.cn(['bg-primary-500', 'text-white', 'p-4', 'rounded-lg']),
  'Hello World'
);
```

## Configuration Options

### Theme Configuration

#### Colors
```typescript
theme: {
  colors: {
    // Simple colors
    primary: '#3b82f6',
    secondary: '#6b7280',
    
    // Color scales
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
    
    // Custom colors
    brand: {
      primary: '#3b82f6',
      secondary: '#6b7280',
    }
  }
}
```

#### Spacing
```typescript
theme: {
  spacing: {
    // Default spacing scale
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    4: '1rem',
    8: '2rem',
    16: '4rem',
    32: '8rem',
    
    // Custom spacing values
    '18': '4.5rem',
    '88': '22rem',
    '128': '32rem',
  }
}
```

#### Typography
```typescript
theme: {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    serif: ['Merriweather', 'serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    'xs': ['0.75rem', { lineHeight: '1rem' }],
    'sm': ['0.875rem', { lineHeight: '1.25rem' }],
    'base': ['1rem', { lineHeight: '1.5rem' }],
    'lg': ['1.125rem', { lineHeight: '1.75rem' }],
    'xl': ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    'display': ['4rem', { lineHeight: '1', fontWeight: '700' }],
  },
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  }
}
```

#### Border Radius & Shadows
```typescript
theme: {
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
    // Custom values
    'card': '0.5rem',
    'button': '0.375rem',
  },
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    // Custom shadows
    'card': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    'button': '0 2px 4px -1px rgb(0 0 0 / 0.1)',
  }
}
```

#### Responsive Breakpoints
```typescript
theme: {
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    // Custom breakpoints
    'mobile': '480px',
    'tablet': '768px',
    'desktop': '1024px',
    'wide': '1440px',
  }
}
```

### Extending Configuration

Use the `extend` property to add new values without overriding defaults:

```typescript
theme: {
  colors: {
    primary: '#3b82f6',
  },
  extend: {
    colors: {
      brand: {
        primary: '#3b82f6',
        secondary: '#6b7280',
      }
    },
    spacing: {
      '18': '4.5rem',
      '88': '22rem',
    }
  }
}
```

## Responsive Design

### Breakpoint Configuration
```typescript
const style = enhancedStyleSetup({
  size: {
    sm: "min-width: 640px",
    md: "min-width: 768px", 
    lg: "min-width: 1024px",
    xl: "min-width: 1280px",
    '2xl': "min-width: 1536px",
  }
});
```

### Responsive Classes
```typescript
// Responsive utility classes
const responsiveElement = div(
  style.cn({
    "sm": ["flex", "flex-col", "bg-primary-500", "w-full", "h-full", "p-4"],
    "lg": ["flex", "flex-row", "bg-secondary-500", "w-500px", "h-500px", "p-6"],
  }),
  'Responsive content'
);
```

## Accessing Theme Values

You can access theme values programmatically:

```typescript
// Get color values
const primaryColor = style.theme('colors.primary.500');
const brandColor = style.theme('colors.brand.primary');

// Get spacing values
const customSpacing = style.theme('spacing.18');

// Get font family
const fontFamily = style.theme('fontFamily.sans');
```

## Utility Classes

The system supports all standard utility classes:

### Layout
- `flex`, `grid`, `block`, `inline`, `hidden`
- `flex-col`, `flex-row`, `flex-wrap`
- `items-center`, `items-start`, `items-end`
- `justify-center`, `justify-between`, `justify-around`

### Spacing
- `p-4`, `pt-4`, `pr-4`, `pb-4`, `pl-4`
- `px-4`, `py-4`
- `m-4`, `mt-4`, `mr-4`, `mb-4`, `ml-4`
- `mx-4`, `my-4`

### Colors
- `bg-primary-500`, `bg-secondary-300`
- `text-white`, `text-gray-900`
- `border-primary-500`

### Typography
- `text-sm`, `text-lg`, `text-xl`
- `font-bold`, `font-semibold`
- `text-center`, `text-left`, `text-right`

### Border Radius
- `rounded`, `rounded-lg`, `rounded-xl`
- `rounded-full`

## Examples

See `example-config.ts` for comprehensive configuration examples including:

- Basic configuration
- Dark mode setup
- Custom typography
- Custom spacing and sizing
- Effects and shadows
- Responsive breakpoints
- Complete configuration

## Migration from Basic StyleSetup

The enhanced system is backward compatible. You can gradually migrate:

```typescript
// Old way
const style = styleSetup({
  size: { sm: "min-width: 600px" },
  colors: { blue: "#007bff" }
});

// New way
const style = enhancedStyleSetup({
  theme: {
    colors: { primary: "#007bff" },
    screens: { sm: "640px" }
  }
});
```

## Performance

- CSS is generated on-demand and cached
- Only used classes are included in the final CSS
- Responsive classes are optimized for media queries
- TypeScript provides compile-time validation

## Type Safety

The system provides full TypeScript support with:
- Autocomplete for all configuration options
- Type checking for utility classes
- IntelliSense for theme values
- Compile-time validation of class names
