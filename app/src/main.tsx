import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {GoogleOAuthProvider} from "@react-oauth/google";

const GOOGLE_AUTH_CLIENT_ID = "494938514607-anfdu3la3q4g31uo7q1dit1dpkd2p98q.apps.googleusercontent.com"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_AUTH_CLIENT_ID}>
      <App/>
    </GoogleOAuthProvider>
  </StrictMode>,
)
