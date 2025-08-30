/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#1a1a1a',
        'bg-tertiary': '#2a2a2a',
        'bg-elevated': '#333333',
        
        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': '#e0e0e0',
        'text-tertiary': '#b0b0b0',
        'text-muted': '#808080',
        
        // Accent colors - Computer Vision Friendly
        'accent-primary': '#00d4ff',
        'accent-secondary': '#ff6b35',
        'accent-success': '#00ff88',
        'accent-warning': '#ffaa00',
        'accent-error': '#ff4757',
        
        // Status colors
        'status-present': '#00ff88',
        'status-absent': '#ff4757',
        'status-late': '#ffaa00',
        'status-excused': '#808080',
        
        // Border colors
        'border-primary': '#404040',
        'border-secondary': '#505050',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  plugins: [],
}
