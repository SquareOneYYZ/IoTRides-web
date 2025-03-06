import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { CssBaseline, StyledEngineProvider } from '@mui/material';
import { PostHogProvider } from 'posthog-js/react';
import store from './store';
import { LocalizationProvider } from './common/components/LocalizationProvider';
import ErrorHandler from './common/components/ErrorHandler';
import Navigation from './Navigation';
import preloadImages from './map/core/preloadImages';
import NativeInterface from './common/components/NativeInterface';
import ServerProvider from './ServerProvider';
import ErrorBoundary from './ErrorBoundary';
import AppThemeProvider from './AppThemeProvider';

preloadImages();

const options = {
  api_host: import.meta.env.REACT_APP_PUBLIC_POSTHOG_HOST,
  debug: true,
  verbose: true,
};

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <PostHogProvider
        options={options}
        apiKey={import.meta.env.REACT_APP_PUBLIC_POSTHOG_KEY}
      >
        <LocalizationProvider>
          <StyledEngineProvider injectFirst>
            <AppThemeProvider>
              <CssBaseline />
              <ServerProvider>
                <BrowserRouter>
                  <Navigation />
                </BrowserRouter>
                <ErrorHandler />
                <NativeInterface />
              </ServerProvider>
            </AppThemeProvider>
          </StyledEngineProvider>
        </LocalizationProvider>
      </PostHogProvider>
    </Provider>
  </ErrorBoundary>,
);
