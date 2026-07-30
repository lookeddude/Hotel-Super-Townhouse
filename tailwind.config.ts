import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand — Townhouse Red
        primary: {
          DEFAULT: '#e31837',
          dark: '#b90027',
          container: '#ffdad8',
          foreground: '#ffffff',
        },
        // Background & Surface
        background: '#fbf9f8',
        surface: {
          DEFAULT: '#efeded',
          bright: '#fbf9f8',
          dim: '#dbd9d9',
          'container-lowest': '#ffffff',
          'container-low': '#f5f3f3',
          container: '#efeded',
          'container-high': '#eae8e7',
          'container-highest': '#e4e2e2',
        },
        // On colors
        'on-surface': '#1b1c1c',
        'on-surface-variant': '#5d3f3e',
        'inverse-surface': '#303030',
        'inverse-on-surface': '#f2f0f0',
        // Outline
        outline: '#916e6d',
        'outline-variant': '#e6bdbb',
        // Secondary
        secondary: {
          DEFAULT: '#5f5e5e',
          container: '#e4e2e1',
          foreground: '#ffffff',
        },
        // Error
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          foreground: '#ffffff',
        },
        // shadcn compat
        border: '#e6bdbb',
        input: '#e6bdbb',
        ring: '#e31837',
        foreground: '#1b1c1c',
        muted: {
          DEFAULT: '#efeded',
          foreground: '#5d3f3e',
        },
        accent: {
          DEFAULT: '#efeded',
          foreground: '#1b1c1c',
        },
        destructive: {
          DEFAULT: '#ba1a1a',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1b1c1c',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1b1c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '1.3', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.01em' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      boxShadow: {
        'level-1': '0 0 0 1px #ededed',
        'level-2': '0px 10px 30px rgba(0,0,0,0.04)',
        'level-3': '0px 20px 40px rgba(0,0,0,0.08)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0px 10px 30px rgba(0,0,0,0.08)',
      },
      maxWidth: {
        container: '1280px',
      },
      spacing: {
        'section': '80px',
        'gutter': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
      },
      container: {
        center: true,
        padding: { DEFAULT: '16px', sm: '24px', lg: '48px' },
        screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
      },
    },
  },
  plugins: [],
};

export default config;
