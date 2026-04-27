/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          black: '#0a0a0a',
          dark: '#111111',
          DEFAULT: '#1a1a1a',
          light: '#262626',
          border: '#333333',
        },
        finance: {
          green: '#00ff88',
          'green-dim': '#00cc6a',
          'green-glow': 'rgba(0, 255, 136, 0.15)',
          red: '#ff4757',
          'red-dim': '#cc3a47',
          yellow: '#ffd93d',
          blue: '#4dabf7',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          muted: '#666666',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
      },
      boxShadow: {
        'terminal': '0 0 20px rgba(0, 255, 136, 0.1)',
        'terminal-lg': '0 0 40px rgba(0, 255, 136, 0.15)',
        'glow-green': '0 0 10px rgba(0, 255, 136, 0.5)',
        'glow-red': '0 0 10px rgba(255, 71, 87, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 255, 136, 0.25)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
