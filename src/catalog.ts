export type Library = "shadcn" | "mui" | "antd";
export type Descriptor = {
  id: string;
  name: string;
  library: Library | "layout";
  category: string;
  symbol: string;
  from: string;
  children: boolean;
  variants: string[];
  sizes: string[];
};
const structural = ["Container", "Flex", "Grid", "Heading", "Text"];
export const catalog: Descriptor[] = structural.map((name) => ({
  id: `layout.${name}`,
  name,
  library: "layout",
  category: "Layout",
  symbol: name === "Heading" ? "h2" : name === "Text" ? "p" : "div",
  from: "",
  children: ["Container", "Flex", "Grid"].includes(name),
  variants: [],
  sizes: [],
}));
for (const library of ["shadcn", "mui", "antd"] as const) {
  for (const name of ["Button", "Input", "Card"]) {
    const symbol = library === "mui" && name === "Input" ? "TextField" : name;
    catalog.push({
      id: `${library}.${name}`,
      name,
      library,
      category:
        name === "Button"
          ? "Actions"
          : name === "Input"
            ? "Forms"
            : "Data display",
      symbol,
      from:
        library === "shadcn"
          ? `./components/ui/${name.toLowerCase()}`
          : library === "mui"
            ? "@mui/material"
            : "antd",
      children: name === "Card",
      variants:
        name === "Button"
          ? library === "shadcn"
            ? [
                "default",
                "secondary",
                "outline",
                "ghost",
                "destructive",
                "link",
              ]
            : library === "mui"
              ? ["contained", "outlined", "text"]
              : ["primary", "default", "dashed", "text", "link"]
          : name === "Input" && library === "mui"
            ? ["outlined", "filled", "standard"]
            : [],
      sizes:
        name === "Button"
          ? library === "shadcn"
            ? [
                "default",
                "xs",
                "sm",
                "lg",
                "icon",
                "icon-xs",
                "icon-sm",
                "icon-lg",
              ]
            : library === "mui"
              ? ["small", "medium", "large"]
              : ["small", "middle", "large"]
          : [],
    });
  }
}
export function descriptor(id: string) {
  const d = catalog.find((d) => d.id === id);
  if (!d) throw new Error(`Unsupported component: ${id}`);
  return d;
}
