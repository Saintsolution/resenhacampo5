import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Entry point selects a development-only preview.
// eslint-disable-next-line react-refresh/only-export-components
const RootView = import.meta.env.DEV && location.hash === '#/previa-paineis' ? lazy(() => import('./components/DashboardPreview')) : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p>Carregando prévia…</p>}><RootView /></Suspense>
  </StrictMode>
);
