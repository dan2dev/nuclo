/**
 * A stand-in for the database. The point of the demo is that the layer which
 * creates a record resolves with it, so the page underneath can fold it into
 * its own state without reloading or losing what the user had typed.
 */
export interface Option {
  id: string;
  label: string;
  category: string;
}

export interface Category {
  id: string;
  label: string;
}

export const categories: Category[] = [
  { id: "fruit", label: "Fruit" },
  { id: "veg", label: "Vegetable" },
];

export const options: Option[] = [
  { id: "apple", label: "Apple", category: "fruit" },
  { id: "pear", label: "Pear", category: "fruit" },
];

let serial = 0;
const nextId = (prefix: string) => `${prefix}-${++serial}`;

/** Both "writes" are async on purpose, like a real save would be. */
export async function createOption(label: string, category: string): Promise<Option> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const created: Option = { id: nextId("opt"), label, category };
  options.push(created);
  return created;
}

export async function createCategory(label: string): Promise<Category> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const created: Category = { id: nextId("cat"), label };
  categories.push(created);
  return created;
}
