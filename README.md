# Component Studio desktop

A Tauri 2 desktop editor with a React/TypeScript UI. Browser mode exists for frontend development; native project files and library installation require the desktop executable.

## Launch

Install Node.js, Rust via rustup, and the native prerequisites for your platform. On Debian/Kali, Tauri requires WebKitGTK 4.1 and development tools:

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev librsvg2-dev libayatana-appindicator3-dev
npm install
npm run desktop
```

Rust installation: https://rustup.rs/ . Platform prerequisites: https://v2.tauri.app/start/prerequisites/ . Use `npm run desktop:build` to package the desktop app.

## Current workflow

1. Create a project with shadcn/ui, Material UI, or Ant Design.
2. Browse Button, Input and Card families. Button tiles show all registered variants × sizes; icon and disabled switches show additional states. The bundled shadcn components come from the official new-york-v4 registry.
3. Drag examples onto a container, or click Add. Add Flex/Grid containers, select layers, edit props/layout, duplicate/delete/reorder, or drag layers onto another container. Drops append to containers; precise between-item drop positioning is not implemented.
4. Edit desktop/tablet/mobile layout overrides and switch to interactive preview. Undo/redo works for document mutations.
5. Save/open `.cstudio` files using native dialogs. Save currently opens Save As each time. Export a complete React + Vite project into a fresh directory, or inspect/copy a subtree's React source.
6. The Libraries dialog can install a separate library workspace. It displays fixed npm commands for approval before running them. MUI/Ant Design install their complete packages; shadcn runs the official CLI with `add --all`. Node.js/npm and network access are required for installation only. Logs and partially installed workspaces are preserved on failure.

Installing every library component does **not** yet provide a visual adapter for every component. The editor currently supports three families per library, plus structural Container/Flex/Grid/Heading/Text. External workspace source is not executed in the editor. Project import, custom registration, Next.js, assets, complete library catalogs, theme editing and managed workspace linking remain unfinished.

## Verification

```sh
npm run build
npm test
npm run test:exports
npx playwright test
```

Export smoke tests generate temporary projects for all three libraries, install dependencies, typecheck and build them. Browser tests cover variant insertion, editing, history, preview and generated source. These do not replace native desktop integration tests.

This development machine lacks Rust/Cargo and WebKitGTK; native compilation, native dialogs and managed installation have not been executed here. The frontend and exported projects can be tested independently.

See ARCHITECTURE.md for module boundaries and remaining phases.
