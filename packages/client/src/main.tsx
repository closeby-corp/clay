import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { App } from './App';
import { ThemeSync } from './ThemeSync';
import { BADUI_THEME_KEY } from './themeBridge';
import '@domternal/theme';
import '@xyflow/react/dist/style.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={BADUI_THEME_KEY}
    >
      <ThemeSync />
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
);
