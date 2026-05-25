import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type WorkspaceStore = {
  activeWorkspaceId: string | null
  setActiveWorkspaceId: (id: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
    }),
    { name: 'insforge-admin.workspace' },
  ),
)
