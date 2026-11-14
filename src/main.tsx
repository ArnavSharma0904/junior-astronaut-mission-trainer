import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/tokens.css';
import { BUILD_SHA } from './build-info';

document.documentElement.dataset.buildSha = BUILD_SHA;

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
