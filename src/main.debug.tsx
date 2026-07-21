/**
 * Debug version of main.tsx for production troubleshooting
 * This version includes error boundaries and detailed logging
 */

import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  console.error('Application Error:', error);
  
  return (
    <div style={{ 
      padding: '20px', 
      background: '#f8f9fa', 
      border: '1px solid #dee2e6', 
      borderRadius: '4px',
      margin: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>Application Error</h2>
      <details style={{ marginBottom: '16px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
        <pre style={{ 
          background: '#f1f3f4', 
          padding: '12px', 
          borderRadius: '4px', 
          overflow: 'auto',
          fontSize: '14px',
          marginTop: '8px'
        }}>
          {error.message}
          {error.stack}
        </pre>
      </details>
      <button 
        onClick={resetErrorBoundary}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try Again
      </button>
    </div>
  );
}

// Log environment info
console.log('🚀 Application starting...');
console.log('Environment:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  baseUrl: import.meta.env.BASE_URL,
});

// Check if root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: system-ui;">
      <h1 style="color: red;">Error: Root element not found</h1>
      <p>The application cannot start because the root element is missing.</p>
      <p>Expected: &lt;div id="root"&gt;&lt;/div&gt;</p>
    </div>
  `;
} else {
  console.log('✅ Root element found');
  
  // Dynamic import with error handling
  import("./App.tsx")
    .then((AppModule) => {
      console.log('✅ App module loaded');
      const App = AppModule.default;
      
      // Import CSS
      return import("./index.css").then(() => {
        console.log('✅ CSS loaded');
        
        const root = createRoot(rootElement);
        root.render(
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error, errorInfo) => {
              console.error('React Error Boundary caught an error:', error, errorInfo);
            }}
          >
            <App />
          </ErrorBoundary>
        );
        
        console.log('✅ Application rendered successfully');
      });
    })
    .catch((error) => {
      console.error('❌ Failed to load application:', error);
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: system-ui;">
          <h1 style="color: red;">Failed to Load Application</h1>
          <p>Error: ${error.message}</p>
          <details>
            <summary>Stack Trace</summary>
            <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
          </details>
          <button onclick="location.reload()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      `;
    });
}
