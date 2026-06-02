import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {GoogleOAuthProvider} from "@react-oauth/google";

const GOOGLE_AUTH_CLIENT_ID = import.meta.env.GOOGLE_AUTH_CLIENT_ID
console.log(`GOOGLE_AUTH_CLIENT_ID: ${GOOGLE_AUTH_CLIENT_ID}`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_AUTH_CLIENT_ID}>
      <App/>
    </GoogleOAuthProvider>
  </StrictMode>,
)
