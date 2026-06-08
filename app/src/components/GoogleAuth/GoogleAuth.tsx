import {type JSX} from "react";
import {useGoogleLogin} from "@react-oauth/google";
import styles from './GoogleAuth.module.css'
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
// import type {GoogleAuthRequestBody} from "../../api/models";

function GoogleAuth(): JSX.Element {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log(tokenResponse);
      // const requestBody: GoogleAuthRequestBody = {
      //   token: tokenResponse.access_token,
      // }
      // const requestBodyParsed =
    },
  })

  return <div className={styles.googleAuth}>
    <InlineHotkey hotkeyFunction={login} hotkeyKey={'G'} letterIndex={1}>
      Zaloguj się przez Google
    </InlineHotkey>
  </div>
}

export default GoogleAuth;