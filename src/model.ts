import { descriptor, type Library } from "./catalog";
export type Style = {
  display?: "flex" | "grid" | "block";
  flexDirection?: "row" | "column";
  gap?: number;
  padding?: number;
  gridTemplateColumns?: string;
  backgroundColor?: string;
  borderRadius?: number;
};
export type Node = {
  id: string;
  componentId: string;
  name: string;
  props: {
    text?: string;
    variant?: string;
    size?: string;
    disabled?: boolean;
    icon?: boolean;
  };
  styles: Style;
  responsive: { tablet?: Style; mobile?: Style };
  children: Node[];
};
export type Project = {
  schemaVersion: 1;
  name: string;
  library: Library;
  root: Node;
};
export function makeNode(id: string, variant?: string): Node {
  const d = descriptor(id);
  return {
    id: crypto.randomUUID(),
    componentId: id,
    name: d.name,
    props: {
      text: d.children ? undefined : d.name,
      variant: variant || d.variants[0],
      size: d.sizes[0],
    },
    styles: d.children
      ? {
          display: d.name === "Grid" ? "grid" : "flex",
          flexDirection: "column",
          gap: 16,
          padding: 24,
          ...(d.name === "Grid"
            ? { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }
            : {}),
        }
      : {},
    responsive: {},
    children: [],
  };
}
export function newProject(name: string, library: Library): Project {
  return {
    schemaVersion: 1,
    name,
    library,
    root: makeNode("layout.Container"),
  };
}
export function find(root: Node, id: string): Node | undefined {
  if (root.id === id) return root;
  for (const child of root.children) {
    const n = find(child, id);
    if (n) return n;
  }
}
export function parent(root: Node, id: string): Node | undefined {
  if (root.children.some((n) => n.id === id)) return root;
  for (const child of root.children) {
    const p = parent(child, id);
    if (p) return p;
  }
}
export function move(root: Node, id: string, target: string): boolean {
  const n = find(root, id),
    p = parent(root, id),
    into = find(root, target);
  if (
    !n ||
    !p ||
    !into ||
    find(n, target) ||
    !descriptor(into.componentId).children
  )
    return false;
  p.children = p.children.filter((c) => c.id !== id);
  into.children.push(n);
  return true;
}
export function cloneNode(n: Node): Node {
  return {
    ...structuredClone(n),
    id: crypto.randomUUID(),
    children: n.children.map(cloneNode),
  };
}
export function parseProject(raw: string): Project {
  if (raw.length > 5_000_000) throw new Error("Project too large");
  const p = JSON.parse(raw);
  if (
    p.schemaVersion !== 1 ||
    typeof p.name !== "string" ||
    !["shadcn", "mui", "antd"].includes(p.library)
  )
    throw new Error("Invalid project format");
  const ids = new Set<string>();
  function validate(n: Node, depth: number) {
    if (
      !n ||
      depth > 30 ||
      typeof n.id !== "string" ||
      !/^[a-zA-Z0-9-]+$/.test(n.id) ||
      ids.has(n.id) ||
      typeof n.name !== "string" ||
      !Array.isArray(n.children) ||
      !n.props ||
      !n.styles ||
      !n.responsive
    )
      throw new Error("Invalid component tree");
    ids.add(n.id);
    if (ids.size > 2000) throw new Error("Too many components");
    const d = descriptor(n.componentId);
    if (d.library !== "layout" && d.library !== p.library)
      throw new Error("Mixed library project");
    if (!d.children && n.children.length)
      throw new Error("Leaf components cannot contain children");
    for (const key of ["text", "variant", "size"] as const)
      if (n.props[key] !== undefined && typeof n.props[key] !== "string")
        throw new Error("Invalid props");
    for (const key of ["disabled", "icon"] as const)
      if (n.props[key] !== undefined && typeof n.props[key] !== "boolean")
        throw new Error("Invalid boolean prop");
    if (n.props.variant && !d.variants.includes(n.props.variant))
      throw new Error("Unknown variant");
    if (n.props.size && !d.sizes.includes(n.props.size))
      throw new Error("Unknown size");
    for (const styles of [n.styles, n.responsive.tablet, n.responsive.mobile])
      if (styles)
        for (const [key, value] of Object.entries(styles)) {
          if (
            ![
              "display",
              "flexDirection",
              "gap",
              "padding",
              "gridTemplateColumns",
              "backgroundColor",
              "borderRadius",
            ].includes(key) ||
            !["string", "number"].includes(typeof value) ||
            /[{};<>]|url\s*\(/i.test(String(value))
          )
            throw new Error("Invalid styles");
        }
    n.children.forEach((c) => validate(c, depth + 1));
  }
  validate(p.root, 0);
  return p;
}
