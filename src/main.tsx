// Cache-busting comment: Updated 2025-01-06-16:54

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SecurityHeadersManager } from "@/lib/security/securityHeaders";

// Apply security headers
SecurityHeadersManager.applyHeaders();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);