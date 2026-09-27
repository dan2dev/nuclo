import { Page } from "nuclo-pages";
import { clearCompleted, listTodos } from "../../../server/todos";

export default Page({
    prerender: true,
    load: async () => listTodos(),
    head: () => ({ title: "Life at Nuclo" }),
    actions: {
        clearCompleted: () => {
            // action to clear completed todos
            clearCompleted();
        }
    },
    render: ({ data, actions }) => {
        const completed = data.filter((todo) => todo.done).length;
        return section(
            h1("Life at Nuclo"),
            p("Discover the people, values, and everyday moments that make life at Nuclo special."),
            h2("Todo progress"),
            p(`${completed} completed of ${data.length} total`),
            button({ onClick: () => actions.clearCompleted() }, "Clear completed"),
            h2("A place to do your best work"),
            p("We bring curious people together to solve meaningful problems. Collaboration, trust, and room to grow shape how we work every day."),
            h2("People first"),
            p("We value kindness, celebrate progress, and make space for life beyond work. Everyone should feel welcome to contribute and be themselves."),
        );
    }
});
