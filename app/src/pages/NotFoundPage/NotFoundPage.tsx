import {type JSX} from "react";
import {useNavigate} from "react-router";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";

function NotFoundPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <AnimatedMain>
      <h1><span className="primary">404</span></h1>
      <p className="muted">This page wandered off.</p>
      <InlineHotkey hotkeyFunction={() => navigate("/")} hotkeyKey="H">Home</InlineHotkey>
    </AnimatedMain>
  );
}

export default NotFoundPage;
