import {type JSX} from "react";
import {useGoogleLogin} from "@react-oauth/google";
import styles from './GoogleAuth.module.css'
import InlineHotkey from "../HotkeyText/InlineHotkey.tsx";

function GoogleAuth(): JSX.Element {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
    },
  })

  return <div className={styles.googleAuth}>
    <InlineHotkey hotkeyFunction={login} hotkeyKey={'G'} letterIndex={1}>
      Zaloguj się przez Google
    </InlineHotkey>
  </div>
}

export default GoogleAuth;