import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Gender = 'male' | 'female' | 'other'
export type Preference = 'male' | 'female' | 'any'
export type CallMode = 'random' | 'duo' | 'group'

interface UserProfile {
  name: string
  age: number
  gender: Gender
  preference: Preference
  callMode: CallMode
}

interface UserState {
  profile: UserProfile | null
  isOnboarded: boolean
  setProfile: (profile: UserProfile) => void
  updateCallMode: (mode: CallMode) => void
  clearProfile: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isOnboarded: false,
      
      setProfile: (profile) => set({ 
        profile, 
        isOnboarded: true 
      }),
      
      updateCallMode: (mode) => set((state) => ({
        profile: state.profile ? { ...state.profile, callMode: mode } : null
      })),
      
      clearProfile: () => set({ 
        profile: null, 
        isOnboarded: false 
      }),
    }),
    {
      name: 'vox-user-profile',
    }
  )
)
