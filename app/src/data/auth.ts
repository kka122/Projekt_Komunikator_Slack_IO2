import {useMutation, useQueryClient} from "@tanstack/react-query";
import {loginUser, logoutUser, registerUser} from "../api/endpoints/auth/auth.ts";
import type {LoginBody, RegisterBody} from "../api/models";
import {qk} from "./keys.ts";
import useUserStore from "../store/useUserStore.ts";

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginBody) => loginUser(data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterBody) => registerUser(data),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const setUser = useUserStore((s) => s.setUser);

  return useMutation({
    mutationFn: () => logoutUser(),
    onSettled: () => {
      // Clear identity locally regardless of network outcome.
      setUser(null);
      queryClient.removeQueries({queryKey: qk.me});
    },
  });
}
