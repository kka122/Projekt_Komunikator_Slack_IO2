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
import {API_BASE_URL} from "./config/api.ts";
import {setupAuthInterceptors} from "./api/httpAuth.ts";

/**
 * Application entry point. Configures axios globally (send cookies + base URL),
 * installs the CSRF/refresh interceptors, then mounts {@link App} wrapped in the
 * provider stack:
 * - {@link GoogleOAuthProvider} — Google sign-in.
 * - {@link QueryClientProvider} — react-query cache ({@link queryClient}).
 * - {@link HotkeysProvider} — global keyboard-shortcut context.
 */

// withCredentials lets the httpOnly JWT cookies ride along on every request.
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL

setupAuthInterceptors();

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
