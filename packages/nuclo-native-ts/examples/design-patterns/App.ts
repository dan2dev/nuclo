/**
 * Design patterns: the 23 GoF patterns and five common ones, written without classes, `this` or
 * generics (interfaces with function fields and closures instead), and five of them again with
 * classes, compiled to Swift, Kotlin and Rust. Each card shows what its demo printed, so the
 * targets can be compared line by line.
 */
import { type Style, button, div, h1, h2, list, p, render, small, update } from "../../src/index.ts";
import {
  singleton,
  factoryMethod,
  abstractFactory,
  builder,
  prototypePattern,
  adapter,
  bridge,
  composite,
  decorator,
  facade,
  flyweight,
  proxy,
  chainOfResponsibility,
  command,
  interpreter,
  iterator,
  mediator,
  memento,
  observer,
  state,
  strategy,
  templateMethod,
  visitor,
  modulePattern,
  nullObject,
  dependencyInjection,
  publishSubscribe,
  specification,
} from "./patterns.ts";
import { strategyClasses, observerClasses, stateClasses, visitorClasses, templateMethodClasses } from "./classes.ts";

interface Demo {
  category: string;
  name: string;
  run: () => string[];
  lines: string[];
}

function demo(category: string, name: string, run: () => string[]): Demo {
  return { category: category, name: name, run: run, lines: run() };
}

const demos: Demo[] = [
  demo("Creational", "Singleton", singleton),
  demo("Creational", "Factory Method", factoryMethod),
  demo("Creational", "Abstract Factory", abstractFactory),
  demo("Creational", "Builder", builder),
  demo("Creational", "Prototype", prototypePattern),
  demo("Structural", "Adapter", adapter),
  demo("Structural", "Bridge", bridge),
  demo("Structural", "Composite", composite),
  demo("Structural", "Decorator", decorator),
  demo("Structural", "Facade", facade),
  demo("Structural", "Flyweight", flyweight),
  demo("Structural", "Proxy", proxy),
  demo("Behavioral", "Chain of Responsibility", chainOfResponsibility),
  demo("Behavioral", "Command", command),
  demo("Behavioral", "Interpreter", interpreter),
  demo("Behavioral", "Iterator", iterator),
  demo("Behavioral", "Mediator", mediator),
  demo("Behavioral", "Memento", memento),
  demo("Behavioral", "Observer", observer),
  demo("Behavioral", "State", state),
  demo("Behavioral", "Strategy", strategy),
  demo("Behavioral", "Template Method", templateMethod),
  demo("Behavioral", "Visitor", visitor),
  demo("Beyond GoF", "Module", modulePattern),
  demo("Beyond GoF", "Null Object", nullObject),
  demo("Beyond GoF", "Dependency Injection", dependencyInjection),
  demo("Beyond GoF", "Publish / Subscribe", publishSubscribe),
  demo("Beyond GoF", "Specification", specification),
  demo("With classes", "Strategy", strategyClasses),
  demo("With classes", "Observer", observerClasses),
  demo("With classes", "State", stateClasses),
  demo("With classes", "Visitor", visitorClasses),
  demo("With classes", "Template Method", templateMethodClasses),
];

let runs = 1;

const card: Style = { padding: 14, gap: 6, borderRadius: 10, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0" };
const line: Style = { fontSize: 13, color: "#334155" };

const DemoCard = (d: Demo) =>
  div(
    { style: card },
    small(d.category),
    h2(d.name),
    list(() => d.lines, (text: string) => p({ style: line }, text)),
  );

const App = () =>
  div(
    { style: { padding: 20, gap: 12, backgroundColor: "#f8fafc" } },
    h1("Design patterns"),
    p(() => `${demos.length} patterns · run ${runs} time${runs === 1 ? "" : "s"}`),
    button("Run all again", {
      onClick: () => {
        for (const d of demos) d.lines = d.run();
        runs += 1;
        update();
      },
    }),
    list(() => demos, DemoCard),
  );

render(App);
