export const prerender = true;

export const head = () => ({ title: "Fixture home" });

export default function Home() {
  return h1("Home");
}
