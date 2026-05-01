import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Venue, Page, Person, Group, Zone, SortMode, VenueType, VenueConfig } from '../types'
import { autoAssign } from '../utils/autoAssign'

const GROUP_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface VenueStore {
  venues: Venue[]
  activeVenueId: string | null
  activePage: Page

  setActivePage: (page: Page) => void
  setActiveVenue: (id: string) => void

  createVenue: (name: string, type: VenueType, config: VenueConfig) => string
  updateVenue: (id: string, updates: Partial<Venue>) => void
  deleteVenue: (id: string) => void

  addPerson: (venueId: string, name: string, rank: number, groupId: string) => void
  updatePerson: (venueId: string, personId: string, updates: Partial<Person>) => void
  deletePerson: (venueId: string, personId: string) => void

  addGroup: (venueId: string, name: string, zone: Zone, sortMode: SortMode) => void
  updateGroup: (venueId: string, groupId: string, updates: Partial<Group>) => void
  deleteGroup: (venueId: string, groupId: string) => void

  bulkImportPeople: (venueId: string, entries: { name: string; rank: number }[], groupId: string, label?: string) => void
  bulkDeletePeople: (venueId: string, personIds: string[]) => void
  bulkUpdateZone: (venueId: string, personIds: string[], groupId: string) => void
  reorderPeople: (venueId: string, groupId: string, orderedIds: string[]) => void
  runAutoAssign: (venueId: string) => void
  swapSeats: (venueId: string, seatA: string, seatB: string) => void
  clearAssignments: (venueId: string) => void
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function now() {
  return new Date().toISOString()
}

export const useVenueStore = create<VenueStore>()(
  persist(
    (set, get) => ({
      venues: [],
      activeVenueId: null,
      activePage: 'venues',

      setActivePage: (page) => set({ activePage: page }),

      setActiveVenue: (id) => set({ activeVenueId: id }),

      createVenue: (name, type, config) => {
        const id = uid()
        const isRound = type === 'circle' || type === 'ellipse'

        const groups: Group[] = isRound
          ? [{ id: uid(), name: '参会人员', zone: 'all', sortMode: 'center-alternating', color: GROUP_COLORS[0] }]
          : [
              { id: uid(), name: '台上嘉宾组', zone: 'stage', sortMode: 'center-alternating', color: GROUP_COLORS[0] },
              { id: uid(), name: '参会人员组', zone: 'floor', sortMode: 'center-alternating', color: GROUP_COLORS[1] },
            ]

        const venue: Venue = {
          id,
          name,
          type,
          config,
          groups,
          people: [],
          assignments: {},
          createdAt: now(),
          updatedAt: now(),
        }
        set(s => ({ venues: [...s.venues, venue], activeVenueId: id }))
        return id
      },

      updateVenue: (id, updates) => {
        set(s => ({
          venues: s.venues.map(v =>
            v.id === id ? { ...v, ...updates, updatedAt: now() } : v
          ),
        }))
      },

      deleteVenue: (id) => {
        set(s => ({
          venues: s.venues.filter(v => v.id !== id),
          activeVenueId: s.activeVenueId === id ? null : s.activeVenueId,
        }))
      },

      addPerson: (venueId, name, rank, groupId) => {
        const person: Person = { id: uid(), name, rank, groupId }
        set(s => ({
          venues: s.venues.map(v =>
            v.id === venueId
              ? { ...v, people: [...v.people, person], updatedAt: now() }
              : v
          ),
        }))
      },

      updatePerson: (venueId, personId, updates) => {
        set(s => ({
          venues: s.venues.map(v =>
            v.id === venueId
              ? {
                  ...v,
                  people: v.people.map(p => (p.id === personId ? { ...p, ...updates } : p)),
                  updatedAt: now(),
                }
              : v
          ),
        }))
      },

      deletePerson: (venueId, personId) => {
        set(s => ({
          venues: s.venues.map(v =>
            v.id === venueId
              ? {
                  ...v,
                  people: v.people.filter(p => p.id !== personId),
                  assignments: Object.fromEntries(
                    Object.entries(v.assignments).filter(([, pid]) => pid !== personId)
                  ),
                  updatedAt: now(),
                }
              : v
          ),
        }))
      },

      addGroup: (venueId, name, zone, sortMode) => {
        const colorIdx = get().venues.find(v => v.id === venueId)?.groups.length ?? 0
        const group: Group = {
          id: uid(),
          name,
          zone,
          sortMode,
          color: GROUP_COLORS[colorIdx % GROUP_COLORS.length],
        }
        set(s => ({
          venues: s.venues.map(v =>
            v.id === venueId
              ? { ...v, groups: [...v.groups, group], updatedAt: now() }
              : v
          ),
        }))
      },

      updateGroup: (venueId, groupId, updates) => {
        set(s => ({
          venues: s.venues.map(v =>
            v.id === venueId
              ? {
                  ...v,
                  groups: v.groups.map(g => (g.id === groupId ? { ...g, ...updates } : g)),
                  updatedAt: now(),
                }
              : v
          ),
        }))
      },

      deleteGroup: (venueId, groupId) => {
        set(s => ({
          venues: s.venues.map(v =>
            v.id === venueId
              ? { ...v, groups: v.groups.filter(g => g.id !== groupId), updatedAt: now() }
              : v
          ),
        }))
      },

      bulkDeletePeople: (venueId, personIds) => {
        const idSet = new Set(personIds)
        set(s => ({
          venues: s.venues.map(v =>
            v.id !== venueId ? v : {
              ...v,
              people: v.people.filter(p => !idSet.has(p.id)),
              assignments: Object.fromEntries(
                Object.entries(v.assignments).filter(([, pid]) => !idSet.has(pid))
              ),
              updatedAt: now(),
            }
          ),
        }))
      },

      bulkImportPeople: (venueId, entries, groupId, label) => {
        const newPeople: Person[] = entries.map(e => ({
          id: uid(), name: e.name, rank: e.rank, groupId,
          ...(label ? { label } : {}),
        }))
        set(s => ({
          venues: s.venues.map(v =>
            v.id === venueId
              ? { ...v, people: [...v.people, ...newPeople], updatedAt: now() }
              : v
          ),
        }))
      },

      bulkUpdateZone: (venueId, personIds, groupId) => {
        const idSet = new Set(personIds)
        set(s => ({
          venues: s.venues.map(v =>
            v.id !== venueId ? v : {
              ...v,
              people: v.people.map(p => idSet.has(p.id) ? { ...p, groupId } : p),
              updatedAt: now(),
            }
          ),
        }))
      },

      reorderPeople: (venueId, groupId, orderedIds) => {
        set(s => ({
          venues: s.venues.map(v => {
            if (v.id !== venueId) return v
            const updated = v.people.map(p => {
              if (p.groupId !== groupId) return p
              const idx = orderedIds.indexOf(p.id)
              return idx === -1 ? p : { ...p, rank: idx + 1 }
            })
            // re-run auto-assign so canvas reflects new order immediately
            const nextVenue = { ...v, people: updated }
            const assignments = autoAssign(nextVenue)
            return { ...nextVenue, assignments, updatedAt: now() }
          }),
        }))
      },

      runAutoAssign: (venueId) => {
        const venue = get().venues.find(v => v.id === venueId)
        if (!venue) return
        const assignments = autoAssign(venue)
        set(s => ({
          venues: s.venues.map(v =>
            v.id === venueId ? { ...v, assignments, updatedAt: now() } : v
          ),
        }))
      },

      swapSeats: (venueId, seatA, seatB) => {
        set(s => ({
          venues: s.venues.map(v => {
            if (v.id !== venueId) return v
            const a = v.assignments[seatA]
            const b = v.assignments[seatB]
            const next = { ...v.assignments }
            if (a) next[seatB] = a; else delete next[seatB]
            if (b) next[seatA] = b; else delete next[seatA]
            return { ...v, assignments: next, updatedAt: now() }
          }),
        }))
      },

      clearAssignments: (venueId) => {
        set(s => ({
          venues: s.venues.map(v =>
            v.id === venueId ? { ...v, assignments: {}, updatedAt: now() } : v
          ),
        }))
      },
    }),
    { name: 'venue-seating-store' }
  )
)
