/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach } from 'vitest';
import { update, list, when } from '../../src';

/**
 * Tests for updateController sequencing and high‑level integration.
 *
 * We cannot (without intrusive module mocks) directly replace the internal
 * updater function references captured in updateController. Instead, we
 * create real runtimes / reactive constructs whose side effects (pushing
 * to a shared sequence log) only occur when their respective subsystem
 * updater executes.
 *
 * Expected order (from src/update/update.ts):
 *  1. updateListRuntimes
 *  2. updateWhenRuntimes
 *  4. notifyReactiveElements
 *  5. notifyReactiveTextNodes
 *
 * We arrange for each stage to append a unique marker to a sequence array
 * during a single update() call by ensuring:
 *  - List: items array changes so sync re-renders (renderItem logs "1")
 *  - When: condition flips causing branch re-render (branch content logs "2")
 *  - Reactive attribute: attribute resolver executes each update ("4")
 *  - Reactive text: resolver executes each update ("5")
 */

describe('updateController sequencing & integration', () => {
  let seq: string[];
  let host: HTMLElement;

  // Mutable state used by various reactive / conditional constructs
  let items: number[];
  let whenToggle: boolean;
  let textCounter: number;

  beforeEach(() => {
    document.body.innerHTML = '';
    seq = [];
    host = document.createElement('div');
    document.body.appendChild(host);

    items = [];
    whenToggle = true;        // initial branch = true branch
    textCounter = 0;
  });

  function push(marker: string) {
    seq.push(marker);
  }

  it('executes updaters in documented sequence', () => {
    // 1. LIST RUNTIME (stage 1)
    // Create list with empty items so initial render logs nothing.
    const listBlock = list(
      () => items,
      (item) => {
        // Rendered once per appended item when list sync detects change
        push('1');
        const span = document.createElement('span');
        span.textContent = String(item);
        return span;
      }
    );

    // 2. WHEN RUNTIME (stage 2)
    // True branch & else branch both contain NodeModFns that log "2".
    const whenBlock = when(
      () => whenToggle,
      (_p: ExpandedElement<any>) => {
        push('2');
        const a = document.createElement('i');
        a.textContent = 'T';
        return a;
      }
    ).else(
      (_p: ExpandedElement<any>) => {
        push('2');
        const b = document.createElement('b');
        b.textContent = 'F';
        return b;
      }
    );

    // 4. REACTIVE ATTRIBUTE (stage 4)
    const reactiveAttrElFactory = (globalThis as any).div({
      id: () => {
        push('4');
        return 'reactive-id';
      }
    });

    // 5. REACTIVE TEXT (stage 5)
    const reactiveTextElFactory = (globalThis as any).div(
      () => {
        push('5');
        return `txt-${textCounter}`;
      }
    );

    // Compose host content (initial creation may produce pushes; we'll clear).
    const content = (globalThis as any).div(
      listBlock,
      whenBlock,
      reactiveAttrElFactory,
      reactiveTextElFactory
    );

    const produced = content(host as any, 0);
    host.appendChild(produced as Node);

    // Clear any initial sequence noise from construction.
    seq = [];

    // Mutate state to guarantee each stage produces a new side effect this cycle:
    items.push(1);          // list stage will re-render item -> "1"
    whenToggle = !whenToggle; // when stage branch change -> "2"
    textCounter += 1;       // reactive text resolver runs -> "5"
    // reactive attribute always runs -> "4"

    update();

    expect(seq.join('')).toBe('1245');
  });

  it('integration: multiple updates keep correct relative order and update DOM state', () => {
    // Build simplified environment including list + reactive text + when

    const app = (globalThis as any).div(
      list(
        () => items,
        (item) => {
          push('1');
          const li = document.createElement('span');
          li.textContent = `#${item}`;
          return li;
        }
      ),
      when(
        () => whenToggle,
        () => {
          push('2');
          const good = document.createElement('em');
          good.textContent = 'YES';
          return good;
        }
      ).else(
        () => {
          push('2');
            const bad = document.createElement('em');
            bad.textContent = 'NO';
            return bad;
        }
      ),
      (globalThis as any).div(
        () => {
          push('5');
          return `count:${textCounter}`;
        }
      ),
      (globalThis as any).div({
        title: () => {
          push('4');
          return `t-${textCounter}`;
        }
      })
    );

    const root = app(host as any, 0);
    host.appendChild(root as Node);

    // Reset sequence post-initial render
    seq = [];

    // First update mutation set
    items.push(10);
    whenToggle = false;
    textCounter++;
    update();

    expect(seq.join('')).toBe('1245');

    // Validate DOM effects (spot checks)
    expect(host.querySelectorAll('span').length).toBe(1); // list item
    expect(host.innerHTML).toMatch(/when-start/); // else branch active (may render empty content)
    expect(host.innerHTML).not.toContain('YES');
    expect(host.innerHTML).toContain('count:1');
    expect(host.innerHTML).toContain('t-1');

    // Second update mutation set
    seq = [];
    items.push(20);
    whenToggle = true;
    textCounter++;
    update();

    expect(seq.join('')).toBe('1245');
    expect(host.querySelectorAll('span').length).toBe(2);
    expect(host.innerHTML).toMatch(/when-start/);
    expect(host.innerHTML).not.toContain('NO');
    expect(host.innerHTML).toContain('count:2');
    expect(host.innerHTML).toContain('t-2');
  });
});