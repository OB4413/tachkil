# Component Studio

The hardest requirements are preserving preview/export equivalence, mapping a library's finite prop schema and examples, structured drops, and keeping file/process privileges separate from components.

Modules: `src/model.ts` owns the versioned tree, validation and immutable operations; `src/catalog.ts` describes supported components and variants; `src/renderer.tsx` renders real library components; `src/export.ts` serializes the supported tree into JSX using the TypeScript AST; `src/desktop.ts` exposes dialog-based commands; `src-tauri` owns native filesystem operations. Editor selection, history and viewport are transient.

Nodes have stable IDs, a qualified component ID, serializable props, base layout and breakpoint overrides, and children. Catalog descriptors declare import names, props, variants, sizes and child support. Structural nodes use CSS Flexbox and Grid. Drops append into a selected/hovered container; explicit layer controls reorder nodes without using pixel coordinates. Cycles and leaf nesting are rejected.

Bundled, trusted library implementations render in the editor. Arbitrary user component code is not loaded. Future imported code needs a separate preview origin with no Tauri IPC. A general package installer must run fixed commands in a generated workspace after approval; arbitrary commands from metadata are never accepted.

Priority: desktop persistence and schema; tree editing/history; supported real library catalogs; generated Vite projects and build checks; broader catalog and managed registry installation; Next.js and isolated custom imports. Availability in the editor is distinct from installing dependencies into an external project. Do not label unsupported catalog components as installed.
