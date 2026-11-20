/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chat-main': '#212121',
        'chat-sidebar': '#171717',
        'chat-input': '#303030',
        'chat-card': '#2A2A2A',
        'chat-card-hover': '#323232',
        'chat-border': '#414141',
        'chat-border-light': '#333333',
        'chat-accent': '#10A37F',
        'chat-accent-hover': '#1a7f64',
        'chat-text': '#ECECEC',
        'chat-muted': '#8E8EA0',
        'chat-user-msg': '#2A2A2A',
        'chat-assistant-msg': '#212121',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '56px': '56px',
        '68px': '68px',
        '260px': '260px',
      },
      maxWidth: {
        'chat': '800px',
        'user-msg': '85%',
      },
      borderRadius: {
        'composer': '24px',
        'card': '12px',
      },
      fontSize: {
        'message': ['15px', { lineHeight: '1.6' }],
        'heading': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'navbar': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'secondary': ['12px', { lineHeight: '1.4' }],
      }
    },
  },
  plugins: [],
}
