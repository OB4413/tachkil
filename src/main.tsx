import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { isTauri } from "@tauri-apps/api/core";
import {
  Box,
  Layers3,
  Search,
  Save,
  FolderOpen,
  Plus,
  Undo2,
  Redo2,
  Play,
  Code2,
  Download,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { catalog, descriptor, type Library } from "./catalog";
import {
  newProject,
  makeNode,
  find,
  parent,
  cloneNode,
  type Node,
  type Style,
} from "./model";
import { Variants } from "./Variants";
import { saveProject, openProject, exportFiles } from "./desktop";
const generate = async (
  ...args: Parameters<typeof import("./export").generate>
) => (await import("./export")).generate(...args);
import { useStudio } from "./store";
import { Layer, CanvasNode } from "./canvas";
import { LibraryManager } from "./LibraryManager";
import "./studio.css";

function App() {
  const s = useStudio();
  const [manager, setManager] = useState(false);
  const [tab, setTab] = useState("catalog"),
    [search, setSearch] = useState(""),
    [family, setFamily] = useState("shadcn.Button");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
      "desktop",
    ),
    [preview, setPreview] = useState(false),
    [zoom, setZoom] = useState(80);
  const [message, setMessage] = useState(""),
    [code, setCode] = useState<string | null>(null),
    [creating, setCreating] = useState(true),
    [name, setName] = useState("My dashboard"),
    [library, setLibrary] = useState<Library>("shadcn");
  const selected = find(s.project.root, s.selected) || s.project.root,
    d = descriptor(selected.componentId);
  const activeFamily =
    catalog.find(
      (d) =>
        d.id === family &&
        (d.library === s.project.library || d.library === "layout"),
    ) || descriptor(`${s.project.library}.Button`);
  const notify = (error: unknown) =>
    setMessage(error instanceof Error ? error.message : String(error));
  async function save() {
    const snapshot = s.project;
    try {
      const path = await saveProject(snapshot);
      if (path) {
        if (useStudio.getState().project === snapshot)
          useStudio.setState({ dirty: false });
        setMessage(`Saved to ${path}`);
      }
    } catch (e) {
      notify(e);
    }
  }
  async function open() {
    if (
      s.dirty &&
      !confirm("Discard unsaved changes and open another project?")
    )
      return;
    try {
      const p = await openProject();
      if (p) {
        s.load(p);
        setCreating(false);
      }
    } catch (e) {
      notify(e);
    }
  }
  function add(
    componentId: string,
    variant?: string,
    target = selected.id,
    size?: string,
    icon?: boolean,
    disabled?: boolean,
  ) {
    s.edit((p) => {
      let container = find(p.root, target) || p.root;
      if (!descriptor(container.componentId).children)
        container = parent(p.root, target) || p.root;
      const n = makeNode(componentId, variant);
      n.props = { ...n.props, ...(size ? { size } : {}), icon, disabled };
      container.children.push(n);
    });
  }
  function remove() {
    if (selected.id === s.project.root.id) return;
    s.edit((p) => {
      const container = parent(p.root, selected.id)!;
      container.children = container.children.filter(
        (n) => n.id !== selected.id,
      );
    });
    s.select(s.project.root.id);
  }
  function duplicate() {
    s.edit((p) => {
      const container = parent(p.root, selected.id);
      if (container) container.children.push(cloneNode(selected));
    });
  }
  function reorder(offset: number) {
    s.edit((p) => {
      const container = parent(p.root, selected.id);
      if (!container) return;
      const index = container.children.findIndex((n) => n.id === selected.id),
        next = index + offset;
      if (next < 0 || next >= container.children.length) return;
      [container.children[index], container.children[next]] = [
        container.children[next],
        container.children[index],
      ];
    });
  }
  function props(values: Partial<Node["props"]>) {
    s.edit((p) => Object.assign(find(p.root, selected.id)!.props, values));
  }
  function styles(values: Style) {
    s.edit((p) => {
      const n = find(p.root, selected.id)!;
      if (viewport === "desktop") Object.assign(n.styles, values);
      else n.responsive[viewport] = { ...n.responsive[viewport], ...values };
    });
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).matches(
        "input,textarea,select,[contenteditable]",
      );
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
      if (!typing && (e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? s.redo() : s.undo();
      }
      if (!typing && e.key === "Delete") remove();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  const effective = {
    ...selected.styles,
    ...(viewport !== "desktop" ? selected.responsive.tablet : {}),
    ...(viewport === "mobile" ? selected.responsive.mobile : {}),
  };
  return (
    <div className="studio">
      <header className="top">
        <div className="brand">
          <Box size={22} /> Component Studio <small>DESKTOP</small>
        </div>
        <span>
          {s.project.name}
          {s.dirty ? " •" : ""}
        </span>
        <nav>
          <button onClick={() => setManager(true)}>Libraries</button>
          <button title="New project" onClick={() => setCreating(true)}>
            <Plus size={16} />
          </button>
          <button title="Open project" onClick={open}>
            <FolderOpen size={16} />
          </button>
          <button title="Save project" onClick={save}>
            <Save size={16} />
          </button>
          <button title="Undo" disabled={!s.past.length} onClick={s.undo}>
            <Undo2 size={16} />
          </button>
          <button title="Redo" disabled={!s.future.length} onClick={s.redo}>
            <Redo2 size={16} />
          </button>
          <button onClick={() => setPreview(!preview)}>
            <Play size={15} />
            {preview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={async () => {
              try {
                setCode((await generate(s.project))["src/App.tsx"]);
              } catch (e) {
                notify(e);
              }
            }}
          >
            <Code2 size={15} />
            Code
          </button>
          <button
            className="accent"
            onClick={async () => {
              try {
                const path = await exportFiles(await generate(s.project));
                if (path) setMessage(`Exported project to ${path}`);
              } catch (e) {
                notify(e);
              }
            }}
          >
            <Download size={15} />
            Export
          </button>
        </nav>
      </header>
      <div className="workbench">
        <aside className="catalogPanel">
          <div className="tabs">
            <button
              className={tab === "catalog" ? "active" : ""}
              onClick={() => setTab("catalog")}
            >
              <Box size={16} />
              Components
            </button>
            <button
              className={tab === "layers" ? "active" : ""}
              onClick={() => setTab("layers")}
            >
              <Layers3 size={16} />
              Layers
            </button>
          </div>
          {tab === "catalog" ? (
            <>
              <div className="panelHeading">
                <h2>
                  {s.project.library === "shadcn"
                    ? "shadcn/ui"
                    : s.project.library === "mui"
                      ? "Material UI"
                      : "Ant Design"}
                </h2>
                <p>Bundled library · 3 supported families</p>
              </div>
              <label className="search">
                <Search size={16} />
                <input
                  aria-label="Search components"
                  placeholder="Search components or styles…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <div className="familyList">
                {catalog
                  .filter(
                    (d) =>
                      (d.library === s.project.library ||
                        d.library === "layout") &&
                      `${d.name} ${d.category} ${d.variants.join(" ")}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                  )
                  .map((d) => (
                    <button
                      key={d.id}
                      className={activeFamily.id === d.id ? "active" : ""}
                      onClick={() => setFamily(d.id)}
                    >
                      <span>{d.name}</span>
                      <small>{d.category}</small>
                    </button>
                  ))}
              </div>
              <div className="panelHeading">
                <h3>{activeFamily.name} examples</h3>
                <p>Drag a style into a container, or click Add.</p>
              </div>
              <Variants key={activeFamily.id} family={activeFamily} add={add} />
            </>
          ) : (
            <>
              <div className="panelHeading">
                <h2>Layers</h2>
                <p>Drag a layer onto a container to reparent.</p>
              </div>
              <Layer node={s.project.root} depth={0} />
            </>
          )}
        </aside>
        <main className="center">
          <div className="canvasToolbar">
            <span>{preview ? "Interactive preview" : "Design canvas"}</span>
            <div>
              {(["desktop", "tablet", "mobile"] as const).map((v) => (
                <button
                  className={viewport === v ? "active" : ""}
                  key={v}
                  onClick={() => setViewport(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <label>
              Zoom{" "}
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              >
                {[50, 65, 80, 100].map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
              %
            </label>
          </div>
          <div className="canvasScroll">
            <div className="pageLabel">
              {s.project.name} ·{" "}
              {viewport === "desktop"
                ? "1120"
                : viewport === "tablet"
                  ? "768"
                  : "390"}{" "}
              px
            </div>
            <div
              className={"canvas " + (preview ? "preview" : "")}
              style={{
                width:
                  viewport === "desktop"
                    ? 1120
                    : viewport === "tablet"
                      ? 768
                      : 390,
                zoom: zoom / 100,
              }}
            >
              <CanvasNode
                node={s.project.root}
                viewport={viewport}
                preview={preview}
                add={add}
              />
            </div>
          </div>
        </main>
        <aside className="inspector">
          <div className="panelHeading">
            <h2>{selected.name}</h2>
            <p>{selected.componentId}</p>
          </div>
          <section>
            <h3>Content & properties</h3>
            <label>
              Layer name
              <input
                value={selected.name}
                onChange={(e) =>
                  s.edit((p) => {
                    find(p.root, selected.id)!.name = e.target.value;
                  })
                }
              />
            </label>
            {!d.children && (
              <label>
                {d.name === "Input" ? "Label / placeholder" : "Text"}
                <input
                  value={selected.props.text || ""}
                  onChange={(e) => props({ text: e.target.value })}
                />
              </label>
            )}
            {d.variants.length > 0 && (
              <label>
                Variant
                <select
                  value={selected.props.variant}
                  onChange={(e) => props({ variant: e.target.value })}
                >
                  {d.variants.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            )}
            {d.sizes.length > 0 && (
              <label>
                Size
                <select
                  value={selected.props.size}
                  onChange={(e) => props({ size: e.target.value })}
                >
                  {d.sizes.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            )}
            {["Button", "Input"].includes(d.name) && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={!!selected.props.disabled}
                  onChange={(e) => props({ disabled: e.target.checked })}
                />
                Disabled
              </label>
            )}
            {d.name === "Button" && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={!!selected.props.icon}
                  onChange={(e) => props({ icon: e.target.checked })}
                />
                Leading icon
              </label>
            )}
          </section>
          <section>
            <h3>Layout · {viewport}</h3>
            {d.children && (
              <>
                <label>
                  Display
                  <select
                    value={effective.display || "flex"}
                    onChange={(e) =>
                      styles({ display: e.target.value as Style["display"] })
                    }
                  >
                    <option>flex</option>
                    <option>grid</option>
                    <option>block</option>
                  </select>
                </label>
                {effective.display === "flex" && (
                  <label>
                    Direction
                    <select
                      value={effective.flexDirection || "column"}
                      onChange={(e) =>
                        styles({ flexDirection: e.target.value as "row" })
                      }
                    >
                      <option>column</option>
                      <option>row</option>
                    </select>
                  </label>
                )}
                {effective.display === "grid" && (
                  <label>
                    Columns
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={Number(
                        effective.gridTemplateColumns?.match(
                          /repeat\((\d+)/,
                        )?.[1] || 3,
                      )}
                      onChange={(e) =>
                        styles({
                          gridTemplateColumns: `repeat(${Math.max(1, Math.min(12, Number(e.target.value)))}, minmax(0, 1fr))`,
                        })
                      }
                    />
                  </label>
                )}
              </>
            )}
            {(["padding", "gap", "borderRadius"] as const).map((key) => (
              <label key={key}>
                {key}
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={effective[key] || 0}
                  onChange={(e) =>
                    styles({
                      [key]: Math.max(0, Math.min(200, Number(e.target.value))),
                    })
                  }
                />
              </label>
            ))}
            <label>
              Background
              <input
                type="color"
                value={effective.backgroundColor || "#ffffff"}
                onChange={(e) => styles({ backgroundColor: e.target.value })}
              />
            </label>
            {viewport !== "desktop" && (
              <button
                onClick={() =>
                  s.edit((p) => {
                    delete find(p.root, selected.id)!.responsive[viewport];
                  })
                }
              >
                Reset breakpoint overrides
              </button>
            )}
          </section>
          <section>
            <h3>Layer actions</h3>
            <div className="actions">
              <button title="Move earlier" onClick={() => reorder(-1)}>
                <ArrowUp size={16} />
              </button>
              <button title="Move later" onClick={() => reorder(1)}>
                <ArrowDown size={16} />
              </button>
              <button title="Duplicate" onClick={duplicate}>
                <Copy size={16} />
              </button>
              <button title="Delete" onClick={remove}>
                <Trash2 size={16} />
              </button>
            </div>
            <button
              onClick={async () => {
                try {
                  setCode(
                    (await generate({ ...s.project, root: selected }))[
                      "src/App.tsx"
                    ],
                  );
                } catch (e) {
                  notify(e);
                }
              }}
            >
              View selected component code
            </button>
          </section>
        </aside>
      </div>
      <footer>
        <span>{s.dirty ? "Unsaved changes" : "No unsaved changes"}</span>
        <span>
          {isTauri()
            ? "Local desktop workspace"
            : "Browser development preview · native files require desktop launch"}
        </span>
      </footer>
      {manager && <LibraryManager close={() => setManager(false)} />}
      {message && (
        <div className="notice" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}
      {code !== null && (
        <div className="overlay">
          <div className="dialog codeDialog">
            <h2>Generated React source</h2>
            <textarea readOnly value={code} />
            <div className="actions">
              <button
                onClick={() =>
                  navigator.clipboard
                    .writeText(code)
                    .then(() => setMessage("Source copied"))
                    .catch(notify)
                }
              >
                Copy source
              </button>
              <button onClick={() => setCode(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {creating && (
        <div className="overlay">
          <div className="dialog">
            <div className="brand">
              <Box /> Component Studio
            </div>
            <h1>Create your dashboard</h1>
            <p>
              Choose a real component library. Browse its supported variants and
              build directly on the canvas.
            </p>
            <label>
              Project name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              UI library
              <select
                value={library}
                onChange={(e) => setLibrary(e.target.value as Library)}
              >
                <option value="shadcn">shadcn/ui</option>
                <option value="mui">Material UI</option>
                <option value="antd">Ant Design</option>
              </select>
            </label>
            <p>
              Button, Input and Card are bundled and ready to use. Additional
              families need visual adapters. Use Libraries to install a complete
              library into a separate local workspace.
            </p>
            <div className="actions">
              <button
                className="accent"
                disabled={!name.trim()}
                onClick={() => {
                  if (s.dirty && !confirm("Discard unsaved project changes?"))
                    return;
                  s.load(newProject(name.trim(), library));
                  setFamily(`${library}.Button`);
                  setCreating(false);
                }}
              >
                Create project
              </button>
              <button onClick={open}>Open project</button>
              <button onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
