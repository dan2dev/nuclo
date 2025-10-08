import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createConditionalElement } from '../../src/core/conditionalRenderer';
import { updateConditionalElements } from '../../src/core/conditionalUpdater';

describe('conditionalUpdater.updateConditionalElements', () => {
  let container: HTMLDivElement;
  let visible: boolean;
  let toggleCalls: number;
  let errorSpy: ReturnType<typeof vi.fn>;
  let originalConsoleError: any;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    visible = true;
    toggleCalls = 0;
    originalConsoleError = console.error;
    errorSpy = vi.fn();
    console.error = errorSpy as any;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  function makeCondition() {
    return () => {
      toggleCalls += 1;
      return visible;
    };
  }

  it('replaces a hidden comment with an element when condition becomes true', () => {
    visible = false;
    const node = createConditionalElement('div', makeCondition(), ['Hello', { id: 'demo' }]);
    // Initially false => comment
    expect(node.nodeType).toBe(Node.COMMENT_NODE);
    container.appendChild(node as unknown as Node);

    visible = true;
    updateConditionalElements();

    // The original comment should have been replaced in the DOM
    const childNodes = Array.from(container.childNodes);
    expect(childNodes.length).toBe(1);
    const el = childNodes[0] as Element;
    expect(el.nodeType).toBe(Node.ELEMENT_NODE);
    expect((el as HTMLElement).tagName.toLowerCase()).toBe('div');
    expect(el.textContent).toBe('Hello');
    expect((el as HTMLElement).id).toBe('demo');
  });

  it('replaces a visible element with a comment when condition becomes false', () => {
    visible = true;
    const node = createConditionalElement('div', makeCondition(), ['World', { className: 'x' }]);
    expect(node.nodeType).toBe(Node.ELEMENT_NODE);
    container.appendChild(node as unknown as Node);
    const originalEl = node as HTMLElement;

    visible = false;
    updateConditionalElements();

    const childNodes = Array.from(container.childNodes);
    expect(childNodes.length).toBe(1);
    const comment = childNodes[0];
    expect(comment.nodeType).toBe(Node.COMMENT_NODE);
    // Original element should no longer be connected
    expect(originalEl.isConnected).toBe(false);
  });

  it('does nothing when condition result is unchanged (element stays element)', () => {
    visible = true;
    const node = createConditionalElement('div', makeCondition(), ['Stay']);
    container.appendChild(node as unknown as Node);
    const firstRef = node;

    updateConditionalElements();

    const onlyChild = container.firstChild;
    expect(onlyChild).toBe(firstRef);
    expect(onlyChild?.nodeType).toBe(Node.ELEMENT_NODE);
  });

  it('does nothing when condition result is unchanged (comment stays comment)', () => {
    visible = false;
    const node = createConditionalElement('div', makeCondition(), ['Hidden']);
    container.appendChild(node as unknown as Node);
    const firstRef = node;

    updateConditionalElements();

    const onlyChild = container.firstChild;
    expect(onlyChild).toBe(firstRef);
    expect(onlyChild?.nodeType).toBe(Node.COMMENT_NODE);
  });

  it('re-creates a new element instance each time it transitions from hidden to visible', () => {
    visible = false;
    const conditional = createConditionalElement('div', makeCondition(), ['Cycle', { 'data-cyclic': '1' }]);
    container.appendChild(conditional as unknown as Node);

    visible = true;
    updateConditionalElements();
    const el1 = container.firstChild;
    expect(el1?.nodeType).toBe(Node.ELEMENT_NODE);

    visible = false;
    updateConditionalElements();
    expect(container.firstChild?.nodeType).toBe(Node.COMMENT_NODE);

    visible = true;
    updateConditionalElements();
    const el2 = container.firstChild;
    expect(el2?.nodeType).toBe(Node.ELEMENT_NODE);
    expect(el2).not.toBe(el1);
    expect((el2 as Element).getAttribute('data-cyclic')).toBe('1');
  });

  it('applies modifiers (text + attributes) on every recreation', () => {
    visible = false;
    const conditional = createConditionalElement(
      'div',
      makeCondition(),
      [
        () => 'dynamic text',
        { id: 'alpha', title: 'first' }
      ]
    );
    container.appendChild(conditional as unknown as Node);

    visible = true;
    updateConditionalElements();
    const el = container.firstChild as HTMLElement;
    expect(el.id).toBe('alpha');
    expect(el.title).toBe('first');
    expect(el.textContent).toBe('dynamic text');

    // Change modifiers by mutating stored conditional info and force another cycle
    const info = (el as any)._conditionalInfo || (container.firstChild as any)._conditionalInfo;
    // Replace modifiers array (simulate user-supplied reactive scenario)
    info.modifiers = [
      'second text',
      { id: 'beta', title: 'second' }
    ];

    visible = false;
    updateConditionalElements(); // element -> comment
    visible = true;
    updateConditionalElements(); // comment -> new element
    const newEl = container.firstChild as HTMLElement;
    expect(newEl).not.toBe(el);
    expect(newEl.id).toBe('beta');
    expect(newEl.title).toBe('second');
    expect(newEl.textContent).toBe('second text');
  });

  it('handles multiple conditional nodes independently', () => {
    let aVisible = true;
    let bVisible = false;

    const a = createConditionalElement('span', () => aVisible, ['A']);
    const b = createConditionalElement('span', () => bVisible, ['B']);

    container.appendChild(a as unknown as Node);
    container.appendChild(b as unknown as Node);

    // Initial states
    expect(container.childNodes[0].nodeType).toBe(Node.ELEMENT_NODE);
    expect(container.childNodes[1].nodeType).toBe(Node.COMMENT_NODE);

    // Flip both
    aVisible = false;
    bVisible = true;
    updateConditionalElements();

    expect(container.childNodes[0].nodeType).toBe(Node.COMMENT_NODE);
    expect(container.childNodes[1].nodeType).toBe(Node.ELEMENT_NODE);
    expect((container.childNodes[1] as HTMLElement).textContent).toBe('B');
  });

  it('logs errors when a condition throws during update and treats it as false', () => {
    let shouldThrow = true;
    const condition = () => {
      if (shouldThrow) {
        shouldThrow = false; // throw only first evaluation
        throw new Error('boom');
      }
      return true;
    };

    // Start with a safe value so creation doesn't throw
    let initial = false;
    const safeCondition = () => {
      if (initial) return condition();
      return false;
    };
    const node = createConditionalElement('div', safeCondition, ['Err']);
    container.appendChild(node as unknown as Node);

    // Activate path that throws inside update
    initial = true;
    updateConditionalElements();

    // After first update (throw) it should remain (or become) a comment
    expect(container.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
    expect(errorSpy).toHaveBeenCalled(); // runCondition error path logs via console.error

    // Second update (no throw) should now show element
    updateConditionalElements();
    expect(container.firstChild?.nodeType).toBe(Node.ELEMENT_NODE);
  });

  it('preserves stored conditional info across replacements', () => {
    visible = true;
    const node = createConditionalElement('div', makeCondition(), ['Persist']);
    container.appendChild(node as unknown as Node);
    const info1 = (node as any)._conditionalInfo;
    expect(info1).toBeTruthy();

    visible = false;
    updateConditionalElements();
    const comment = container.firstChild as any;
    expect(comment.nodeType).toBe(Node.COMMENT_NODE);
    const info2 = comment._conditionalInfo;
    expect(info2).toEqual(info1); // reference equality preserved

    visible = true;
    updateConditionalElements();
    const el2 = container.firstChild as any;
    const info3 = el2._conditionalInfo;
    expect(info3).toEqual(info1);
  });

  it('does not duplicate nodes when no state change occurs', () => {
    visible = true;
    const node = createConditionalElement('div', makeCondition(), ['Once']);
    container.appendChild(node as unknown as Node);

    const firstChild = container.firstChild;
    updateConditionalElements();
    expect(container.childNodes.length).toBe(1);
    expect(container.firstChild).toBe(firstChild);
  });
});