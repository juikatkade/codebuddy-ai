import React from 'react';
import { createRoot } from 'react-dom/client';
import ContentApp from './ContentApp';

// Initialize the content script
function init() {
  // Check if we already injected
  if (document.getElementById('codebuddy-ai-root')) return;

  const rootElement = document.createElement('div');
  rootElement.id = 'codebuddy-ai-root';
  document.body.appendChild(rootElement);

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ContentApp />
    </React.StrictMode>
  );
}

// Run init
init();
