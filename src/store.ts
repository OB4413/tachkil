import { create } from "zustand";
import { newProject, type Project } from "./model";
type State = {
  project: Project;
  selected: string;
  past: Project[];
  future: Project[];
  dirty: boolean;
  edit: (fn: (p: Project) => void) => void;
  select: (id: string) => void;
  load: (p: Project) => void;
  undo: () => void;
  redo: () => void;
};
const start = newProject("My dashboard", "shadcn");
export const useStudio = create<State>((set) => ({
  project: start,
  selected: start.root.id,
  past: [],
  future: [],
  dirty: false,
  edit: (fn) =>
    set((s) => {
      const p = structuredClone(s.project);
      fn(p);
      if (JSON.stringify(p) === JSON.stringify(s.project)) return s;
      return {
        project: p,
        past: [...s.past.slice(-99), s.project],
        future: [],
        dirty: true,
      };
    }),
  select: (selected) => set({ selected }),
  load: (project) =>
    set({
      project,
      selected: project.root.id,
      past: [],
      future: [],
      dirty: false,
    }),
  undo: () =>
    set((s) =>
      s.past.length
        ? {
            project: s.past[s.past.length - 1],
            past: s.past.slice(0, -1),
            future: [s.project, ...s.future],
            dirty: true,
          }
        : s,
    ),
  redo: () =>
    set((s) =>
      s.future.length
        ? {
            project: s.future[0],
            past: [...s.past, s.project],
            future: s.future.slice(1),
            dirty: true,
          }
        : s,
    ),
}));
