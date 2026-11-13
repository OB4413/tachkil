# Architecture

This application ships one reviewed shadcn edition: Radix / New York v4. Installed project code is never evaluated in the privileged Tauri window.

- `catalog.ts`: typed component property schemas, editable fields, finite example axes, search and explicit coverage gaps. Button and Link are separate semantic compositions; no fake library Link implementation is presented.
- `recipes.ts`: trusted component compositions represented as structured elements. Preview and export consume exactly the same recipe, including slots, labels, icons, native input types and interactive structure.
- `renderer.tsx`: an explicit module allowlist resolves recipes to actual bundled components. Preview boundaries report rendering errors instead of silently substituting HTML.
- `components/ui/`: official registry source with relative import adjustments. `studio-menu-checkbox.tsx` provides stateful compositions around real menu items. `registry-snapshot.json` records source provenance and local hashes.
- `model.ts`: versioned serializable trees, prop validation, immutable-operation helpers, cycle rejection and backward migration of the prior shadcn Button icon flag. Non-shadcn projects are explicitly unsupported in this edition.
- `store.ts`: bounded document undo/redo separated from transient editor state.
- `CatalogPanel.tsx`, `Properties.tsx`, `canvas.tsx`: searchable examples, schema-driven property editing and document-flow layout. All matched examples remain available; CSS defers offscreen layout. Native HTML drag payloads contain validated props, never JSX or executable code.
- `export.ts`: TypeScript AST generation from shared recipes, Prettier formatting, recursive local-source dependency collection, and native Vite/Tailwind project output. The compiler/formatter chunk loads on demand. Exported dependency versions match the editor's declared versions.
- `src-tauri`: native dialogs, atomic project saving, new-directory exports and fixed approved installation commands. Export filenames are confined to known project files or simple component filenames; arbitrary paths and oversized exports are rejected.

Tests exercise schema validation, search precision, example completeness over registered axes, real module resolution, migration, history, every-example export compilation, browser interactions and Rust path validation. Runtime behaviors are local UI demos; application-specific handlers, imported/custom code, additional adapters, asset workflows and Next.js export remain future work.
