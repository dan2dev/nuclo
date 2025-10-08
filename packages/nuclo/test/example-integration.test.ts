// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import '../src/index.js'; // This auto-initializes the globals

describe('Example Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should work like the main example', () => {
    const items = [
      { id: 1, name: 'Item 1', price: 10 },
      { id: 2, name: 'Item 2', price: 20 },
      { id: 3, name: 'Item 3', price: 30 },
    ];

    // Test that global functions are available
    expect(typeof div).toBe('function');
    expect(typeof list).toBe('function');
    expect(typeof update).toBe('function');
    expect(typeof button).toBe('function');
    expect(typeof h1).toBe('function');

    // Create the app structure similar to the example
    const app = div(
      "Hello, world!",
      "this is another string",
      h1("View Craft Basic Example"),
      div("This is a simple example of using View Craft to create DOM elements."),
      button((e) => {
        e.addEventListener?.("click", () => {
          items.push({ id: items.length + 1, name: `Item ${items.length + 1}`, price: 10 });
          update();
        });
      }),
      list(() => items, (item) => div(item.name)),
    )(document.body, 0);

    document.body.appendChild(app as Node);

    // Verify initial structure
    expect(document.body.children).toHaveLength(1);
    const mainDiv = document.body.children[0];

    // Find the list items (they should be div elements with item names)
    const listItems = Array.from(mainDiv.querySelectorAll('div')).filter(el =>
      el.textContent && el.textContent.startsWith('Item ')
    );
    expect(listItems).toHaveLength(3);
    expect(listItems[0].textContent).toBe('Item 1');
    expect(listItems[1].textContent).toBe('Item 2');
    expect(listItems[2].textContent).toBe('Item 3');

    // Test adding item and updating
    items.push({ id: 4, name: 'Item 4', price: 40 });
    update();

    const updatedListItems = Array.from(mainDiv.querySelectorAll('div')).filter(el =>
      el.textContent && el.textContent.startsWith('Item ')
    );
    expect(updatedListItems).toHaveLength(4);
    expect(updatedListItems[3].textContent).toBe('Item 4');

    // Test removing item and updating
    items.pop(); // This should remove Item 4
    update();

    const finalListItems = Array.from(mainDiv.querySelectorAll('div')).filter(el =>
      el.textContent && el.textContent.startsWith('Item ')
    );

    expect(finalListItems).toHaveLength(3);
    expect(finalListItems[0].textContent).toBe('Item 1');
    expect(finalListItems[1].textContent).toBe('Item 2');
    expect(finalListItems[2].textContent).toBe('Item 3');
  });

  it('should handle button clicks and style updates', () => {
    let data = { color: "green" };

    const app = div(
      button(
        {
          id: "myButton",
          className: () => data.color,
        },
        {
          style: () => ({
            color: "green",
            fontSize: data.color === "blue" ? "20px" : "40px",
            backgroundColor: data.color,
            padding: "10px 20px",
            borderRadius: "5px",
          }),
        },
        "Click me",
        (e) => {
          e.addEventListener?.("click", (event) => {
            data.color = data.color === "green" ? "blue" : "green";
            event.currentTarget?.dispatchEvent(new Event("update", { bubbles: true }));
          });
        }
      ),
    )(document.body, 0);

    document.body.appendChild(app as Node);

    const buttonEl = document.querySelector('#myButton') as HTMLButtonElement;
    expect(buttonEl).toBeTruthy();
    expect(buttonEl.className).toBe('green');
    expect(buttonEl.textContent).toBe('Click me');

    // Simulate click
    buttonEl.click();

    // The reactive attributes should update on the "update" event
    expect(buttonEl.className).toBe('blue');
  });
});
