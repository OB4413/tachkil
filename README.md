# Component Studio — shadcn desktop editor

Component Studio is a Tauri 2 desktop application. This version focuses exclusively on **shadcn/ui, Radix / New York v4**. MUI and Ant Design are no longer offered; existing projects from those libraries are rejected with an explanation and are never converted or overwritten.

## Run locally

With Rust, Node.js and Tauri's platform prerequisites installed:

```sh
npm install
npm run desktop
```

On Kali/Debian, the native packages include `build-essential`, `pkg-config`, `libwebkit2gtk-4.1-dev`, `libssl-dev`, `librsvg2-dev`, `libxdo-dev`, and `libayatana-appindicator3-dev`. If Cargo is missing from an existing terminal, run `source "$HOME/.cargo/env"`. See https://v2.tauri.app/start/prerequisites/ .

`npm run desktop:build` packages the app. `npx tauri build --debug --no-bundle` builds a local desktop executable. `npm run dev` is only a browser development preview; native file commands require the desktop app.

## Browse and build

- Search names, types, styles, sizes and states: try `input password`, `button disabled`, `link`, `popover left` or `field invalid`.
- Filter by family or category. All matching registered configurations appear; there is no hidden first-results cutoff.
- Use the eye button to interact with an example, then add that exact configuration. Preview changes are temporary. Dragging a tile onto a container preserves the same props as Add.
- Edit text, props and breakpoint-specific layout in the inspector. Controls come from each component's schema.
- Use Layers for selection, ordering and reparenting; undo/redo records document changes. Drops append into the target container; exact between-item drop positioning is not implemented.
- Edit mode intercepts interactions. Preview mode enables actual component behavior. Links do not navigate away from the desktop editor; exported anchors retain their destinations.
- Save/open versioned `.cstudio` files through native dialogs. Export creates a fresh React + Vite directory without overwriting existing files. Run `npm install` and `npm run dev` or `npm run build` inside it.

## Coverage

There are **50 shadcn component families**, plus Container, Flex, Grid, Heading and Text. The catalog contains **950 configurations** including those five structural elements. Registered enum axes are expanded into valid prop combinations; redundant icon-only configurations are removed. Composed examples are labeled separately from prop configurations.

Supported families: Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Button Group, Card, Carousel, Checkbox, Collapsible, Command, Context Menu, Dialog, Drawer, Dropdown Menu, Empty, Field, Hover Card, Input, Input Group, Input OTP, Item, Kbd, Label, Link (Button + anchor composition), Menubar, Native Select, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toggle, Toggle Group and Tooltip.

**Not yet adapted:** Calendar, Chart, Combobox, Data Table, Date Picker, Sidebar, Sonner and Form. They are explicitly listed in Catalog coverage. This is a snapshot of supported axes and curated compositions, not a claim to cover every upstream example, all possible compositions, or other shadcn editions. Custom action handlers and application data must be connected in exported code.

The catalog works offline using real bundled source. The library manager can create a separate workspace and run the fixed official `shadcn add --all` workflow after showing commands for approval. Installing upstream source does not automatically create visual adapters or import that code into the privileged editor.

## Verification

```sh
npm run build
npm test
npm run test:exports
npx playwright test
cargo test --manifest-path src-tauri/Cargo.toml
```

The export smoke test emits **every registered configuration**, installs dependencies in a fresh temporary directory, typechecks and production-builds it. Browser tests cover exact search results, drag/drop configuration preservation, editing/history/export, modal behavior and interactive previews across all families. Rust tests cover native export path confinement. Native dialogs and full upstream registry installation still require separate interactive end-to-end verification.

Registry sources and local SHA-256 hashes are recorded in `src/registry-snapshot.json`. See `THIRD_PARTY_NOTICES.md` for source attribution and `ARCHITECTURE.md` for the module boundaries.
