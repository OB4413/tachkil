import { describe, it, expect } from "vitest";
import { newProject, makeNode, move, parseProject, cloneNode } from "./model";
import { generate } from "./export";
describe("project invariants", () => {
  it("round-trips a nested project with responsive overrides", () => {
    const p = newProject("Dashboard", "shadcn"),
      grid = makeNode("layout.Grid");
    grid.responsive.mobile = {
      gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    };
    grid.children.push(makeNode("shadcn.Button", "outline"));
    p.root.children.push(grid);
    expect(parseProject(JSON.stringify(p))).toEqual(p);
  });
  it("rejects cycles and leaf targets while supporting reparenting", () => {
    const p = newProject("Test", "mui"),
      a = makeNode("layout.Flex"),
      b = makeNode("layout.Grid"),
      button = makeNode("mui.Button");
    p.root.children.push(a, button);
    a.children.push(b);
    expect(move(p.root, a.id, b.id)).toBe(false);
    expect(move(p.root, a.id, button.id)).toBe(false);
    expect(move(p.root, button.id, b.id)).toBe(true);
    expect(b.children[0].id).toBe(button.id);
  });
  it("rejects foreign components, duplicate IDs and CSS injection", () => {
    const p = newProject("Test", "shadcn");
    p.root.children.push(makeNode("mui.Button"));
    expect(() => parseProject(JSON.stringify(p))).toThrow("Mixed");
    p.root.children = [];
    p.root.children.push({ ...makeNode("shadcn.Button"), id: p.root.id });
    expect(() => parseProject(JSON.stringify(p))).toThrow();
    p.root.children = [];
    p.root.styles.backgroundColor = "red; } body {display:none";
    expect(() => parseProject(JSON.stringify(p))).toThrow("Invalid styles");
  });
  it("duplicates with fresh IDs throughout the subtree", () => {
    const n = makeNode("layout.Flex");
    n.children.push(makeNode("shadcn.Button"));
    const copy = cloneNode(n);
    expect(copy.id).not.toBe(n.id);
    expect(copy.children[0].id).not.toBe(n.children[0].id);
  });
});
describe("export contract", () => {
  for (const library of ["shadcn", "mui", "antd"] as const)
    it(`exports ${library} with correct imports and escaped text`, async () => {
      const p = newProject("Example", library),
        n = makeNode(`${library}.Button`);
      n.props.text = '</button>{danger} "quoted"';
      p.root.children.push(n);
      const files = await generate(p);
      expect(files["src/App.tsx"]).toContain(n.props.text);
      expect(files["src/App.tsx"]).toContain("export default function App");
      expect(JSON.parse(files["package.json"]).dependencies.react).toBeTruthy();
      if (library === "shadcn")
        expect(files["src/components/ui/button.tsx"]).toContain(
          "buttonVariants",
        );
      if (library === "antd")
        expect(files["src/App.tsx"]).toContain('type={"primary"}');
    });
});
