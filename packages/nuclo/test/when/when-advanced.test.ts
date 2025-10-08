/**
 * @vitest-environment jsdom
 *
 * Advanced tests for the `when` conditional system:
 *  - Multiple element branches
 *  - Branch identity preservation
 *  - Nested when scenarios
 *  - Lists inside when (structural + simple content mixing)
 *  - Reactive text + attribute updates inside stable branch
 *  - Performance / no-op branch updates
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { when, updateWhenRuntimes, clearWhenRuntimes } from '../../src/when';
import { list } from '../../src/list';
import { update } from '../../src';

// Access global tag builders (registered automatically via runtime bootstrap)
declare const div: any;
declare const h1: any;
declare const h2: any;
declare const span: any;
declare const section: any;

describe('when (advanced scenarios)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    clearWhenRuntimes();
    container.remove();
  });

  describe('multiple element branches', () => {
    it('renders multiple sibling elements in matching when branch', () => {
      let color = 'blue';
      const block = when(
        () => color === 'blue',
        h1('blue A', { className: 'blue-a' }),
        h2('blue B', { className: 'blue-b' }),
      )
      .when(
        () => color === 'red',
        h1('red A', { className: 'red-a' }),
        h2('red B', { className: 'red-b' }),
      )
      .else(
        h1('fallback A', { className: 'fallback-a' }),
        h2('fallback B', { className: 'fallback-b' }),
      );

      block(container as any, 0);
      updateWhenRuntimes();

      const blueH1 = container.querySelector('.blue-a');
      const blueH2 = container.querySelector('.blue-b');
      expect(blueH1?.textContent).toBe('blue A');
      expect(blueH2?.textContent).toBe('blue B');

      color = 'red';
      updateWhenRuntimes();

      expect(container.querySelector('.blue-a')).toBeFalsy();
      expect(container.querySelector('.red-a')?.textContent).toBe('red A');
      expect(container.querySelector('.red-b')?.textContent).toBe('red B');

      color = 'none';
      updateWhenRuntimes();

      expect(container.querySelector('.fallback-a')?.textContent).toBe('fallback A');
      expect(container.querySelector('.fallback-b')?.textContent).toBe('fallback B');
    });

    it('preserves element identity when branch condition stays true', () => {
      let visible = true;
      let counter = 0;

      const block = when(
        () => visible,
        h1(() => `counter:${counter}`, { id: 'head' }),
        h2('static', { id: 'sub' }),
      ).else(
        h1('hidden now', { id: 'hidden' })
      );

      block(container as any, 0);
      update(); // full pipeline so reactive text can settle

      const h1El = container.querySelector('#head');
      const h2El = container.querySelector('#sub');
      expect(h1El).toBeTruthy();
      expect(h2El).toBeTruthy();

      const h1Ref = h1El;
      const h2Ref = h2El;

      // Change reactive value but keep branch the same
      counter = 1;
      update(); // triggers reactive text update

      expect(container.querySelector('#head')?.textContent).toBe('counter:1');
      expect(container.querySelector('#head')).toBe(h1Ref);
      expect(container.querySelector('#sub')).toBe(h2Ref);

      // Toggle visibility off -> branch change
      visible = false;
      updateWhenRuntimes();
      expect(container.querySelector('#head')).toBeFalsy();
      expect(container.querySelector('#hidden')).toBeTruthy();

      // Toggle back on -> new elements (should NOT be the same references)
      visible = true;
      counter = 2;
      update();
      const newH1 = container.querySelector('#head');
      const newH2 = container.querySelector('#sub');
      expect(newH1?.textContent).toBe('counter:2');
      expect(newH1).not.toBe(h1Ref);
      expect(newH2).not.toBe(h2Ref);
    });
  });

  describe('nested when scenarios', () => {
    it('updates only inner when when outer condition unchanged', () => {
      let outer = true;
      let inner = false;
      let innerCounter = 0;

      const block = when(
        () => outer,
        div(
          { id: 'outer' },
          when(
            () => inner,
            span(() => `inner:${innerCounter}`, { id: 'inner-yes' })
          ).else(
            span('inner-no', { id: 'inner-no' })
          )
        )
      ).else(
        div('outer hidden', { id: 'outer-hidden' })
      );

      block(container as any, 0);
      update();

      const outerEl = container.querySelector('#outer');
      expect(outerEl).toBeTruthy();
      expect(container.querySelector('#inner-no')?.textContent).toBe('inner-no');

      const outerRef = outerEl;

      // Flip only inner
      inner = true;
      innerCounter = 1;
      update(); // should not recreate outer
      expect(container.querySelector('#inner-yes')?.textContent).toBe('inner:1');
      expect(container.querySelector('#outer')).toBe(outerRef);

      // Another inner change
      innerCounter = 2;
      update();
      expect(container.querySelector('#inner-yes')?.textContent).toBe('inner:2');
      expect(container.querySelector('#outer')).toBe(outerRef);

      // Now hide outer
      outer = false;
      updateWhenRuntimes();
      expect(container.querySelector('#outer')).toBeFalsy();
      expect(container.querySelector('#outer-hidden')).toBeTruthy();
    });
  });

  describe('list inside when (advanced)', () => {
    it('preserves list item identity across list updates within same branch', () => {
      interface Item { id: number; label: string; }
      let show = true;
      const a: Item = { id: 1, label: 'A' };
      const b: Item = { id: 2, label: 'B' };
      const c: Item = { id: 3, label: 'C' };
      let items: Item[] = [a, b, c];

      const block = when(
        () => show,
        section(
          { id: 'wrap' },
          list(
            () => items,
            (it: Item) => div(`${it.label}`, { 'data-id': it.id })
          )
        )
      ).else(
        div('hidden', { id: 'gone' })
      );

      block(container as any, 0);
      update();

      const firstRefs = Array.from(container.querySelectorAll('[data-id]'));
      expect(firstRefs.map(n => n.textContent)).toEqual(['A', 'B', 'C']);

      // Reorder items & keep same references
      items = [c, a, b];
      update();

      const reordered = Array.from(container.querySelectorAll('[data-id]'));
      expect(reordered.map(n => n.textContent)).toEqual(['C', 'A', 'B']);
      // Identity preserved
      expect(reordered[0]).toBe(firstRefs[2]); // C
      expect(reordered[1]).toBe(firstRefs[0]); // A
      expect(reordered[2]).toBe(firstRefs[1]); // B

      // Hide branch - list runtime removed
      show = false;
      updateWhenRuntimes();
      expect(container.querySelector('#gone')).toBeTruthy();
      expect(container.querySelectorAll('[data-id]')).toHaveLength(0);

      // Modify items while hidden
      items = [a];
      show = true;
      update();

      const afterRestore = Array.from(container.querySelectorAll('[data-id]'));
      expect(afterRestore.map(n => n.textContent)).toEqual(['A']);
      // Not same reference as original A because branch re-rendered
      expect(afterRestore[0]).not.toBe(firstRefs[0]);
    });

    it('handles list + plain elements together inside a branch', () => {
      let on = true;
      let nums = [1, 2];
      const block = when(
        () => on,
        h1('Numbers'),
        list(
          () => nums,
            (n) => span(`n:${n}`, { 'data-n': n })
        ),
        h2('End')
      ).else(
        h1('No numbers')
      );

      block(container as any, 0);
      update();

      expect(container.textContent?.includes('Numbers')).toBe(true);
      expect(container.textContent?.includes('End')).toBe(true);
      expect(Array.from(container.querySelectorAll('[data-n]')).map(n => n.textContent)).toEqual(['n:1', 'n:2']);

      nums = [2, 3, 1];
      update();
      expect(Array.from(container.querySelectorAll('[data-n]')).map(n => n.textContent)).toEqual(['n:2', 'n:3', 'n:1']);

      on = false;
      updateWhenRuntimes();
      expect(container.textContent).toBe('No numbers');
    });
  });

  describe('reactive content inside stable branch', () => {
    it('reactive text updates without branch rerender', () => {
      let flag = true;
      let value = 0;
      const block = when(
        () => flag,
        h1(() => `val:${value}`, { id: 'rt' })
      ).else(h1('off'));

      block(container as any, 0);
      update();
      const ref = container.querySelector('#rt');
      expect(ref?.textContent).toBe('val:0');

      value = 1;
      update();
      expect(container.querySelector('#rt')).toBe(ref);
      expect(container.querySelector('#rt')?.textContent).toBe('val:1');

      value = 2;
      update();
      expect(container.querySelector('#rt')?.textContent).toBe('val:2');
    });
  });

  describe('performance / no-op updates', () => {
    it('does not cause DOM insertions when branch & reactive values unchanged', () => {
      let cond = true;
      const block = when(
        () => cond,
        div('Alpha', { id: 'alpha' }),
        div('Beta', { id: 'beta' })
      ).else(
        div('Off', { id: 'off' })
      );

      block(container as any, 0);
      update();

      let insertCalls = 0;
      let appendCalls = 0;
      const originalInsert = container.insertBefore;
      const originalAppend = container.appendChild;
      container.insertBefore = function<T extends Node>(child: T, ref: Node | null): T {
        insertCalls++;
        return originalInsert.call(this, child, ref) as T;
      };
      container.appendChild = function<T extends Node>(child: T): T {
        appendCalls++;
        return originalAppend.call(this, child) as T;
      };

      try {
        // Multiple updates with no changes
        updateWhenRuntimes();
        updateWhenRuntimes();
        update();
        expect(insertCalls + appendCalls).toBe(0);

        // Branch change should cause mutations
        cond = false;
        updateWhenRuntimes();
        expect(container.querySelector('#off')).toBeTruthy();
        expect(insertCalls + appendCalls).toBeGreaterThan(0);
      } finally {
        container.insertBefore = originalInsert;
        container.appendChild = originalAppend;
      }
    });
  });

  describe('multi-group switching correctness', () => {
    it('cleans previous group and renders next group exactly once', () => {
      let mode: 'a' | 'b' | 'c' = 'a';
      const block = when(
        () => mode === 'a',
        h1('Mode A', { id: 'a1' }),
        h2('A2', { id: 'a2' }),
      ).when(
        () => mode === 'b',
        h1('Mode B', { id: 'b1' }),
      ).when(
        () => mode === 'c',
        h1('Mode C', { id: 'c1' }),
        h2('C2', { id: 'c2' }),
      ).else(
        h1('Fallback', { id: 'fb' })
      );

      block(container as any, 0);
      updateWhenRuntimes();
      expect(container.querySelector('#a1')).toBeTruthy();
      expect(container.querySelector('#a2')).toBeTruthy();

      mode = 'b';
      updateWhenRuntimes();
      expect(container.querySelector('#a1')).toBeFalsy();
      expect(container.querySelector('#b1')).toBeTruthy();

      mode = 'c';
      updateWhenRuntimes();
      expect(container.querySelector('#b1')).toBeFalsy();
      expect(container.querySelector('#c1')).toBeTruthy();
      expect(container.querySelector('#c2')).toBeTruthy();

      mode = 'x' as any;
      updateWhenRuntimes();
      expect(container.querySelector('#c1')).toBeFalsy();
      expect(container.querySelector('#fb')).toBeTruthy();
    });
  });
});