import { descriptor, defaults, type Props, type Library } from "./catalog";
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
  props: Props;
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
    props: { ...defaults(d), ...(variant ? { variant } : {}) },
    styles: d.children && d.library === 'layout'
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
export function newProject(name: string, library: Library = "shadcn"): Project {
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
    p.library !== "shadcn"
  )
    throw new Error("This version opens shadcn/ui projects only. Other library projects are not converted or overwritten.");
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
    // Migrate the previous Button icon flag without changing the file on disk.
    if (n.componentId === "shadcn.Button" && "icon" in n.props) {
      n.props.iconPlacement = n.props.icon ? "leading" : "none"; delete n.props.icon;
    }
    n.props = validateProps(n.componentId, n.props);
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

export function validHref(value:string) { return /^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/.test(value) && !/[\u0000-\u001f]/.test(value); }
export function validateProps(componentId:string, props:Props):Props {
 const d=descriptor(componentId);
 if(!props || typeof props!=='object' || Array.isArray(props)) throw new Error('Invalid properties');
 const result=defaults(d);
 for(const [key,value] of Object.entries(props)) {
  if(value===undefined)continue;
  const field=d.fields[key];
  if(!field)throw new Error('Unsupported property: '+key);
  if(field.type==='boolean' ? typeof value!=='boolean' : field.type==='number' ? typeof value!=='number'||!Number.isFinite(value)||value<(field.min??0)||value>(field.max??100) : typeof value!=='string'||value.length>10000)throw new Error('Invalid property: '+key);
  if(field.options&&!field.options.includes(String(value)))throw new Error('Unknown '+key);
  if(field.type==='url'&&!validHref(String(value)))throw new Error('Use an http(s), mailto, tel, fragment or root-relative link.');
  result[key]=value;
 }
 return result;
}
export function makeExampleNode(componentId:string, props:Props):Node {
 const n=makeNode(componentId);n.props=validateProps(componentId,props);return n;
}
