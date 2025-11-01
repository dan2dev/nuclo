export function dispatchGlobalUpdateEvent(): void {
  if (typeof document === "undefined") return;

  const targets: EventTarget[] = document.body ? [document.body, document] : [document];

  for (const target of targets) {
    try {
      target.dispatchEvent(new Event("update", { bubbles: true }));
    } catch (error) {
      console.error("Error dispatching global update event:", error);
    }
  }
}
