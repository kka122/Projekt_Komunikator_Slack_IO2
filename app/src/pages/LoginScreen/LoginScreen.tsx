import {type JSX} from "react";
import {GoogleLogin} from "@react-oauth/google";

function LoginScreen(): JSX.Element {
  return <>
    <GoogleLogin onSuccess={credentialResponse => {
      console.log(credentialResponse)
      fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: credentialResponse.credential
        })
      }).then(res => {
        if (res.ok) {
          console.log("Login Successful")
        } else {
          console.log("Login Failed")
        }
      }).catch(() => {
        console.log("Login Failed")
      })
    }} onError={() => {
      console.log("Login Failed")
    }}/>
  </>
}

export default LoginScreen