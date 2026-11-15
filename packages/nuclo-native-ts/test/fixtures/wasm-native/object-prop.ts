import { type Double, native } from "../../../src/index.ts";

interface Point {
  x: Double;
}
interface Props {
  at: Point;
}

const Chart = native<Props>("Chart");

export const App = () => Chart({ at: { x: 1 } });
