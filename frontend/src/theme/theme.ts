import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: 'var(--primary-color)',
        contrastText: '#fff',
      },
      secondary: {
        main: 'var(--secondary-color)',
      },
      background: {
        default: mode === 'dark' ? '#121420' : 'var(--background-color)',
        paper: mode === 'dark' ? '#1b2432' : '#fff',
      },
      text: {
        primary: mode === 'dark' ? '#fff' : 'var(--text-primary)',
        secondary: mode === 'dark' ? '#bbd0ff' : 'var(--text-secondary)',
      },
      error: {
        main: 'var(--error-color)',
      },
      success: {
        main: 'var(--success-color)',
      },
      warning: {
        main: '#ffa726',
      },
      info: {
        main: '#29b6f6',
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: [
        'Inter',
        'Roboto',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.2 },
      h2: { fontWeight: 600, fontSize: '2rem', lineHeight: 1.3 },
      h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.4 },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontSize: '0.95rem', lineHeight: 1.5 },
    },
    shadows: [
      'none',
      '0 2px 8px rgba(0,0,0,0.08)',
      ...Array(23).fill('0 2px 8px rgba(0,0,0,0.10)'),
    ] as any,
  }); 