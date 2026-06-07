import type {JSX} from "react";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";
import {useNavigate} from "react-router";
import InlineHotkey from "../../components/HotkeyText/InlineHotkey.tsx";

function HomePage(): JSX.Element {
  const navigate = useNavigate();

  function goToLoginPage() {
    navigate("/auth/login");
  }

  function goToRegisterPage() {
    navigate("/auth/register");
  }

  return <AnimatedMain>
    <h1>Szponcik</h1>
    <h2>Komunikator dla prawdziwych nerdów!</h2>
    <ul>
      <li>
        <InlineHotkey hotkeyFunction={goToLoginPage} hotkeyKey={"Z"}/>
        aloguj
      </li>
      <li>
        Za
        <InlineHotkey hotkeyFunction={goToRegisterPage} hotkeyKey={"R"}/>
        ejestruj
      </li>
    </ul>
  </AnimatedMain>
}

export default HomePage