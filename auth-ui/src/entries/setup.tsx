import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SetupPage } from '../pages/SetupPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SetupPage />
  </StrictMode>
);
