// block extract will get a parent and a index and will return an array of nodes that are managed by that block
// this will be used to extract the nodes managed by a block (like a list or a when) for hydration and diffing purposes
export function extractBlock(parent: HTMLElement, index: number) {
  // get the marker node at the specified index
  const node = parent.childNodes[index];
  if (!node) {
    return null;
  }
  if (node?.nodeType !== Node.COMMENT_NODE) {
    const commentNodeValues = String((node as Comment).nodeValue).split("-") || ['empty', 0];
    // const blockType = 

  } else {
    return [node];
  }
}