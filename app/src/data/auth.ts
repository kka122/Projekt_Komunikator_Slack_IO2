import {useMutation, useQueryClient} from "@tanstack/react-query";
import {loginUser, logoutUser, registerUser} from "../api/endpoints/auth/auth.ts";
import type {LoginBody, RegisterBody} from "../api/models";
import useUserStore from "../store/useUserStore.ts";

/**
 * Mutation that logs in with email/password. On success the backend sets the
 * auth cookies; callers typically navigate to the workspaces screen.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginBody) => loginUser(data),
    // Drop any cache left from a previous session so a new account never sees
    // the prior user's workspaces, channels, chats or profile.
    onSuccess: () => queryClient.clear(),
  });
}

/** Mutation that registers a new account from a {@link RegisterBody}. */
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterBody) => registerUser(data),
  });
}

/**
 * Mutation that logs the user out. Regardless of the network outcome it clears
 * local identity (user store + cached `/users/me`) so the UI drops to a
 * logged-out state immediately.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const setUser = useUserStore((s) => s.setUser);

  return useMutation({
    mutationFn: () => logoutUser(),
    onSettled: () => {
      // Clear identity + all cached data regardless of network outcome, so the
      // next account doesn't inherit this user's workspaces/channels/chats.
      setUser(null);
      queryClient.clear();
    },
  });
}
