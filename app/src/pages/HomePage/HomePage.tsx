import type {JSX} from "react";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";
import {useNavigate} from "react-router";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";
import styles from './HomePage.module.css'

/**
 * Public landing page (`/`). Pitches the keyboard-first product and offers
 * hotkey links to login, register or jump straight into the workspaces app.
 */
function HomePage(): JSX.Element {
  const navigate = useNavigate();

  function goToLoginPage() {
    navigate("/auth/login");
  }

  function goToRegisterPage() {
    navigate("/auth/register");
  }

  function goToWorkspaces() {
    navigate("/workspaces");
  }

  return <AnimatedMain className={styles.homePage}>
    <h1><span className={'primary'}>Szponcik</span>, communicator for true nerds!</h1>
    <p className={'muted'}>Keyboard-first chat. Every action has a [key] — no mouse required.</p>
    <ul className={'large'}>
      <li>
        <InlineHotkey hotkeyFunction={goToLoginPage} hotkeyKey={"L"}>Login</InlineHotkey>
      </li>
      <li>
        <InlineHotkey hotkeyFunction={goToRegisterPage} hotkeyKey={"R"}>Register</InlineHotkey>
      </li>
      <li>
        <InlineHotkey hotkeyFunction={goToWorkspaces} hotkeyKey={"O"}>Open app</InlineHotkey>
      </li>
    </ul>
  </AnimatedMain>
}

export default HomePage