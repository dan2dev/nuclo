// expect: Property 'longitude' is missing
// code: TS2345
import { type Double, native, render } from "../../../src/index.ts";

interface MapProps {
  latitude: Double;
  longitude: Double;
}

const MapView = native<MapProps>("MapView");

render(() => MapView({ latitude: 1 }));
