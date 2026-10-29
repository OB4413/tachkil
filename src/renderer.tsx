import React from "react";
import { Button as MuiButton, TextField, Card as MuiCard } from "@mui/material";
import { Button as AntButton, Input as AntInput, Card as AntCard } from "antd";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card } from "./components/ui/card";
import { descriptor } from "./catalog";
import type { Node } from "./model";
export function ComponentView({
  node,
  children,
  style,
}: {
  node: Node;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const d = descriptor(node.componentId),
    p = node.props;
  const content =
    p.icon || p.size?.startsWith("icon") ? (
      <>
        <span aria-hidden>＋</span>
        {!p.size?.startsWith("icon") && p.text}
      </>
    ) : (
      p.text
    );
  if (d.library === "layout")
    return React.createElement(
      d.symbol,
      { style },
      d.children ? children : p.text,
    );
  if (d.library === "mui") {
    if (d.name === "Button")
      return (
        <MuiButton
          style={style}
          variant={p.variant as "contained"}
          size={p.size as "medium"}
          disabled={p.disabled}
        >
          {content}
        </MuiButton>
      );
    if (d.name === "Input")
      return (
        <TextField
          style={style}
          label={p.text}
          variant={p.variant as "outlined"}
          disabled={p.disabled}
          size="small"
        />
      );
    return <MuiCard style={style}>{children}</MuiCard>;
  }
  if (d.library === "antd") {
    if (d.name === "Button")
      return (
        <AntButton
          style={style}
          type={p.variant as "primary"}
          size={p.size as "middle"}
          disabled={p.disabled}
        >
          {content}
        </AntButton>
      );
    if (d.name === "Input")
      return (
        <AntInput style={style} placeholder={p.text} disabled={p.disabled} />
      );
    return <AntCard style={style}>{children}</AntCard>;
  }
  if (d.name === "Button")
    return (
      <Button
        style={style}
        variant={p.variant as "default"}
        size={p.size as "default"}
        disabled={p.disabled}
      >
        {content}
      </Button>
    );
  if (d.name === "Input")
    return <Input style={style} placeholder={p.text} disabled={p.disabled} />;
  return <Card style={style}>{children}</Card>;
}
