/**
 * Super Townhouse — Centralized Design Token Configuration
 * Source of truth: Stitch project/9202939483893188029
 * DO NOT modify without updating tailwind.config.ts accordingly
 */

export const theme = {
  colors: {
    primary: '#e31837',
    primaryDark: '#b90027',
    primaryContainer: '#ffdad8',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#fffaf9',

    secondary: '#5f5e5e',
    secondaryContainer: '#e4e2e1',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#656464',

    tertiary: '#5a5b5c',
    tertiaryContainer: '#727474',
    onTertiary: '#ffffff',
    onTertiaryContainer: '#fbfbfb',

    background: '#fbf9f8',
    surface: '#efeded',
    surfaceBright: '#fbf9f8',
    surfaceDim: '#dbd9d9',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f5f3f3',
    surfaceContainer: '#efeded',
    surfaceContainerHigh: '#eae8e7',
    surfaceContainerHighest: '#e4e2e2',

    onBackground: '#1b1c1c',
    onSurface: '#1b1c1c',
    onSurfaceVariant: '#5d3f3e',
    inverseSurface: '#303030',
    inverseOnSurface: '#f2f0f0',
    inversePrimary: '#ffb3b1',

    outline: '#916e6d',
    outlineVariant: '#e6bdbb',
    surfaceTint: '#bf0029',

    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',
  },

  typography: {
    headingFont: 'Montserrat',
    bodyFont: 'Inter',
    labelFont: 'Inter',
    scale: {
      display: { size: '48px', weight: '700', lineHeight: '1.2', letterSpacing: '-0.02em' },
      headlineLg: { size: '32px', weight: '700', lineHeight: '1.3' },
      headlineLgMobile: { size: '24px', weight: '700', lineHeight: '1.3' },
      headlineMd: { size: '24px', weight: '600', lineHeight: '1.4' },
      bodyLg: { size: '18px', weight: '400', lineHeight: '1.6' },
      bodyMd: { size: '16px', weight: '400', lineHeight: '1.5' },
      labelMd: { size: '14px', weight: '600', lineHeight: '1', letterSpacing: '0.01em' },
      caption: { size: '12px', weight: '500', lineHeight: '1.4' },
    },
  },

  spacing: {
    containerMax: '1280px',
    gutter: '24px',
    marginMobile: '16px',
    marginDesktop: '48px',
    stackSm: '8px',
    stackMd: '16px',
    stackLg: '32px',
    sectionGap: '80px',
  },

  radius: {
    sm: '4px',     // chips, tags
    DEFAULT: '8px', // standard
    md: '12px',
    lg: '16px',    // cards, buttons, inputs
    xl: '24px',
    full: '9999px',
  },

  shadows: {
    level0: 'none',
    level1: '0 0 0 1px #ededed',
    level2: '0px 10px 30px rgba(0,0,0,0.04)',
    level3: '0px 20px 40px rgba(0,0,0,0.08)',
  },

  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },

  breakpoints: {
    mobile: '375px',
    tablet: '768px',
    laptop: '1024px',
    desktop: '1280px',
    wide: '1440px',
  },
} as const;

export type ThemeColors = typeof theme.colors;
export type ThemeTypography = typeof theme.typography;
