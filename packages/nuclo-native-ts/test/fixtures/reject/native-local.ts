// expect: Declare a native component as a top-level const
import { type Double, native, render } from "../../../src/index.ts";

interface MapProps {
  latitude: Double;
}

function App() {
  const MapView = native<MapProps>("MapView");
  return MapView({ latitude: 1 });
}

render(App);
