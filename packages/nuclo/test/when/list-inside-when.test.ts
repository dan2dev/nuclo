/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { when } from '../../src/when';
import { list } from '../../src/list';
import { update } from '../../src/core/updateController';

interface Item {
  id: number;
  name: string;
}

function getCommentNodes(container: HTMLElement) {
  return Array.from(container.childNodes).filter(n => n.nodeType === Node.COMMENT_NODE) as Comment[];
}

function findCommentIndex(container: HTMLElement, needle: string): number {
  return Array.from(container.childNodes).findIndex(n =>
    n.nodeType === Node.COMMENT_NODE && (n as Comment).textContent?.includes(needle)
  );
}

describe('List Inside When', () => {
  let container: HTMLElement;
  let condition: boolean;
  let items: Item[];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    condition = true;
    items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ];
  });

  it('renders list fully inside when marker region (ordering of markers)', () => {
    const whenFn = when(
      () => condition,
      list(() => items, (item: Item) => {
        const el = document.createElement('div');
        el.textContent = item.name;
        el.setAttribute('data-id', String(item.id));
        return el as any;
      })
    );

    whenFn(container as any, 0);
    update();

    // Collect indices of markers
    const whenStartIndex = findCommentIndex(container, 'when-start');
    const listStartIndex = findCommentIndex(container, 'list-start');
    const listEndIndex = findCommentIndex(container, 'list-end');
    const whenEndIndex = findCommentIndex(container, 'when-end');

    expect(whenStartIndex).toBeGreaterThanOrEqual(0);
    expect(listStartIndex).toBeGreaterThan(whenStartIndex);
    expect(listEndIndex).toBeGreaterThan(listStartIndex);
    expect(whenEndIndex).toBeGreaterThan(listEndIndex);

    // Ensure list end is immediately before when end (all list DOM is inside when)
    const listEndNode = container.childNodes[listEndIndex];
    const whenEndNode = container.childNodes[whenEndIndex];
    expect(listEndNode.nextSibling).toBe(whenEndNode);

    // Ensure items are between list markers
    const itemNodes = Array.from(container.querySelectorAll('[data-id]'));
    expect(itemNodes.map(n => n.textContent)).toEqual(['A', 'B', 'C']);
  });

  it('updates list while condition stays true', () => {
    const whenFn = when(
      () => condition,
      list(() => items, (item: Item) => {
        const span = document.createElement('span');
        span.textContent = `${item.id}:${item.name}`;
        span.setAttribute('data-id', String(item.id));
        return span as any;
      })
    );

    whenFn(container as any, 0);
    update();

    // Modify list (reorder + add + remove)
    items.splice(1, 1);            // remove id=2
    items.push({ id: 4, name: 'D' });
    items.unshift(items.pop()!);   // move new item to front
    update();

    const values = Array.from(container.querySelectorAll('[data-id]')).map(n => n.textContent);
    expect(values).toEqual(['4:D', '1:A', '3:C']);
  });

  it('removes list when condition becomes false and restores later with new data', () => {
    const whenFn = when(
      () => condition,
      list(() => items, (item: Item) => {
        const div = document.createElement('div');
        div.textContent = item.name;
        div.setAttribute('data-id', String(item.id));
        return div as any;
      })
    ).else('Hidden');

    whenFn(container as any, 0);
    update();

    // Initially visible
    expect(container.querySelectorAll('[data-id]')).toHaveLength(3);

    // Hide
    condition = false;
    update();

    expect(container.querySelectorAll('[data-id]')).toHaveLength(0);
    expect(container.textContent).toBe('Hidden');

    // Change data while hidden
    items.splice(0, items.length, { id: 10, name: 'X' }, { id: 11, name: 'Y' });

    // Show again
    condition = true;
    update();

    const rendered = Array.from(container.querySelectorAll('[data-id]')).map(n => n.textContent);
    expect(rendered).toEqual(['X', 'Y']);

    // Ensure marker ordering still correct after re-show
    const whenStartIndex = findCommentIndex(container, 'when-start');
    const listStartIndex = findCommentIndex(container, 'list-start');
    const listEndIndex = findCommentIndex(container, 'list-end');
    const whenEndIndex = findCommentIndex(container, 'when-end');
    expect(whenStartIndex).toBeLessThan(listStartIndex);
    expect(listStartIndex).toBeLessThan(listEndIndex);
    expect(listEndIndex).toBeLessThan(whenEndIndex);
  });

  it('list in else branch works and toggles correctly', () => {
    const whenFn = when(
      () => condition,
      'Shown'
    ).else(
      list(() => items, (item: Item) => {
        const li = document.createElement('li');
        li.textContent = item.name;
        li.setAttribute('data-id', String(item.id));
        return li as any;
      })
    );

    whenFn(container as any, 0);
    update();

    expect(container.textContent).toBe('Shown');
    expect(container.querySelectorAll('[data-id]')).toHaveLength(0);

    condition = false;
    update();
    expect(container.querySelectorAll('[data-id]')).toHaveLength(3);

    // Modify items while list visible in else
    items.reverse();
    update();
    const order = Array.from(container.querySelectorAll('[data-id]')).map(n => n.textContent);
    expect(order).toEqual(['C', 'B', 'A']);

    // Toggle back to when branch removes list
    condition = true;
    update();
    expect(container.textContent).toBe('Shown');
    expect(container.querySelectorAll('[data-id]')).toHaveLength(0);
  });

  it('no stray list markers outside when region', () => {
    const whenFn = when(
      () => condition,
      list(() => items, (item: Item) => {
        const el = document.createElement('div');
        el.textContent = item.name;
        el.setAttribute('data-id', String(item.id));
        return el as any;
      })
    );

    whenFn(container as any, 0);
    update();

    // Snapshot marker texts in order
    const comments = getCommentNodes(container).map(c => c.textContent || '');
    // Expect pattern: when-start..., list-start..., list-end, when-end
    const hasWhenStart = comments.some(t => t.includes('when-start'));
    const hasWhenEnd = comments.some(t => t.includes('when-end'));
    const hasListStart = comments.some(t => t.includes('list-start'));
    const hasListEnd = comments.some(t => t.includes('list-end'));
    expect(hasWhenStart && hasWhenEnd && hasListStart && hasListEnd).toBe(true);

    const sequenceIndices = {
      whenStart: comments.findIndex(t => t.includes('when-start')),
      listStart: comments.findIndex(t => t.includes('list-start')),
      listEnd: comments.findIndex(t => t.includes('list-end')),
      whenEnd: comments.findIndex(t => t.includes('when-end')),
    };

    expect(sequenceIndices.whenStart).toBeLessThan(sequenceIndices.listStart);
    expect(sequenceIndices.listStart).toBeLessThan(sequenceIndices.listEnd);
    expect(sequenceIndices.listEnd).toBeLessThan(sequenceIndices.whenEnd);
  });
});