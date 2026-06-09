import {type JSX, useRef} from "react";
import {type CredentialResponse, GoogleLogin} from "@react-oauth/google";
import styles from './GoogleAuth.module.css'
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import type {GoogleAuthRequestBody} from "../../api/models";
import {GoogleAuthBody} from "../../api/endpoints/auth/auth.zod.ts";
import {googleAuth} from "../../api/endpoints/auth/auth.ts";

function GoogleAuth(): JSX.Element {
  const googleLoginRef = useRef<HTMLDivElement>(null);

  const login = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    const requestBody: GoogleAuthRequestBody = {
      token: credentialResponse.credential
    }
    const requestBodyParsed = GoogleAuthBody.safeParse(requestBody);
    if (!requestBodyParsed.success) {
      throw new Error('Invalid request body');
    }

    googleAuth(requestBodyParsed.data)
      .then(response => {
        console.log('Login successful', response);
      })
      .catch(error => {
        console.error(error);
      })
  }

  const triggerGoogleLogin = () => {
    // Find the Google Login button inside the div and click it
    const button = googleLoginRef.current?.querySelector('div[role="button"]') as HTMLElement;
    if (button) {
      button.click();
    }
  }

  return <div className={styles.googleAuth}>
    <InlineHotkey hotkeyFunction={triggerGoogleLogin} hotkeyKey={'G'} letterIndex={1}>
      Zaloguj się przez Google
    </InlineHotkey>
    <div ref={googleLoginRef} className={styles.googleButton}>
      <GoogleLogin onSuccess={login} onError={() => console.log('Login Failed')}/>
    </div>
  </div>
}

export default GoogleAuth;