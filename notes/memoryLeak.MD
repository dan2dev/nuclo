Greate source on avoiding memory leaks from event listeners in JavaScript:
source: https://dev.to/alex_aslam/how-to-avoid-memory-leaks-in-javascript-event-listeners-4hna
by: Alex Aslam


Why Do Event Listeners Cause Memory Leaks?
When you add an event listener to a DOM element, the browser retains a reference to that element and the listener function. If the element is removed from the DOM without removing the listener, the browser’s garbage collector can’t free the memory because the listener still references the element. Over time, these orphaned listeners accumulate, consuming memory unnecessarily.

Example Scenario:

Imagine a single-page app (SPA) where a modal is dynamically added and removed. If the modal’s close button has an event listener that isn’t cleaned up, the listener (and the modal’s DOM elements) linger in memory even after the modal is closed.

Common Causes of Event Listener Leaks
1. Dynamically Removed Elements
   // Add a listener to a button
   const button = document.createElement("button");
   button.textContent = "Click me";
   button.addEventListener("click", () => {
     console.log("Button clicked!");
   });
   document.body.appendChild(button);

   // Later, remove the button without removing the listener
   button.remove();
   // The listener still references the removed button! 🚫
2. Anonymous Functions
Using anonymous functions makes it impossible to remove the listener later:

   element.addEventListener("click", () => {
     // Anonymous function: no reference to remove!
   });
3. Long-Lived Applications (SPAs)
In SPAs, components are frequently mounted/unmounted. Forgetting to clean up listeners during unmounting causes gradual memory bloat.

Fixes to Prevent Memory Leaks
1. Always Remove Listeners Explicitly
Store a reference to the listener function and use removeEventListener when the element is removed.

// Use a named function
const handleClick = () => {
  console.log("Button clicked!");
};

// Add listener
button.addEventListener("click", handleClick);

// Later, remove the listener and element
button.removeEventListener("click", handleClick);
button.remove(); // Now eligible for garbage collection ✅
2. Use Event Delegation
Attach a single listener to a parent element instead of multiple child elements. This avoids adding/removing listeners for dynamic content.

// Listen for clicks on the parent
document.getElementById("parent").addEventListener("click", (event) => {
  if (event.target.matches(".dynamic-button")) {
    console.log("Dynamic button clicked!");
  }
});
3. Leverage Framework Lifecycle Methods
In React, Vue, or Angular, use built-in cleanup hooks:

React Example:

useEffect(() => {
  const handleClick = () => { /* ... */ };
  buttonRef.current.addEventListener("click", handleClick);

  // Cleanup on component unmount
  return () => {
    buttonRef.current.removeEventListener("click", handleClick);
  };
}, []);
4. Avoid Anonymous Functions
If you must use anonymous functions, store the reference:

const listener = () => { /* ... */ };
element.addEventListener("click", listener);
// Later...
element.removeEventListener("click", listener);
Advanced Solutions
WeakRef and FinalizationRegistry (ES2021+)
For edge cases, use WeakRef to hold weak references to elements, allowing garbage collection even if listeners exist.

const elementRef = new WeakRef(element);
const listener = () => { /* ... */ };
elementRef.deref().addEventListener("click", listener);

// When the element is removed, WeakRef allows GC to clean up.
Debugging Memory Leaks
Use browser DevTools to identify lingering listeners:

Chrome DevTools:

Open the Elements panel.
Select an element and check the Event Listeners tab.
Look for listeners attached to removed elements.
Firefox Developer Tools:

Use the Inspector tab to audit event listeners.
Best Practices Summary
Do	Don’t
Remove listeners with removeEventListener	Leave listeners attached to removed elements
Use event delegation for dynamic content	Attach individual listeners to many elements
Leverage framework lifecycle methods	Assume frameworks handle all cleanup
Test with DevTools	Ignore memory profiling
