/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GOOGLE_AUTH_CLIENT_ID: string;
  readonly STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
