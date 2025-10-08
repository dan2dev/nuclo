export function dispatchGlobalUpdateEvent(): void {
  if (typeof document === "undefined") {
    return;
  }

  const targets: EventTarget[] = [];
  if (document.body) {
    targets.push(document.body);
  }
  targets.push(document);

  targets.forEach((target) => {
    try {
      target.dispatchEvent(new Event("update", { bubbles: true }));
    } catch (error) {
      console.error("Error dispatching global update event:", error);
    }
  });
}
