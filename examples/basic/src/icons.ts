/**
 * SVG Icon Components
 * Demonstrates type-safe SVG element creation with Nuclo
 *
 * Note: The global SVG tags use the {tagName}Svg naming convention
 * (e.g., svgSvg, pathSvg, circleSvg, lineSvg, polylineSvg)
 * after importing nuclo in the main entry point
 */

// Ensure nuclo globals are available
import "nuclo";

/**
 * Trash/Delete Icon
 * Used for deleting todo items
 */
export const TrashIcon = () => svgSvg(
  {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    className: "icon"
  },
  pathSvg({
    d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  }),
  lineSvg({
    x1: "10",
    y1: "11",
    x2: "10",
    y2: "17",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round"
  }),
  lineSvg({
    x1: "14",
    y1: "11",
    x2: "14",
    y2: "17",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round"
  })
);

/**
 * Checkmark Icon
 * Used to indicate completed todos
 */
export const CheckIcon = () => svgSvg(
  {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    className: "icon check-icon"
  },
  polylineSvg({
    points: "20 6 9 17 4 12",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  })
);

/**
 * Plus Icon
 * Used for add button
 */
export const PlusIcon = () => svgSvg(
  {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    className: "icon"
  },
  lineSvg({
    x1: "12",
    y1: "5",
    x2: "12",
    y2: "19",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round"
  }),
  lineSvg({
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round"
  })
);

/**
 * Circle Icon for empty state
 */
export const CircleIcon = () => svgSvg(
  {
    width: "48",
    height: "48",
    viewBox: "0 0 24 24",
    fill: "none",
    className: "icon empty-icon"
  },
  circleSvg({
    cx: "12",
    cy: "12",
    r: "10",
    stroke: "currentColor",
    "stroke-width": "2"
  })
);
