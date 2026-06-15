import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import axios from 'axios'
import 'normalize.css'
import './index.css'
import App from './App.tsx'
import {GoogleOAuthProvider} from "@react-oauth/google";
import {QueryClientProvider} from "@tanstack/react-query";
import {HotkeysProvider} from "@tanstack/react-hotkeys";
import queryClient from "./config/queryClient.ts";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000/api'

const GOOGLE_AUTH_CLIENT_ID = import.meta.env.GOOGLE_AUTH_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_AUTH_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <HotkeysProvider>
          <App/>
        </HotkeysProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
