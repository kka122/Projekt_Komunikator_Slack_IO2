import {type JSX, useRef, type KeyboardEvent} from "react";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";
import GoogleAuth from "../../components/GoogleAuth/GoogleAuth.tsx";
import InlineHotkey from "../../components/InlineHotkey/InlineHotkey.tsx";

function RegisterPage(): JSX.Element {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const surnameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter':
      case 'Escape':
        e.preventDefault();
        if (document.activeElement instanceof HTMLInputElement)
          document.activeElement.blur();
        break;
    }
  }

  return <AnimatedMain>
    <h2>Join our community</h2>
    <form className={'form'}>
      <label>
        <InlineHotkey hotkeyFunction={() => {
          if (nameInputRef.current) {
            nameInputRef.current.focus();
          }
        }} hotkeyKey={'N'}>Name</InlineHotkey>
      </label>
      <input type="text" ref={nameInputRef} onKeyDown={onKeyDown}/>
      <label>
        <InlineHotkey hotkeyFunction={() => {
          if (surnameInputRef.current) {
            surnameInputRef.current.focus();
          }
        }} hotkeyKey={'S'}>Surname</InlineHotkey>
      </label>
      <input type="text" ref={surnameInputRef} onKeyDown={onKeyDown}/>
      <label>
        <InlineHotkey hotkeyFunction={() => {
          if (emailInputRef.current) {
            emailInputRef.current.focus();
          }
        }} hotkeyKey={'E'}>Email</InlineHotkey>
      </label>
      <input type="email" ref={emailInputRef} onKeyDown={onKeyDown}/>
      <label>
        <InlineHotkey hotkeyFunction={() => {
          if (passwordInputRef.current) {
            passwordInputRef.current.focus();
          }
        }} hotkeyKey={'P'}>Password</InlineHotkey>
      </label>
      <input type="password" ref={passwordInputRef} onKeyDown={onKeyDown}/>
      <label>
        <InlineHotkey hotkeyFunction={() => {
          if (avatarInputRef.current) {
            avatarInputRef.current.click();
          }
        }} hotkeyKey={'A'}>Avatar</InlineHotkey>
      </label>
      <input type="file" ref={avatarInputRef} onKeyDown={onKeyDown}/>
      <InlineHotkey hotkeyFunction={() => {
      }} hotkeyKey={'R'} className={'submit'}>Register</InlineHotkey>
    </form>
    <GoogleAuth/>
  </AnimatedMain>
}

export default RegisterPage;