import { describe, it, expect, beforeEach } from 'vitest';
import '../src/index';

describe('Global availability', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should make update() available globally', () => {
    expect(typeof update).toBe('function');
  });

  it('should make on() available globally', () => {
    expect(typeof on).toBe('function');
  });

  it('should make list() available globally', () => {
    expect(typeof list).toBe('function');
  });

  it('should make when() available globally', () => {
    expect(typeof when).toBe('function');
  });

  it('should work without explicit imports - counter example', () => {
    let count = 0;

    const app = div(
      h1(() => `Count: ${count}`),
      button('Increment', on('click', () => {
        count++;
        update();
      }))
    )(document.body, 0);

    document.body.appendChild(app);

    const h1El = document.querySelector('h1');
    expect(h1El?.textContent).toBe('Count: 0');

    count = 5;
    update();
    expect(h1El?.textContent).toBe('Count: 5');
  });

  it('should work without explicit imports - list example', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    const app = div(
      list(() => items, item => div(item.name))
    )(document.body, 0);

    document.body.appendChild(app);

    const divs = document.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
  });

  it('should work without explicit imports - when example', () => {
    let show = true;

    const app = div(
      when(() => show,
        div('Visible')
      ).else(
        div('Hidden')
      )
    )(document.body, 0);

    document.body.appendChild(app);

    expect(document.body.textContent).toContain('Visible');

    show = false;
    update();
    expect(document.body.textContent).toContain('Hidden');
  });
});
