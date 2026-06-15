import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
  deleteCurrentUserAccount,
  getCurrentUserProfile,
  getUserProfileByEmail,
  updateCurrentUserProfile,
} from "../api/endpoints/user/user.ts";
import {
  GetCurrentUserProfileResponse,
  GetUserProfileByEmailResponse,
} from "../api/endpoints/user/user.zod.ts";
import type {UpdateCurrentUserProfileBody, User} from "../api/models";
import {qk} from "./keys.ts";
import useUserStore from "../store/useUserStore.ts";

// Fetches /users/me, validates with zod, and mirrors the result into the
// global user store so synchronous consumers (avatars, guards) stay in sync.
export function useCurrentUser() {
  const setUser = useUserStore((s) => s.setUser);

  return useQuery({
    queryKey: qk.me,
    queryFn: async (): Promise<User> => {
      const response = await getCurrentUserProfile();
      const parsed = GetCurrentUserProfileResponse.parse(response.data);
      setUser(parsed.user);
      return parsed.user;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useUserStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: UpdateCurrentUserProfileBody) =>
      updateCurrentUserProfile(data),
    onSuccess: async () => {
      const response = await getCurrentUserProfile();
      const parsed = GetCurrentUserProfileResponse.parse(response.data);
      setUser(parsed.user);
      await queryClient.invalidateQueries({queryKey: qk.me});
    },
  });
}

export function useDeleteAccount() {
  const setUser = useUserStore((s) => s.setUser);

  return useMutation({
    mutationFn: () => deleteCurrentUserAccount(),
    onSuccess: () => setUser(null),
  });
}

// Lookup used when inviting members. `emailRegex` empty => disabled.
export function useUserSearch(emailRegex: string) {
  return useQuery({
    queryKey: qk.userSearch(emailRegex),
    enabled: emailRegex.trim().length > 0,
    queryFn: async (): Promise<User[]> => {
      const response = await getUserProfileByEmail(emailRegex);
      return GetUserProfileByEmailResponse.parse(response.data).users;
    },
  });
}
