import { registerGlobalTagBuilders } from "./tagRegistry";
import { list } from "../list";
import { update } from "./updateController";
import { when } from "../when";
import { on } from "../utility/on";
import { render } from "../utility/render";
import {
  createCSSClass,
  createBreakpoints,
  bg,
  color,
  fontSize,
  flex,
  center,
  bold,
  padding,
  margin,
  width,
  height,
  border,
  borderRadius,
  textAlign,
  gap,
  flexDirection,
  grid,
  position,
  opacity,
  cursor
} from "../style";

/**
 * Initializes the nuclo runtime by exposing tag builders and utilities.
 */
export function initializeRuntime(): void {
  registerGlobalTagBuilders();

  if (typeof globalThis !== "undefined") {
    const registry = globalThis as Record<string, unknown>;
    registry.list = list;
    registry.update = update;
    registry.when = when;
    registry.on = on;
    registry.render = render;

    // Style utilities
    registry.createCSSClass = createCSSClass;
    registry.createBreakpoints = createBreakpoints;
    registry.bg = bg;
    registry.color = color;
    registry.fontSize = fontSize;
    registry.flex = flex;
    registry.center = center;
    registry.bold = bold;
    registry.padding = padding;
    registry.margin = margin;
    registry.width = width;
    registry.height = height;
    registry.border = border;
    registry.borderRadius = borderRadius;
    registry.textAlign = textAlign;
    registry.gap = gap;
    registry.flexDirection = flexDirection;
    registry.grid = grid;
    registry.position = position;
    registry.opacity = opacity;
    registry.cursor = cursor;
  }
}

if (typeof globalThis !== "undefined") {
  initializeRuntime();
}
