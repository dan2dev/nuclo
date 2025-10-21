// Example configuration demonstrating Tailwind-like features
import type { StyleConfig } from './style-config';

// Example 1: Basic configuration with custom colors and spacing
export const basicConfig: StyleConfig = {
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
      brand: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#f59e0b',
      },
    },
    spacing: {
      '18': '4.5rem',
      '88': '22rem',
      '128': '32rem',
      '144': '36rem',
    },
    extend: {
      colors: {
        custom: {
          light: '#f8f9fa',
          dark: '#212529',
        }
      }
    }
  }
};

// Example 2: Dark mode configuration
export const darkModeConfig: StyleConfig = {
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
      light: {
        50: '#ffffff',
        100: '#f8fafc',
        200: '#f1f5f9',
        300: '#e2e8f0',
        400: '#cbd5e1',
        500: '#94a3b8',
        600: '#64748b',
        700: '#475569',
        800: '#334155',
        900: '#1e293b',
      }
    }
  }
};

// Example 3: Custom fonts and typography
export const typographyConfig: StyleConfig = {
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
      mono: ['Fira Code', 'monospace'],
      display: ['Poppins', 'sans-serif'],
    },
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1rem', { lineHeight: '1.5rem' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
      'display': ['4rem', { lineHeight: '1' }],
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
    }
  }
};

// Example 4: Custom spacing and sizing
export const spacingConfig: StyleConfig = {
  theme: {
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
      // Custom spacing values
      '18': '4.5rem',
      '88': '22rem',
      '128': '32rem',
      '144': '36rem',
    }
  }
};

// Example 5: Custom border radius and shadows
export const effectsConfig: StyleConfig = {
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
      // Custom border radius
      'card': '0.5rem',
      'button': '0.375rem',
      'input': '0.25rem',
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
      // Custom shadows
      'card': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      'button': '0 2px 4px -1px rgb(0 0 0 / 0.1)',
      'elevated': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    }
  }
};

// Example 6: Responsive breakpoints
export const responsiveConfig: StyleConfig = {
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
};

// Example 7: Complete configuration with all features
export const completeConfig: StyleConfig = {
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
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
      mono: ['Fira Code', 'monospace'],
    },
    fontSize: {
      'display': ['4rem', { lineHeight: '1' }],
    },
    borderRadius: {
      'card': '0.5rem',
      'button': '0.375rem',
    },
    boxShadow: {
      'card': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      'button': '0 2px 4px -1px rgb(0 0 0 / 0.1)',
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          primary: '#3b82f6',
          secondary: '#6b7280',
        }
      }
    }
  },
  variants: {
    backgroundColor: ['hover', 'focus', 'active'],
    textColor: ['hover', 'focus'],
    borderColor: ['hover', 'focus'],
    opacity: ['hover', 'focus', 'disabled'],
  }
};

// Example 8: Minimal configuration
export const minimalConfig: StyleConfig = {
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      success: '#10b981',
      danger: '#ef4444',
    }
  }
};
