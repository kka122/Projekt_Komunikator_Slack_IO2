import type {JSX} from "react";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";
import {useNavigate} from "react-router";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";
import styles from './HomePage.module.css'

function HomePage(): JSX.Element {
  const navigate = useNavigate();

  function goToLoginPage() {
    navigate("/auth/login");
  }

  function goToRegisterPage() {
    navigate("/auth/register");
  }

  return <AnimatedMain className={styles.homePage}>
    <h1><span className={'primary'}>Szponcik</span>, communicator for true nerds!</h1>
    <ul className={'large'}>
      <li>
        <InlineHotkey hotkeyFunction={goToLoginPage} hotkeyKey={"L"}>Login</InlineHotkey>
      </li>
      <li>
        <InlineHotkey hotkeyFunction={goToRegisterPage} hotkeyKey={"R"}>Register</InlineHotkey>
      </li>
    </ul>
  </AnimatedMain>
}

export default HomePage