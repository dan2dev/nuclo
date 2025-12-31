// block extract will get a parent and a index and will return an array of nodes that are managed by that block
// this will be used to extract the nodes managed by a block (like a list or a when) for hydration and diffing purposes
export function extractBlock(parent: HTMLElement, index: number) {
  // get the marker node at the specified index
  const marker = parent.childNodes[index];
}