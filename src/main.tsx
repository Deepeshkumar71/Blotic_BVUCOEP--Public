// EMERGENCY PRODUCTION FIX - Simplified main.tsx
import { createRoot } from "react-dom/client";

// Production debugging
console.log('🚀 EMERGENCY FIX - Application starting...', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  timestamp: new Date().toISOString()
});

// Check root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ CRITICAL: Root element not found!');
  document.body.innerHTML = '<div style="padding:20px;font-family:Arial;"><h1 style="color:red;">Error: Root element missing</h1><p>Cannot start application - root div not found</p></div>';
  throw new Error('Root element not found');
}

console.log('✅ Root element found, loading app...');

// Dynamic imports with detailed error handling
Promise.all([
  import("./App.tsx"),
  import("./index.css")
]).then(([AppModule]) => {
  console.log('✅ Modules loaded successfully');
  
  try {
    const App = AppModule.default;
    const root = createRoot(rootElement);
    
    root.render(<App />);
    console.log('✅ EMERGENCY FIX - Application rendered successfully!');
    
  } catch (renderError) {
    console.error('❌ Render error:', renderError);
    rootElement.innerHTML = `
      <div style="padding:20px;font-family:Arial;">
        <h1 style="color:red;">Render Error</h1>
        <p>Failed to render application: ${renderError.message}</p>
        <button onclick="location.reload()" style="padding:10px;background:#007bff;color:white;border:none;border-radius:4px;">Reload</button>
      </div>
    `;
  }
  
}).catch((importError) => {
  console.error('❌ Import error:', importError);
  rootElement.innerHTML = `
    <div style="padding:20px;font-family:Arial;">
      <h1 style="color:red;">Import Error</h1>
      <p>Failed to load application modules: ${importError.message}</p>
      <details>
        <summary>Error Details</summary>
        <pre style="background:#f5f5f5;padding:10px;overflow:auto;">${importError.stack}</pre>
      </details>
      <button onclick="location.reload()" style="padding:10px;background:#007bff;color:white;border:none;border-radius:4px;">Reload</button>
    </div>
  `;
});
