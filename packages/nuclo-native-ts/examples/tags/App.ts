/** Every tag that is a plain box, inline text, or draws nothing. The hidden ones hold text that must never show. */
import { area, base, bdi, bdo, body, col, colgroup, data, datalist, div, h2, head, html, link, map, meta, noscript, output, p, picture, render, rp, rt, ruby, script, slot, source, style, template, title, track, br, wbr } from "../../src/index.ts";

const App = () =>
  div(
    { style: { padding: 24, gap: 12 } },
    h2("Boxes"),
    html(body(picture(p("picture box")), map(p("map box")), slot(p("slot box")), colgroup(col(p("colgroup > col box"))))),
    h2("Text"),
    div({ style: { flexDirection: "row", gap: 8 } }, ruby("漢"), rp("("), rt("kan"), rp(")"), bdi("bdi"), bdo("bdo"), data("data"), output("output")),
    h2("Draws nothing"),
    head(p("HIDDEN head")),
    meta(p("HIDDEN meta")),
    base(p("HIDDEN base")),
    link(p("HIDDEN link")),
    script(p("HIDDEN script")),
    style(p("HIDDEN style")),
    title(p("HIDDEN title")),
    template(p("HIDDEN template")),
    noscript(p("HIDDEN noscript")),
    datalist(p("HIDDEN datalist")),
    area(p("HIDDEN area")),
    source(p("HIDDEN source")),
    track(p("HIDDEN track")),
    p("line"),
    br(),
    wbr(p("HIDDEN wbr")),
    p("end"),
  );

render(App);
