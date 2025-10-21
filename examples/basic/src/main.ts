import "./style.css";
import "nuclo";
import { styleSetup } from "./styling-poc";
import { store } from "./store";

const appRoot = document.querySelector<HTMLDivElement>("#app")!;

// Initialize the utility-first CSS framework with responsive breakpoints
const style = styleSetup({
  size: {
    sm: "min-width: 600px and max-width: 1024px",
    lg: "min-width: 1025px",
  },
  colors: {
    blue: "#007bff",
    red: "#dc3545",
    green: "#28a745",
    gray: "#6c757d",
    black: "#000000",
    white: "#ffffff",
  }
});

const app = div(
  // Main container with responsive layout
  style.cn({
    "sm": ["flex", "flex-col", "bg-blue", "w-full", "h-full", "p-4"],
    "lg": ["flex", "flex-row", "bg-red", "w-500px", "h-500px", "p-6"],
  }),
  
  // Header section
  div(
    style.cn(["flex", "flex-col", "items-center", "justify-center", "p-4", "bg-black", "rounded-lg", "m-2"]),
    h1(
      style.cn(["text-gray-900", "font-bold", "text-center"]),
      "Nuclo Counter App"
    ),
    p(
      style.cn(["text-gray-600", "text-center"]),
      "Built with utility-first CSS framework"
    )
  ),
  
  // Counter display
  div(
    style.cn(["flex", "flex-row", "items-center", "justify-center", "p-6",  "rounded-xl", "m-2"]),
    h2(
      style.cn(["text-blue", "font-extrabold", "text-center"]),
      "Counter: ",
      span(
        style.cn(["text-red", "font-bold"]),
        () => store.counter
      )
    )
  ),
  
  // Button controls
  div(
    style.cn(["flex", "flex-row", "items-center", "justify-center", "gap-4"]),
    button(
      "+", 
      style.cn(["p-3", "m-1", "rounded-md", "bg-green", "text-white", "font-bold"]),
      on("click", store.increment)
    ),
    button(
      "Reset", 
      style.cn(["p-3", "m-1", "rounded-md", "bg-gray", "text-white", "font-bold"]),
      on("click", store.reset)
    ),
    button(
      "-", 
      style.cn(["p-3", "m-1", "rounded-md", "bg-red", "text-white", "font-bold"]),
      on("click", store.decrement)
    )
  ),
  
  // Footer
  div(
    style.cn(["text-white", "text-center", "p-2"]),
    "Utility-first CSS framework for nuclo"
  )
);

render(app, appRoot);