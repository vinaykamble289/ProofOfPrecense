import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThirdwebProvider } from '@thirdweb-dev/react'
import { Polygon } from '@thirdweb-dev/chains'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'

// Check if Thirdweb client ID is available
const thirdwebClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID

// Validate Thirdweb configuration
if (!thirdwebClientId || thirdwebClientId === "your_thirdweb_client_id_here") {
  console.warn('⚠️ Thirdweb Client ID not configured. Please set VITE_THIRDWEB_CLIENT_ID in your environment variables.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThirdwebProvider 
      activeChain={Polygon}
      clientId={thirdwebClientId || "demo_client_id"}
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThirdwebProvider>
  </React.StrictMode>,
)
