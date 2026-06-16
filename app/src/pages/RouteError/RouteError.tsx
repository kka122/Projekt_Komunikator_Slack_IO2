import {type JSX} from "react";
import {useRouteError} from "react-router";
import AnimatedMain from "../../components/AnimatedMain/AnimatedMain.tsx";

/**
 * Root route error boundary (`errorElement`). Renders the thrown error's message
 * and a link home. Uses a plain `<a>` rather than `useNavigate`, so it stays
 * safe even when the error happens above the navigation context.
 */
function RouteError(): JSX.Element {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : "Something went wrong.";

  return (
    <AnimatedMain>
      <h1><span className="primary">Oops</span></h1>
      <p className="muted">{message}</p>
      <a href="/">Back home</a>
    </AnimatedMain>
  );
}

export default RouteError;
