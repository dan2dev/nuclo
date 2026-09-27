import { Page } from "nuclo-pages";

export default Page({
  prerender: true,
  head: () => ({ title: "Fixture home" }),
  render: () => h1("Home"),
});
