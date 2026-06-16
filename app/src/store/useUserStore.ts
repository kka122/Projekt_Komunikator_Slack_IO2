import {create} from 'zustand'
import type {User} from "../api/models";

/** State held by {@link useUserStore}. */
interface UserStoreData {
  /** The currently signed-in user, or `null` when logged out. */
  user: User | null;
}

/** Actions exposed by {@link useUserStore}. */
interface UserStoreActions {
  /** Replace the current user (pass `null` to clear on logout). */
  setUser: (user: User | null) => void;
}

/**
 * Global identity store (zustand). Mirrors the `/users/me` result so synchronous
 * consumers (avatars, route guards) can read the user without re-querying. Kept
 * in sync by the user data hooks in `data/user.ts`.
 */
const useUserStore = create<UserStoreData & UserStoreActions>((set) => ({
  user: null,

  setUser: (user) => set({user}),
}))

export default useUserStore;