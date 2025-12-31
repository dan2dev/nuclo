
type TextSource = string | number | (() => string | number | null | undefined);

// Creates a function that manages a text node in the DOM, supporting both static and dynamic sources
function text(source: TextSource, initialValue?: string | number) {
  // Check if the source is a function (dynamic value)
  const isFn: boolean = Boolean(typeof source === "function");

  // Return a function that will insert/update the text node in the parent at the given index
  return function (parent: HTMLElement, index: number) {
    // Try to get the marker node at the specified index
    let marker = parent.childNodes[index];
    // If the marker is not a comment node, create a new comment node as a marker
    if (marker?.nodeType !== Node.COMMENT_NODE) {
      marker = document.createComment(`text-${index}`); // Used to mark the position for the text node
      // Insert the marker at the correct position; if index is out of bounds, it appends
      parent.insertBefore(marker, parent.childNodes[index] ?? null);
    }

    // The text node should be immediately after the marker
    let node = marker.nextSibling;
    // If the node after the marker is not a text node, create a new text node and insert it
    if (node?.nodeType !== Node.TEXT_NODE) {
      node = document.createTextNode("");
      // Insert the text node right after the marker
      parent.insertBefore(node, marker.nextSibling);
    }

    // Cast the node to a Text node for type safety
    const textNode = node as Text;
    if (isFn) {
      // If the source is a function, set up dynamic updating
      // Helper to read the current value from the source function
      const read = () => String(((source as () => any)() as any) ?? "");
      // Determine the initial text content
      const newTextContent = initialValue === undefined ? read() : String(initialValue);
      // Update the text node if the content has changed
      if (textNode.textContent !== newTextContent) {
        textNode.textContent = newTextContent;
      }
      // Attach an update method to the text node for future updates
      (textNode as any).update = () => {
        const newTextContent = read();
        if (textNode.textContent !== newTextContent) {
          textNode.textContent = newTextContent;
        }
      }
    } else {
      // If the source is static (string or number), just set the text content
      const newTextContent = initialValue === undefined ? String(source ?? "") : String(initialValue);
      if (textNode.textContent !== newTextContent) {
        textNode.textContent = newTextContent;
      }
      // Remove the update method if it exists, since it's not needed for static text
      delete (textNode as any).update;
    }

    // Return both the marker and the text node for further processing
    return [marker, textNode];
  };
}
export default text;

export { text, type TextSource };