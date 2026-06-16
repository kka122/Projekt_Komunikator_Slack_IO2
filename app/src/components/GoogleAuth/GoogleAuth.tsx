import {type JSX, useRef, useState} from "react";
import {type CredentialResponse, GoogleLogin} from "@react-oauth/google";
import styles from './GoogleAuth.module.css'
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import type {GoogleAuthBody} from "../../api/models";
import {GoogleAuthBody as GoogleAuthBodyZod} from "../../api/endpoints/auth/auth.zod.ts";
import {googleAuth} from "../../api/endpoints/auth/auth.ts";
import useModalStore from "../../store/useModalStore.ts";
import {useShallow} from "zustand/react/shallow";
import {GetCurrentUserProfileResponse} from "../../api/endpoints/user/user.zod.ts";
import useUserStore from "../../store/useUserStore.ts";
import {useNavigate} from "react-router";
import {getCurrentUserProfile} from "../../api/endpoints/user/user.ts";

/**
 * Google sign-in control. Renders Google's own login button (hidden behind an
 * {@link InlineHotkey} so the `[G]` shortcut triggers it) and, on a successful
 * credential, calls the backend `googleAuth` endpoint, fetches the profile,
 * stores the user and redirects to `/workspaces`. Errors surface through the
 * global modal.
 */
function GoogleAuth(): JSX.Element {
  const googleLoginRef = useRef<HTMLDivElement>(null);
  const openModal = useModalStore(useShallow(state => state.openModal))
  const setUser = useUserStore(useShallow(state => state.setUser))
  const navigate = useNavigate();

  const [isPending, setIsPending] = useState<boolean>(false);

  function loginSuccess() {
    openModal({
      content: 'Logged in successfully.',
      onClose: () => {
        setIsPending(false)
        navigate('/workspaces')
      },
    })
  }

  function loginError() {
    openModal({
      content: 'An error occurred during login. Please try again.',
      onClose: () => setIsPending(false),
    });
  }

  function login(credentialResponse: CredentialResponse) {
    setIsPending(true);
    if (!credentialResponse.credential) return;

    const requestBody: GoogleAuthBody = {
      token: credentialResponse.credential
    }

    const requestBodyParsed = GoogleAuthBodyZod.safeParse(requestBody);
    if (!requestBodyParsed.success) {
      loginError();
      console.log('Validation error:', requestBodyParsed.error);
      return;
    }

    googleAuth(requestBodyParsed.data)
      .then(response => {
        if (response.status !== 200 && response.status !== 201) {
          loginError();
          console.log('Login error:', response.statusText);
          return
        }

        getCurrentUserProfile().then(profileResponse => {
          const userParsed = GetCurrentUserProfileResponse.safeParse(profileResponse.data);
          if (!userParsed.success) {
            loginError();
            console.log('User data validation error:', userParsed.error);
            return
          }

          console.log('Login successful, user profile retrieved:', userParsed.data.user);
          setUser(userParsed.data.user);
          loginSuccess();
        }).catch(error => {
          loginError();
          console.log('Profile retrieval error:', error);
        })
      })
      .catch(error => {
        loginError();
        console.log('Login error:', error);
      })
  }

  function triggerGoogleLogin() {
    const button = googleLoginRef.current?.querySelector('div[role="button"]') as HTMLElement;
    if (button) {
      button.click();
    }
  }

  return <div className={styles.googleAuth}>
    <InlineHotkey hotkeyFunction={triggerGoogleLogin} hotkeyKey={'G'} letterIndex={1} isBlocked={isPending}>
      Sign in with Google
    </InlineHotkey>
    <div ref={googleLoginRef} className={styles.googleButton}>
      <GoogleLogin onSuccess={login} onError={() => console.log('Login Failed')}/>
    </div>
  </div>
}

export default GoogleAuth;