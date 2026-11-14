import { router } from "../app";
import { action, body, card, color, heading, muted, row } from "../ui";

interface Photo {
  id: string;
  title: string;
  place: string;
  story: string;
  likes: number;
  liked: boolean;
}

const photo = (id: string, title: string, place: string, likes: number, story: string): Photo => ({
  id,
  title,
  place,
  story,
  likes,
  liked: false,
});

const photos = [
  photo("aurora", "Night lights", "Tromsø, Norway", 482, "Green curtains over the fjord, an hour after midnight."),
  photo("dunes", "Soft ridges", "Merzouga, Morocco", 317, "The wind redraws every line of the dunes before sunrise."),
  photo("lagoon", "Still water", "Bacalar, Mexico", 256, "Seven shades of blue, and not a single wave."),
  photo("forest", "Morning mist", "Black Forest, Germany", 198, "Fog settles between the firs until the sun burns it off."),
  photo("ember", "Last light", "Santorini, Greece", 541, "The caldera glows for ten minutes, then the lamps come on."),
  photo("glacier", "Blue ice", "Jökulsárlón, Iceland", 364, "Icebergs drift from the glacier to the sea, one by one."),
];

/** The detail screen's navigation title. */
export const photoTitle = (id: string) => photos.find((item) => item.id === id)?.title ?? "Photo";

const src = (item: Photo) => `assets/${item.id}.jpg`;

const pairs: Photo[][] = [];
for (let i = 0; i < photos.length; i += 2) pairs.push(photos.slice(i, i + 2));

const tile = (item: Photo) =>
  div(
    {
      style: { flex: 1, backgroundColor: color.card, borderRadius: 14, padding: 8, gap: 6 },
      onClick: () => router.go(`/gallery/${item.id}`),
    },
    img({ src: src(item), style: { height: 104, borderRadius: 10 } }),
    heading(item.title, 14),
    muted(item.place, 12),
  );

export const Gallery = () =>
  div(
    { style: { gap: 12, padding: 16 } },
    ...pairs.map((pair) => div({ style: { flexDirection: "row", gap: 12 } }, ...pair.map(tile))),
  );

export const PhotoDetail = ({ id }: Record<string, string>) => {
  const index = photos.findIndex((item) => item.id === id);
  const item = photos[index];
  const next = photos[(index + 1) % photos.length];

  return div(
    { style: { gap: 12, padding: 16 } },
    card(
      img({ src: src(item), style: { height: 210, borderRadius: 10 } }),
      heading(item.title, 20),
      muted(item.place),
      body(item.story),
      div(
        { style: row },
        div(
          {
            style: () => ({
              backgroundColor: item.liked ? "#fee2e2" : color.field,
              borderRadius: 16,
              padding: 8,
            }),
            onClick: () => {
              item.liked = !item.liked;
              item.likes += item.liked ? 1 : -1;
              update();
            },
          },
          span(() => `${item.liked ? "♥" : "♡"} ${item.likes}`, {
            style: () => ({ color: item.liked ? color.bad : color.muted, fontSize: 14, fontWeight: "bold" }),
          }),
        ),
      ),
    ),
    action(`Next: ${next.title}`, () => router.go(`/gallery/${next.id}`)),
  );
};
