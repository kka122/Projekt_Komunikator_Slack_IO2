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

/**
 * Query for the signed-in user. Fetches `/users/me`, validates it with zod, and
 * mirrors the result into the global user store so synchronous consumers
 * (avatars, route guards) stay in sync.
 */
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

/**
 * Mutation that updates the current user's profile (name, status, avatar, …).
 * On success it refetches `/users/me`, refreshes the user store and invalidates
 * the cached profile.
 */
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

/** Mutation that permanently deletes the account and clears local identity. */
export function useDeleteAccount() {
  const setUser = useUserStore((s) => s.setUser);

  return useMutation({
    mutationFn: () => deleteCurrentUserAccount(),
    onSuccess: () => setUser(null),
  });
}

/**
 * Query that searches users by email regex (used when inviting members).
 * Disabled while `emailRegex` is blank so it never fires an empty search.
 *
 * @param emailRegex - Email substring/pattern to match.
 */
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
