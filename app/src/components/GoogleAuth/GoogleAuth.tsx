import {type JSX, useRef, useState} from "react";
import {type CredentialResponse, GoogleLogin} from "@react-oauth/google";
import styles from './GoogleAuth.module.css'
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import type {GoogleAuthBody} from "../../api/models";
import {GoogleAuthBody as GoogleAuthBodyZod} from "../../api/endpoints/auth/auth.zod.ts";
import {googleAuth} from "../../api/endpoints/auth/auth.ts";
import useModalStore from "../../store/useModalStore.ts";
import {useShallow} from "zustand/react/shallow";

function GoogleAuth(): JSX.Element {
  const googleLoginRef = useRef<HTMLDivElement>(null);
  const openModal = useModalStore(useShallow(state => state.openModal))

  const [isPending, setIsPending] = useState<boolean>(false);

  const login = (credentialResponse: CredentialResponse) => {
    setIsPending(true);
    if (!credentialResponse.credential) return;
    const requestBody: GoogleAuthBody = {
      token: credentialResponse.credential
    }
    const requestBodyParsed = GoogleAuthBodyZod.safeParse(requestBody);
    if (!requestBodyParsed.success) {
      openModal({
        content: 'Logowanie nie powiodło się',
        onClose: () => setIsPending(false),
      });
      return;
    }

    googleAuth(requestBodyParsed.data)
      .then(response => {
        openModal({
          content: 'Zalogowano pomyślnie',
          onClose: () => {
            setIsPending(false);
          },
        })
        console.log('Login successful', response);
      })
      .catch(error => {
        console.error(error);
      })
  }

  const triggerGoogleLogin = () => {
    const button = googleLoginRef.current?.querySelector('div[role="button"]') as HTMLElement;
    if (button) {
      button.click();
    }
  }

  return <div className={styles.googleAuth}>
    <InlineHotkey hotkeyFunction={triggerGoogleLogin} hotkeyKey={'G'} letterIndex={1} isBlocked={isPending}>
      Zaloguj się przez Google
    </InlineHotkey>
    <div ref={googleLoginRef} className={styles.googleButton}>
      <GoogleLogin onSuccess={login} onError={() => console.log('Login Failed')}/>
    </div>
  </div>
}

export default GoogleAuth;