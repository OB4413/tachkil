import ts from "typescript";
import { format } from "prettier/standalone";
import * as typescript from "prettier/plugins/typescript";
import * as estree from "prettier/plugins/estree";
import { descriptor } from "./catalog";
import { parseProject, type Node, type Project, type Style } from "./model";
import buttonSource from "./components/ui/button.tsx?raw";
import inputSource from "./components/ui/input.tsx?raw";
import cardSource from "./components/ui/card.tsx?raw";
import utilsSource from "./lib/utils.ts?raw";
import theme from "./theme.css?raw";
import manifest from "../package.json";
import notices from "../THIRD_PARTY_NOTICES.md?raw";
const f = ts.factory;
function literal(value: string | boolean) {
  return typeof value === "boolean"
    ? value
      ? f.createTrue()
      : f.createFalse()
    : f.createStringLiteral(value);
}
function attr(name: string, value: string | boolean) {
  return f.createJsxAttribute(
    f.createIdentifier(name),
    f.createJsxExpression(undefined, literal(value)),
  );
}
export async function generate(
  project: Project,
): Promise<Record<string, string>> {
  parseProject(JSON.stringify(project));
  const imports = new Map<string, Set<string>>(),
    nodes: Node[] = [];
  function jsx(n: Node): ts.JsxElement {
    nodes.push(n);
    const d = descriptor(n.componentId),
      props = n.props;
    if (d.from) {
      if (!imports.has(d.from)) imports.set(d.from, new Set());
      imports.get(d.from)!.add(d.symbol);
    }
    const attributes = [attr("className", `cs-${n.id}`)];
    if (props.variant)
      attributes.push(
        attr(
          d.library === "antd" && d.name === "Button" ? "type" : "variant",
          props.variant,
        ),
      );
    if (props.size) attributes.push(attr("size", props.size));
    if (props.disabled) attributes.push(attr("disabled", true));
    if (d.name === "Input") {
      attributes.push(
        attr(d.library === "mui" ? "label" : "placeholder", props.text || ""),
      );
      if (d.library === "mui") attributes.push(attr("size", "small"));
    }
    const children: ts.JsxChild[] = n.children.map(jsx);
    if (!d.children && d.name !== "Input") {
      if (props.icon || props.size?.startsWith("icon"))
        children.push(
          f.createJsxElement(
            f.createJsxOpeningElement(
              f.createIdentifier("span"),
              undefined,
              f.createJsxAttributes([attr("aria-hidden", true)]),
            ),
            [f.createJsxText("＋")],
            f.createJsxClosingElement(f.createIdentifier("span")),
          ),
        );
      if (!props.size?.startsWith("icon"))
        children.push(
          f.createJsxExpression(undefined, literal(props.text || "")),
        );
    }
    return f.createJsxElement(
      f.createJsxOpeningElement(
        f.createIdentifier(d.symbol),
        undefined,
        f.createJsxAttributes(attributes),
      ),
      children,
      f.createJsxClosingElement(f.createIdentifier(d.symbol)),
    );
  }
  const body = jsx(project.root);
  const declarations = [...imports].map(([path, symbols]) =>
    f.createImportDeclaration(
      undefined,
      f.createImportClause(
        false,
        undefined,
        f.createNamedImports(
          [...symbols].map((s) =>
            f.createImportSpecifier(false, undefined, f.createIdentifier(s)),
          ),
        ),
      ),
      f.createStringLiteral(path),
    ),
  );
  declarations.push(
    f.createImportDeclaration(
      undefined,
      undefined,
      f.createStringLiteral("./styles.css"),
    ),
  );
  const component = f.createFunctionDeclaration(
    [
      f.createModifier(ts.SyntaxKind.ExportKeyword),
      f.createModifier(ts.SyntaxKind.DefaultKeyword),
    ],
    undefined,
    "App",
    undefined,
    [],
    undefined,
    f.createBlock([f.createReturnStatement(body)], true),
  );
  const source = f.createSourceFile(
    [...declarations, component],
    f.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  );
  const code = await format(ts.createPrinter().printFile(source), {
    parser: "typescript",
    plugins: [typescript, estree],
  });
  function css(style: Style) {
    return Object.entries(style)
      .map(
        ([key, value]) =>
          `${key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}: ${value}${typeof value === "number" ? "px" : ""};`,
      )
      .join(" ");
  }
  const rules = nodes.map((n) => `.cs-${n.id} { ${css(n.styles)} }`).join("\n");
  const responsive = (breakpoint: "tablet" | "mobile", width: number) =>
    `@media (max-width: ${width}px) {\n${nodes
      .filter((n) => n.responsive[breakpoint])
      .map((n) => `.cs-${n.id} { ${css(n.responsive[breakpoint]!)} }`)
      .join("\n")}\n}`;
  const dependencies: Record<string, string> = {
    react: "^19.0.0",
    "react-dom": "^19.0.0",
  };
  const hasUi = nodes.some(
    (n) => descriptor(n.componentId).library !== "layout",
  );
  if (hasUi && project.library === "mui")
    Object.assign(dependencies, {
      "@mui/material": "^7.0.0",
      "@emotion/react": "^11.0.0",
      "@emotion/styled": "^11.0.0",
    });
  if (hasUi && project.library === "antd")
    Object.assign(dependencies, { antd: "^6.0.0" });
  if (hasUi && project.library === "shadcn")
    Object.assign(dependencies, {
      "class-variance-authority": "^0.7.1",
      clsx: "^2.1.1",
      "tailwind-merge": "^3.0.0",
      "radix-ui": "^1.0.0",
    });
  for (const key of Object.keys(dependencies))
    dependencies[key] =
      (manifest.dependencies as Record<string, string>)[key] ||
      dependencies[key];
  const files: Record<string, string> = {
    "src/App.tsx": code,
    "src/styles.css": `${project.library === "shadcn" ? '@import "tailwindcss";\n' + theme : ""}\nbody { margin:0; font-family:system-ui,sans-serif; background:white; color:#171717; }\n* { box-sizing:border-box; }\n${rules}\n${responsive("tablet", 900)}\n${responsive("mobile", 600)}`,
    "src/main.tsx":
      'import { createRoot } from "react-dom/client"; import App from "./App"; createRoot(document.getElementById("root")!).render(<App/>);',
    "index.html":
      '<!doctype html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Dashboard</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
    "tsconfig.json": JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          lib: ["ES2020", "DOM"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          esModuleInterop: true,
          noEmit: true,
        },
        include: ["src"],
      },
      null,
      2,
    ),
    "package.json": JSON.stringify(
      {
        name: "studio-dashboard",
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build:
            project.library === "shadcn"
              ? "tailwindcss -i src/styles.css -o src/generated.css && tsc && vite build"
              : "tsc && vite build",
        },
        dependencies,
        devDependencies: {
          vite: "^7.0.0",
          typescript: "^5.9.0",
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
          ...(project.library === "shadcn"
            ? { tailwindcss: "^4.0.0", "@tailwindcss/cli": "^4.0.0" }
            : {}),
        },
      },
      null,
      2,
    ),
    "README.md":
      "# Exported dashboard\n\nRun `npm install` and `npm run build`. Use `npm run dev` to preview. For shadcn, run the build first to generate utility CSS.\n",
  };
  if (project.library === "shadcn") {
    files["README.md"] += "\n\n" + notices;
    // Keep source CSS separate: the CLI emits the stylesheet consumed by the component.
    files["src/App.tsx"] = code.replace("./styles.css", "./generated.css");
    for (const [component, source] of [
      ["Button", buttonSource],
      ["Input", inputSource],
      ["Card", cardSource],
    ])
      if (nodes.some((n) => descriptor(n.componentId).name === component))
        files[`src/components/ui/${component.toLowerCase()}.tsx`] = source;
    if (hasUi) files["src/lib/utils.ts"] = utilsSource;
  }
  return files;
}
