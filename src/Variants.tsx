import { useState } from "react";
import type { Descriptor } from "./catalog";
import { makeNode } from "./model";
import { ComponentView } from "./renderer";
export function Variants({
  family,
  add,
}: {
  family: Descriptor;
  add: (
    id: string,
    variant?: string,
    target?: string,
    size?: string,
    icon?: boolean,
    disabled?: boolean,
  ) => void;
}) {
  const [size, setSize] = useState("all"),
    [icon, setIcon] = useState(false),
    [disabled, setDisabled] = useState(false);
  const sizes = family.sizes.length
    ? family.sizes.filter((s) => size === "all" || s === size)
    : [undefined];
  return (
    <>
      <div className="variantControls">
        {family.sizes.length > 0 && (
          <label>
            Size previews
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="all">All sizes</option>
              {family.sizes.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        {family.name === "Button" && (
          <label>
            <input
              type="checkbox"
              checked={icon}
              onChange={(e) => setIcon(e.target.checked)}
            />{" "}
            With icon
          </label>
        )}
        {["Button", "Input"].includes(family.name) && (
          <label>
            <input
              type="checkbox"
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
            />{" "}
            Disabled
          </label>
        )}
      </div>
      <div className="variantList">
        {(family.variants.length ? family.variants : [undefined]).flatMap(
          (variant) =>
            sizes.map((size) => {
              const n = makeNode(family.id, variant);
              n.props = { ...n.props, size, icon, disabled };
              return (
                <div
                  className="variantTile"
                  key={`${variant}-${size}`}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData(
                      "application/studio-component",
                      JSON.stringify({
                        id: family.id,
                        variant,
                        size,
                        icon,
                        disabled,
                      }),
                    )
                  }
                >
                  <div className="sample">
                    <ComponentView node={n}>
                      {family.children && (
                        <span style={{ padding: 12 }}>Content</span>
                      )}
                    </ComponentView>
                  </div>
                  <div className="tileCaption">
                    <span>
                      {variant || "Default"}
                      {size ? ` · ${size}` : ""}
                    </span>
                    <button
                      onClick={() =>
                        add(family.id, variant, undefined, size, icon, disabled)
                      }
                    >
                      ＋ Add
                    </button>
                  </div>
                </div>
              );
            }),
        )}
      </div>
    </>
  );
}
