import {type JSX} from "react";
import {Navigate, Outlet} from "react-router";
import {useShallow} from "zustand/react/shallow";
import useUserStore from "../store/useUserStore.ts";
import {useCurrentUser} from "../data/user.ts";
import Loader from "../components/Loader/Loader.tsx";

/**
 * Auth guard rendered as a pathless layout route. Confirms there is a logged-in
 * user — from the store, or by validating the session against `/users/me` —
 * before rendering protected routes via `<Outlet>`. Shows a loader while the
 * check is in flight and redirects to `/auth/login` on failure.
 */
function RequireAuth(): JSX.Element {
  const user = useUserStore(useShallow((state) => state.user));
  const query = useCurrentUser();

  if (user || query.isSuccess) {
    return <Outlet/>;
  }

  if (query.isLoading) {
    return (
      <div style={{display: "flex", justifyContent: "center", padding: "3rem"}}>
        <Loader label="authenticating"/>
      </div>
    );
  }

  return <Navigate to="/auth/login" replace/>;
}

export default RequireAuth;
