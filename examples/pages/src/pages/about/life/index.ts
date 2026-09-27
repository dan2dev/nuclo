import type { PageProps } from "nuclo-pages";
import { listTodos } from "../../../server/todos";

export const prerender = true;

export const load = () => listTodos();

export const head = () => ({ title: "Life at Nuclo" });

export default function LifePage({ data }: PageProps<typeof load>) {
	const completed = data.filter((todo) => todo.done).length;

	return section(
		h1("Life at Nuclo"),
		p("Discover the people, values, and everyday moments that make life at Nuclo special."),
		h2("Todo progress"),
		p(`${completed} completed of ${data.length} total`),
		h2("A place to do your best work"),
		p("We bring curious people together to solve meaningful problems. Collaboration, trust, and room to grow shape how we work every day."),
		h2("People first"),
		p("We value kindness, celebrate progress, and make space for life beyond work. Everyone should feel welcome to contribute and be themselves."),
	);
}


// it should be like this

import { Page } from "nuclo-pages";

export default Page({
    prerender: true,
    load: () => listTodos(),
    head: () => ({ title: "Life at Nuclo" }),
    actions: {
        clearCompleted: () => {
            // action to clear completed todos
        }
    },
    render: ({ data }) => {
        const completed = data.filter((todo) => todo.done).length;
        return section(
            h1("Life at Nuclo"),
            p("Discover the people, values, and everyday moments that make life at Nuclo special."),
            h2("Todo progress"),
            p(`${completed} completed of ${data.length} total`),
            h2("A place to do your best work"),
            p("We bring curious people together to solve meaningful problems. Collaboration, trust, and room to grow shape how we work every day."),
            h2("People first"),
            p("We value kindness, celebrate progress, and make space for life beyond work. Everyone should feel welcome to contribute and be themselves."),
        );
    }
});