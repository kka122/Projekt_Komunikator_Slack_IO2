import {type FormEvent, type JSX, useState} from "react";
import {useNavigate} from "react-router";
import {useShallow} from "zustand/react/shallow";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";
import GoogleAuth from "../../components/GoogleAuth/GoogleAuth.tsx";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";
import Field from "../../components/Field/Field.tsx";
import FileField from "../../components/FileField/FileField.tsx";
import HintBar from "../../components/HintBar/HintBar.tsx";
import {RegisterUserBody} from "../../api/endpoints/auth/auth.zod.ts";
import {useRegister} from "../../data/auth.ts";
import useModalStore from "../../store/useModalStore.ts";
import styles from "./RegisterPage.module.css";

function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const register = useRegister();
  const openModal = useModalStore(useShallow((state) => state.openModal));

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (register.isPending) return;

    const parsed = RegisterUserBody.safeParse({
      name,
      surname,
      email,
      password,
      avatar: avatar ?? undefined,
    });
    if (!parsed.success) {
      openModal({content: "Please fill every field with a valid value."});
      return;
    }

    register.mutate(parsed.data, {
      onSuccess: () =>
        openModal({
          content: "Account created. You can log in now.",
          onClose: () => navigate("/auth/login"),
        }),
      onError: () =>
        openModal({content: "Registration failed. The email may already be in use."}),
    });
  }

  return (
    <AnimatedMain>
      <h2>Join our community</h2>
      <form className="form" onSubmit={submit}>
        <Field label="Name" hotkeyKey="N" value={name} onChange={setName} autoComplete="given-name"/>
        <Field label="Surname" hotkeyKey="S" value={surname} onChange={setSurname} autoComplete="family-name"/>
        <Field label="Email" hotkeyKey="E" type="email" value={email} onChange={setEmail} autoComplete="email"/>
        <Field label="Password" hotkeyKey="P" type="password" value={password} onChange={setPassword} autoComplete="new-password"/>
        <FileField label="Avatar" hotkeyKey="A" file={avatar} onChange={setAvatar}/>
        <InlineHotkey hotkeyFunction={submit} hotkeyKey="R" className="submit" isBlocked={register.isPending}>
          {register.isPending ? "Creating account..." : "Register"}
        </InlineHotkey>
      </form>
      <GoogleAuth/>
      <p className={styles.switch}>
        Already have an account?{" "}
        <InlineHotkey hotkeyFunction={() => navigate("/auth/login")} hotkeyKey="L">
          Login
        </InlineHotkey>
      </p>
      <HintBar>
        <InlineHotkey hotkeyFunction={() => navigate("/")} hotkeyKey="H">Home</InlineHotkey>
      </HintBar>
    </AnimatedMain>
  );
}

export default RegisterPage;
