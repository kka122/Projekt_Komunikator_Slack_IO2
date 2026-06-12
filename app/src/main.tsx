import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import axios from 'axios'
import 'normalize.css'
import './index.css'
import App from './App.tsx'
import {GoogleOAuthProvider} from "@react-oauth/google";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000/api'

const GOOGLE_AUTH_CLIENT_ID = import.meta.env.GOOGLE_AUTH_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_AUTH_CLIENT_ID}>
      <App/>
    </GoogleOAuthProvider>
  </StrictMode>,
)
