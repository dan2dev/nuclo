import { nativeView } from "nuclo-native";

const places = [
  { name: "Parque Ibirapuera", latitude: -23.5874, longitude: -46.6576 },
  { name: "MASP", latitude: -23.5614, longitude: -46.6559 },
];
type Place = (typeof places)[number];
let place = places[0]!;
let selected = "";
let visible = true;

function select(spot: Place) {
  selected = spot.name;
  update();
}

render(() => div(
  { style: { padding: 20, gap: 12 } },
  h1("São Paulo"),
  div({ style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } },
    ...places.map((spot) => button(spot.name, {
      "aria-selected": () => String(place === spot),
      onClick: () => { place = spot; selected = ""; update(); },
    })),
  ),
  button(() => visible ? "Ocultar local" : "Mostrar local", { onClick: () => { visible = !visible; update(); } }),
  when(() => visible, nativeView<Place, Place>("example.place-map", {
    props: () => place,
    style: { height: 320, borderRadius: 12 },
    onEvent: select,
    fallback: div(
      { style: { minHeight: 100, gap: 8 } },
      h2(() => place.name),
      span(() => `${place.latitude}, ${place.longitude}`),
      button("Selecionar local", { onClick: () => select(place) }),
    ),
  })),
  p(() => selected ? `Local selecionado: ${selected}` : "Selecione um local."),
), document.body);
