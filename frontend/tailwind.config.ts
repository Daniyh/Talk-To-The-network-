import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#050B18',
          secondary: '#0A1628',
          card:      '#0D1F35',
          hover:     '#112440',
        },
        border: {
          DEFAULT: '#1A3050',
          bright:  '#2A4A70',
        },
        accent: {
          blue:  '#0066FF',
          cyan:  '#00D4FF',
          glow:  '#00D4FF33',
        },
        ericsson: {
          blue:  '#002561',
          light: '#0057A8',
        },
        status: {
          healthy:  '#00E5A0',
          warning:  '#FFB800',
          critical: '#FF4444',
          unknown:  '#4A6080',
        },
        text: {
          primary:   '#E8F4FD',
          secondary: '#7B9DB5',
          muted:     '#3D5A73',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'fade-in':    'fade-in 0.3s ease-out',
        'slide-up':   'slide-up 0.4s ease-out',
        'blink':      'blink 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(1)',   opacity: '0.8' },
          '50%':  { transform: 'scale(1.4)', opacity: '0.3' },
          '100%': { transform: 'scale(1)',   opacity: '0.8' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
      },
      boxShadow: {
        card:  '0 0 0 1px #1A3050, 0 4px 24px rgba(0,0,0,0.4)',
        glow:  '0 0 20px rgba(0,212,255,0.25)',
        'glow-sm': '0 0 10px rgba(0,212,255,0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
