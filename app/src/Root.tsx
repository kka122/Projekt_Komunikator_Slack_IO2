import {Outlet} from "react-router";
import {type JSX} from "react";

function Root(): JSX.Element {
  return <>
    <Outlet/>
  </>
}

export default Root