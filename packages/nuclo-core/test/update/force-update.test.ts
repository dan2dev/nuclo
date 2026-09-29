/**
 * forceUpdate(): re-evaluates the whole component against its live DOM —
 * including static values update() never touches — reusing existing nodes.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import '../../src';
import { renderToString } from '../../src/ssr/render-to-string';
import { reactiveTextNodes } from '../../src/update/registry';

let container: HTMLDivElement;

beforeEach(() => {
  document.body.innerHTML = '';
  container = document.createElement('div');
  document.body.appendChild(container);
});

describe('forceUpdate()', () => {
  it('re-evaluates static text and numbers', () => {
    let label = 'Static: ';
    let count = 1;
    const App = () => div(h1(label, count));

    render(App(), container);
    expect(container.querySelector('h1')!.textContent).toBe('Static: 1');

    label = 'Estático: ';
    count = 2;
    forceUpdate(App(), container);
    expect(container.querySelector('h1')!.textContent).toBe('Estático: 2');
  });

  it('reuses element and text node instances', () => {
    let label = 'a';
    const App = () => div(h1(label));

    const root = render(App(), container);
    const h1El = container.querySelector('h1')!;
    const textNode = h1El.firstChild!;

    label = 'b';
    const forced = forceUpdate(App(), container);

    expect(forced).toBe(root);
    expect(container.querySelector('h1')).toBe(h1El);
    expect(h1El.firstChild).toBe(textNode);
    expect(textNode.textContent).toBe('b');
  });

  it('preserves input state on reused elements', () => {
    let placeholder = 'name';
    const App = () => div(input({ placeholder }));

    render(App(), container);
    const inputEl = container.querySelector('input')!;
    inputEl.value = 'typed by user';
    inputEl.focus();

    placeholder = 'nome';
    forceUpdate(App(), container);

    expect(container.querySelector('input')).toBe(inputEl);
    expect(inputEl.value).toBe('typed by user');
    expect(inputEl.placeholder).toBe('nome');
    expect(document.activeElement).toBe(inputEl);
  });

  it('swaps reactive text resolvers; update() keeps working afterwards', () => {
    let count = 1;
    const App = () => div(p(() => `count: ${count}`));

    render(App(), container);
    const pEl = container.querySelector('p')!;

    forceUpdate(App(), container);
    count = 5;
    update();
    expect(container.querySelector('p')).toBe(pEl);
    expect(pEl.textContent).toBe('count: 5');
  });

  it('does not duplicate event listeners across repeated forceUpdate calls', () => {
    let clicks = 0;
    const App = () => div(button(on('click', () => { clicks++; })));

    render(App(), container);
    forceUpdate(App(), container);
    forceUpdate(App(), container);
    forceUpdate(App(), container);

    container.querySelector('button')!.click();
    expect(clicks).toBe(1);
  });

  it('attaches the fresh listener closure', () => {
    let language = 'pt';
    let seen = '';
    const App = () => div(button(on('click', () => { seen = language; })));

    render(App(), container);
    language = 'en';
    forceUpdate(App(), container);

    container.querySelector('button')!.click();
    expect(seen).toBe('en');
  });

  it('converges className: stale static classes are dropped', () => {
    let theme = 'light';
    const App = () => div(section({ className: `card ${theme}` }));

    render(App(), container);
    const el = container.querySelector('section')!;
    expect(el.className).toBe('card light');

    theme = 'dark';
    forceUpdate(App(), container);
    expect(container.querySelector('section')).toBe(el);
    expect(el.className).toBe('card dark');
    expect(el.classList.contains('light')).toBe(false);
  });

  it('keeps static + reactive className cooperation after forceUpdate', () => {
    let active = false;
    const App = () => div(section({ className: 'base' }, { className: () => (active ? 'on' : '') }));

    render(App(), container);
    forceUpdate(App(), container);

    const el = container.querySelector('section')!;
    active = true;
    update();
    expect(el.classList.contains('base')).toBe(true);
    expect(el.classList.contains('on')).toBe(true);
  });

  it('re-applies static attributes and inline styles', () => {
    let title = 'first';
    let color = 'red';
    const App = () => div(p({ title, style: { color } }));

    render(App(), container);
    const el = container.querySelector('p')!;

    title = 'second';
    color = 'blue';
    forceUpdate(App(), container);

    expect(container.querySelector('p')).toBe(el);
    expect(el.title).toBe('second');
    expect(el.style.color).toBe('blue');
  });

  it('preserves whitespace-only static text children', () => {
    const App = () => div(span('a'), ' ', span('b'));

    render(App(), container);
    forceUpdate(App(), container);
    forceUpdate(App(), container);

    expect(container.querySelector('div')!.textContent).toBe('a b');
    // one text node between the spans, unchanged
    expect(container.querySelector('div')!.childNodes.length).toBe(3);
  });

  it('keeps raw Node children in place', () => {
    const raw = document.createTextNode('raw');
    let label = 'x';
    const App = () => div(span(label), raw);

    render(App(), container);
    label = 'y';
    forceUpdate(App(), container);

    const divEl = container.querySelector('div')!;
    expect(divEl.lastChild).toBe(raw);
    expect(divEl.textContent).toBe('yraw');
  });

  describe('when()', () => {
    it('reuses the active branch and updates its statics', () => {
      let label = 'yes';
      const App = () => div(when(true, p(label)));

      render(App(), container);
      const pEl = container.querySelector('p')!;

      label = 'sim';
      forceUpdate(App(), container);
      expect(container.querySelector('p')).toBe(pEl);
      expect(pEl.textContent).toBe('sim');
    });

    it('handles a branch toggled by update() before forceUpdate', () => {
      let flag = true;
      let label = 'on';
      const App = () => div(when(() => flag, p(label)).else(span('off')));

      render(App(), container);
      flag = false;
      update();
      expect(container.querySelector('span')!.textContent).toBe('off');

      // marker text still encodes the initial branch — the live runtime wins
      const spanEl = container.querySelector('span')!;
      forceUpdate(App(), container);
      expect(container.querySelector('span')).toBe(spanEl);
      expect(container.querySelector('p')).toBeNull();

      flag = true;
      label = 'ligado';
      forceUpdate(App(), container);
      expect(container.querySelector('p')!.textContent).toBe('ligado');
    });

    it('update() keeps toggling correctly after repeated forceUpdate calls', () => {
      let flag = true;
      const App = () => div(when(() => flag, p('on')).else(span('off')));

      render(App(), container);
      forceUpdate(App(), container);
      forceUpdate(App(), container);

      flag = false;
      update();
      expect(container.querySelector('p')).toBeNull();
      expect(container.querySelector('span')!.textContent).toBe('off');

      flag = true;
      update();
      expect(container.querySelector('p')!.textContent).toBe('on');
      // exactly one branch rendered — duplicate runtimes would double-render
      expect(container.querySelectorAll('p').length).toBe(1);
    });
  });

  describe('list()', () => {
    it('reuses row elements and updates row statics', () => {
      let items = [1, 2, 3];
      let unit = 'x';
      const App = () => div(ul(list(() => items, (n) => li(`${n}${unit}`))));

      render(App(), container);
      const rows = Array.from(container.querySelectorAll('li'));
      expect(rows.map((r) => r.textContent)).toEqual(['1x', '2x', '3x']);

      unit = 'y';
      forceUpdate(App(), container);
      const rowsAfter = Array.from(container.querySelectorAll('li'));
      expect(rowsAfter).toEqual(rows);
      expect(rowsAfter.map((r) => r.textContent)).toEqual(['1y', '2y', '3y']);
    });

    it('list keeps syncing after forceUpdate', () => {
      let items = [1, 2];
      const App = () => div(ul(list(() => items, (n) => li(String(n)))));

      render(App(), container);
      forceUpdate(App(), container);

      items = [1, 2, 3];
      update();
      expect(container.querySelectorAll('li').length).toBe(3);

      items = [3];
      update();
      const rows = Array.from(container.querySelectorAll('li'));
      expect(rows.map((r) => r.textContent)).toEqual(['3']);
    });
  });

  describe('lifecycle', () => {
    it('does not re-fire onMount on reused elements', () => {
      let mounts = 0;
      const App = () => div(p(on('mount', () => { mounts++; })));

      render(App(), container);
      forceUpdate(App(), container);
      forceUpdate(App(), container);
      expect(mounts).toBe(1);
    });

    it('fires onMount for freshly created (mismatched) subtrees and onDestroy for replaced ones', () => {
      let useSpan = false;
      let mounts = 0;
      let destroys = 0;
      const App = () => div(
        useSpan
          ? span(on('mount', () => { mounts++; }))
          : p(on('destroy', () => { destroys++; })),
      );

      render(App(), container);
      useSpan = true;
      forceUpdate(App(), container);

      expect(container.querySelector('span')).not.toBeNull();
      expect(container.querySelector('p')).toBeNull();
      expect(mounts).toBe(1);
      expect(destroys).toBe(1);
    });
  });

  it('keeps registries flat across repeated calls (no leak)', () => {
    let n = 0;
    const App = () => div(p(() => `n: ${n}`), span('static'));

    render(App(), container);
    const size = reactiveTextNodes.size;

    for (let i = 0; i < 5; i++) forceUpdate(App(), container);
    expect(reactiveTextNodes.size).toBe(size);
  });

  it('scoped update() still targets a single root after forceUpdate', () => {
    let a = 0;
    let b = 0;
    const App = () => div(
      section(scope('left'), p(() => `a:${a}`)),
      section(scope('right'), p(() => `b:${b}`)),
    );

    render(App(), container);
    forceUpdate(App(), container);

    a = 1;
    b = 1;
    update('left');
    const [left, right] = Array.from(container.querySelectorAll('p'));
    expect(left.textContent).toBe('a:1');
    expect(right.textContent).toBe('b:0');
  });

  it('works on an SSR-hydrated tree (marker DOM)', () => {
    let label = 'hello';
    let count = 1;
    const App = () => div(h1(label), p('n: ', () => count));

    container.innerHTML = renderToString(App());
    hydrate(App(), container);
    expect(container.querySelector('h1')!.textContent).toBe('hello');

    const h1El = container.querySelector('h1')!;
    label = 'olá';
    count = 2;
    forceUpdate(App(), container);

    expect(container.querySelector('h1')).toBe(h1El);
    expect(h1El.textContent).toBe('olá');
    expect(container.querySelector('p')!.textContent).toBe('n: 2');

    count = 3;
    update();
    expect(container.querySelector('p')!.textContent).toBe('n: 3');
  });

  it('inserts a structurally new child at its position, not at the end', () => {
    let extra = false;
    const App = () => div(span('a'), extra ? em('new') : null, span('b'));

    render(App(), container);
    extra = true;
    forceUpdate(App(), container);

    const children = Array.from(container.querySelector('div')!.children);
    expect(children.map((c) => c.tagName.toLowerCase())).toEqual(['span', 'em', 'span']);
    expect(container.querySelector('div')!.textContent).toBe('anewb');
  });

  describe('bare forceUpdate() with component-registered roots', () => {
    it('re-evaluates statics of a root rendered as render(App, parent)', () => {
      let label = 'pt';
      const App = () => div(h1(label));

      const root = render(App, container);
      expect(root.tagName).toBe('DIV');
      expect(container.querySelector('h1')!.textContent).toBe('pt');

      label = 'en';
      expect(forceUpdate()).toBeUndefined();
      expect(container.querySelector('h1')!.textContent).toBe('en');
    });

    it('refreshes every registered root, reusing elements', () => {
      const other = document.createElement('div');
      document.body.appendChild(other);
      let a = 'a1';
      let b = 'b1';
      const AppA = () => div(p(a));
      const AppB = () => div(p(b));

      render(AppA, container);
      render(AppB, other);
      const pA = container.querySelector('p')!;
      const pB = other.querySelector('p')!;

      a = 'a2';
      b = 'b2';
      forceUpdate();
      expect(container.querySelector('p')).toBe(pA);
      expect(other.querySelector('p')).toBe(pB);
      expect(pA.textContent).toBe('a2');
      expect(pB.textContent).toBe('b2');
    });

    it('leaves foreign siblings in the parent untouched', () => {
      container.innerHTML = '<header>static site header</header>';
      const foreign = container.firstChild!;
      let label = 'x';
      const App = () => div(span(label));

      render(App, container);
      label = 'y';
      forceUpdate();
      forceUpdate();

      expect(container.firstChild).toBe(foreign);
      expect(foreign.textContent).toBe('static site header');
      expect(container.querySelector('span')!.textContent).toBe('y');
      expect(container.querySelectorAll('div').length).toBe(1);
    });

    it('skips and prunes roots removed from the DOM', () => {
      let label = 'a';
      const App = () => div(p(label));
      const root = render(App, container);

      root.remove();
      label = 'b';
      forceUpdate(); // must not throw or resurrect the tree
      expect(container.querySelector('p')).toBeNull();
    });

    it('does not duplicate listeners across repeated bare calls', () => {
      let clicks = 0;
      const App = () => div(button(on('click', () => { clicks++; })));

      render(App, container);
      forceUpdate();
      forceUpdate();
      forceUpdate();
      container.querySelector('button')!.click();
      expect(clicks).toBe(1);
    });

    it('ignores roots rendered from an already-built tree', () => {
      let label = 'before';
      const App = () => div(h1(label));

      render(App(), container); // built tree — statics are already captured
      label = 'after';
      forceUpdate();
      expect(container.querySelector('h1')!.textContent).toBe('before');
    });

    it('registers hydrate(App, parent) roots too', () => {
      let label = 'ssr';
      const App = () => div(h1(label));

      container.innerHTML = renderToString(App());
      hydrate(App, container);
      label = 'client';
      forceUpdate();
      expect(container.querySelector('h1')!.textContent).toBe('client');
    });

    it('tracks a root whose tag changes (replacement)', () => {
      let big = true;
      let label = 'v1';
      const App = () => (big ? div(p(label)) : section(p(label)));

      render(App, container);
      big = false;
      label = 'v2';
      forceUpdate();
      expect(container.querySelector('section p')!.textContent).toBe('v2');
      expect(container.querySelector('div')).toBeNull();

      // the registry must now point at the replacement root
      label = 'v3';
      forceUpdate();
      expect(container.querySelector('section p')!.textContent).toBe('v3');
      expect(container.querySelectorAll('section').length).toBe(1);
    });

    it('a throwing component keeps its DOM and does not break other roots', () => {
      const other = document.createElement('div');
      document.body.appendChild(other);
      let label = 'ok1';
      let explode = false;
      const Bad = () => {
        if (explode) throw new Error('boom');
        return div(p('bad'));
      };
      const Good = () => div(p(label));

      render(Bad, container);
      render(Good, other);

      explode = true;
      label = 'ok2';
      forceUpdate();
      expect(container.querySelector('p')!.textContent).toBe('bad');
      expect(other.querySelector('p')!.textContent).toBe('ok2');
    });
  });

  it('is exported as a module binding and a global', async () => {
    const mod = await import('../../src');
    expect(typeof mod.forceUpdate).toBe('function');
    expect(typeof globalThis.forceUpdate).toBe('function');
  });
});
