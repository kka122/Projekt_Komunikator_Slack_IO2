import {type JSX} from "react";
import {GoogleLogin} from "@react-oauth/google";

function LoginScreen(): JSX.Element {
  return <>
    <GoogleLogin onSuccess={credentialResponse => {
      console.log(credentialResponse)
    }} onError={() => {
      console.log("Login Failed")
    }}/>
  </>
}

export default LoginScreen