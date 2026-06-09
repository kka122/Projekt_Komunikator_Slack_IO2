import {create} from 'zustand'
import type {User} from "../api/models";

interface UserStoreData {
  user: User | null;
}

interface UserStoreActions {
  setUser: (user: User | null) => void;
}

const useUserStore = create<UserStoreData & UserStoreActions>((set) => ({
  user: null,

  setUser: (user) => set({user}),
}))

export default useUserStore;