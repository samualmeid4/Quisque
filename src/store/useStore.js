import { create } from 'zustand'

export const useStore = create((set) => ({
  user: null,
  profile: null,
  tenantId: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile, tenantId: profile?.tenant_id }),
  logout: () => set({ user: null, profile: null, tenantId: null }),
}))
