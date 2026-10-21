import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Sentry } from '@/lib/sentry';

import './app/global.css';
import 'react-photo-view/dist/react-photo-view.css';

import { ThemeProvider } from '@/components/providers/theme-provider';
import I18nProvider from '@/i18n/I18nProvider';
import { Toaster } from '@/components/ui/sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary
    fallback={
      <div className="p-8 text-sm text-muted-foreground">
        Something went wrong. Please reload the page.
      </div>
    }
  >
    <React.StrictMode>
      <ThemeProvider>
        <I18nProvider>
          <RouterProvider router={router} />
          <Toaster />
        </I18nProvider>
      </ThemeProvider>
    </React.StrictMode>
  </Sentry.ErrorBoundary>,
);
