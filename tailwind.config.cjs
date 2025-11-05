module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // BharatApp palette: deep blue primary (trust), saffron accent (energy)
          primary: '#0B3D91',
          primaryDark: '#072A66',
          primaryLight: '#4C7BD9',
          accent: '#F57C00',
          accentDark: '#E65100',
          accentLight: '#FF9E3D',
          muted: '#F8FAFC', // subtle surfaces
        },
        semantic: {
          success: '#1B8F3A', // rich green
          warning: '#F59E0B', // marigold
          error: '#D32F2F', // sindoor red
          info: '#0EA5E9',
        },
        neutral: {
          25: '#FCFCFD',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      borderRadius: {
        'brand-xs': '0.125rem',
        'brand-sm': '0.25rem',
        'brand-md': '0.5rem',
        'brand-lg': '0.75rem',
        'brand-xl': '1rem',
        'brand-2xl': '1.5rem',
      },
      boxShadow: {
        'elev-1': '0 1px 2px rgba(17, 24, 39, 0.06), 0 1px 1px rgba(17, 24, 39, 0.04)',
        'elev-2': '0 2px 4px rgba(17, 24, 39, 0.08), 0 2px 2px rgba(17, 24, 39, 0.06)',
        'elev-3': '0 4px 8px rgba(17, 24, 39, 0.10), 0 2px 4px rgba(17, 24, 39, 0.08)',
        'elev-4': '0 10px 20px rgba(17, 24, 39, 0.12), 0 6px 6px rgba(17, 24, 39, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'],
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em' }], // 36px
        headline: ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }], // 30px
        title: ['1.5rem', { lineHeight: '2rem' }], // 24px
        subtitle: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        body: ['1rem', { lineHeight: '1.5rem' }], // 16px
        caption: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        micro: ['0.75rem', { lineHeight: '1rem' }], // 12px
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn .3s ease-out both',
        slideUp: 'slideUp .35s ease-out both',
        scaleIn: 'scaleIn .3s ease-out both',
      },
    },
  },
  plugins: [],
}
