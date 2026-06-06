/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nova: {
          bg:       '#05050a',
          surface:  '#0c0c14',
          elevated: '#11111c',
          card:     '#161624',
          border:   '#1e1e32',
          accent:   '#00e5b4',
          purple:   '#7c63ff',
          coral:    '#ff6b6b',
          text:     '#eeeeff',
          muted:    '#9090b0',
          subtle:   '#505070',
        },
        gain:  '#00d98f',
        loss:  '#ff4560',
        warn:  '#ffd166',
        info:  '#60a5fa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'nova-grid': 'linear-gradient(rgba(30,30,50,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,50,0.4) 1px, transparent 1px)',
        'accent-glow': 'radial-gradient(ellipse at 50% 0%, rgba(0,229,180,0.12) 0%, transparent 60%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
      },
      backgroundSize: {
        'nova-grid': '40px 40px',
      },
      boxShadow: {
        'nova':      '0 0 0 1px rgba(0,229,180,0.15), 0 4px 24px rgba(0,0,0,0.4)',
        'nova-lg':   '0 0 0 1px rgba(0,229,180,0.2),  0 8px 48px rgba(0,0,0,0.6)',
        'card':      '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        'accent':    '0 0 20px rgba(0,229,180,0.3)',
        'gain':      '0 0 12px rgba(0,217,143,0.35)',
        'loss':      '0 0 12px rgba(255,69,96,0.35)',
      },
      animation: {
        'flash-gain':  'flashGain 0.6s ease-in-out',
        'flash-loss':  'flashLoss 0.6s ease-in-out',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'live-dot':    'liveDot 1.4s ease-in-out infinite',
        'slide-in':    'slideIn 0.25s ease-out',
        'fade-up':     'fadeUp 0.3s ease-out',
        'scan-line':   'scanLine 3s linear infinite',
      },
      keyframes: {
        flashGain: {
          '0%,100%': { backgroundColor: 'transparent' },
          '40%':     { backgroundColor: 'rgba(0,217,143,0.18)' },
        },
        flashLoss: {
          '0%,100%': { backgroundColor: 'transparent' },
          '40%':     { backgroundColor: 'rgba(255,69,96,0.18)' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.7' },
          '50%':     { opacity: '1' },
        },
        liveDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '0.3', transform: 'scale(0.7)' },
        },
        slideIn: {
          from: { transform: 'translateX(-8px)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        fadeUp: {
          from: { transform: 'translateY(6px)', opacity: '0' },
          to:   { transform: 'translateY(0)',   opacity: '1' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
    },
  },
  plugins: [],
};
