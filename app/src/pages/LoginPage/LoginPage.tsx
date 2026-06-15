import {type FormEvent, type JSX, useState} from "react";
import {useNavigate} from "react-router";
import {useShallow} from "zustand/react/shallow";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";
import GoogleAuth from "../../components/GoogleAuth/GoogleAuth.tsx";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";
import Field from "../../components/Field/Field.tsx";
import HintBar from "../../components/HintBar/HintBar.tsx";
import {LoginUserBody} from "../../api/endpoints/auth/auth.zod.ts";
import {useLogin} from "../../data/auth.ts";
import useModalStore from "../../store/useModalStore.ts";
import styles from "./LoginPage.module.css";

function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const login = useLogin();
  const openModal = useModalStore(useShallow((state) => state.openModal));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (login.isPending) return;

    const parsed = LoginUserBody.safeParse({email, password});
    if (!parsed.success) {
      openModal({content: "Enter a valid email and password."});
      return;
    }

    login.mutate(parsed.data, {
      onSuccess: () => navigate("/workspaces"),
      onError: () =>
        openModal({content: "Login failed. Check your credentials and try again."}),
    });
  }

  return (
    <AnimatedMain>
      <h2>Welcome back</h2>
      <form className="form" onSubmit={submit}>
        <Field label="Email" hotkeyKey="E" type="email" value={email} onChange={setEmail} autoComplete="email"/>
        <Field label="Password" hotkeyKey="P" type="password" value={password} onChange={setPassword} autoComplete="current-password"/>
        <InlineHotkey hotkeyFunction={submit} hotkeyKey="L" className="submit" isBlocked={login.isPending}>
          {login.isPending ? "Logging in..." : "Login"}
        </InlineHotkey>
      </form>
      <GoogleAuth/>
      <p className={styles.switch}>
        No account?{" "}
        <InlineHotkey hotkeyFunction={() => navigate("/auth/register")} hotkeyKey="R">
          Register
        </InlineHotkey>
      </p>
      <HintBar>
        <InlineHotkey hotkeyFunction={() => navigate("/")} hotkeyKey="H">Home</InlineHotkey>
      </HintBar>
    </AnimatedMain>
  );
}

export default LoginPage;
