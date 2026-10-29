import { descriptor } from "./catalog";
import { move, type Node } from "./model";
import { ComponentView } from "./renderer";
import { useStudio } from "./store";
export function Layer({ node, depth }: { node: Node; depth: number }) {
  const s = useStudio();
  return (
    <>
      <button
        draggable
        className={"layer " + (s.selected === node.id ? "active" : "")}
        style={{ paddingLeft: 14 + depth * 14 }}
        onClick={() => s.select(node.id)}
        onDragStart={(e) =>
          e.dataTransfer.setData("application/studio-node", node.id)
        }
        onDragOver={(e) => {
          if (descriptor(node.componentId).children) e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          s.edit((p) => {
            move(
              p.root,
              e.dataTransfer.getData("application/studio-node"),
              node.id,
            );
          });
        }}
      >
        ◇ {node.name}
      </button>
      {node.children.map((c) => (
        <Layer key={c.id} node={c} depth={depth + 1} />
      ))}
    </>
  );
}
export function CanvasNode({
  node,
  viewport,
  preview,
  add,
}: {
  node: Node;
  viewport: "desktop" | "tablet" | "mobile";
  preview: boolean;
  add: (
    id: string,
    variant?: string,
    target?: string,
    size?: string,
    icon?: boolean,
    disabled?: boolean,
  ) => void;
}) {
  const s = useStudio(),
    container = descriptor(node.componentId).children;
  const style = {
    ...node.styles,
    ...(viewport !== "desktop" ? node.responsive.tablet : {}),
    ...(viewport === "mobile" ? node.responsive.mobile : {}),
  };
  return (
    <div
      className={
        "node " +
        (container ? "container " : "") +
        (!preview && s.selected === node.id ? "selected" : "")
      }
      onClick={(e) => {
        if (!preview) {
          e.preventDefault();
          e.stopPropagation();
          s.select(node.id);
        }
      }}
      onDragOver={(e) => {
        if (!preview && container) {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.add("dropTarget");
        }
      }}
      onDragLeave={(e) => e.currentTarget.classList.remove("dropTarget")}
      onDrop={(e) => {
        if (preview || !container) return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove("dropTarget");
        const raw = e.dataTransfer.getData("application/studio-component");
        if (raw) {
          try {
            const data = JSON.parse(raw);
            const d = descriptor(data.id);
            if (d.library === "layout" || d.library === s.project.library)
              add(
                data.id,
                data.variant,
                node.id,
                data.size,
                data.icon,
                data.disabled,
              );
          } catch {
            /* Ignore unrelated external drops. */
          }
        } else {
          s.edit((p) => {
            move(
              p.root,
              e.dataTransfer.getData("application/studio-node"),
              node.id,
            );
          });
        }
      }}
    >
      <div className={preview ? "" : "editContent"}>
        <ComponentView node={node} style={style}>
          {node.children.map((c) => (
            <CanvasNode
              key={c.id}
              node={c}
              viewport={viewport}
              preview={preview}
              add={add}
            />
          ))}
          {container && !node.children.length && !preview && (
            <div className="empty">
              ＋ Drop components here
              <br />
              <small>{node.name}</small>
            </div>
          )}
        </ComponentView>
      </div>
    </div>
  );
}
