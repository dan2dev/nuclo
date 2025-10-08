import { describe, it, expect, beforeEach } from 'vitest';
import '../src';

describe('render() function', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should be globally available', () => {
    expect(typeof render).toBe('function');
  });

  it('should render element to document.body by default', () => {
    const app = div('Hello World');
    render(app);

    expect(document.body.querySelector('div')?.textContent).toBe('Hello World');
  });

  it('should render element to specific parent', () => {
    const container = document.createElement('div');
    container.id = 'container';
    document.body.appendChild(container);

    const app = div('Test Content');
    render(app, container as ExpandedElement<ElementTagName>);

    expect(container.querySelector('div')?.textContent).toBe('Test Content');
  });

  it('should return the rendered element', () => {
    const app = div('Content');
    const element = render(app);

    expect(element).toBeInstanceOf(HTMLDivElement);
    expect(element.textContent).toBe('Content');
  });

  it('should work with complex nested structures', () => {
    const app = div(
      h1('Title'),
      p('Paragraph'),
      ul(
        li('Item 1'),
        li('Item 2')
      )
    );

    render(app);

    expect(document.querySelector('h1')?.textContent).toBe('Title');
    expect(document.querySelector('p')?.textContent).toBe('Paragraph');
    expect(document.querySelectorAll('li').length).toBe(2);
  });

  it('should work with reactive content', () => {
    let count = 0;

    const app = div(
      h1(() => `Count: ${count}`),
      button('Increment', on('click', () => {
        count++;
        update();
      }))
    );

    render(app);

    const h1El = document.querySelector('h1');
    expect(h1El?.textContent).toBe('Count: 0');

    count = 5;
    update();
    expect(h1El?.textContent).toBe('Count: 5');
  });

  it('should work with list()', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];

    const app = div(
      list(() => items, item => span(item.name))
    );

    render(app);

    const spans = document.querySelectorAll('span');
    expect(spans.length).toBe(3);
    expect(spans[0].textContent).toBe('Item 1');
    expect(spans[1].textContent).toBe('Item 2');
    expect(spans[2].textContent).toBe('Item 3');
  });

  it('should work with when()', () => {
    let show = true;

    const app = div(
      when(() => show,
        p('Visible')
      ).else(
        p('Hidden')
      )
    );

    render(app);

    expect(document.body.textContent).toContain('Visible');

    show = false;
    update();
    expect(document.body.textContent).toContain('Hidden');
  });

  it('should work with attributes and styles', () => {
    const app = div(
      { className: 'container', id: 'main' },
      'Content'
    );

    const element = render(app);

    expect(element.className).toBe('container');
    expect(element.id).toBe('main');
  });

  it('should accept custom index parameter', () => {
    const app = div('Test');
    render(app, document.body as ExpandedElement<ElementTagName>, 5);

    expect(document.querySelector('div')?.textContent).toBe('Test');
  });

  it('should work in complete example pattern', () => {
    let count = 0;

    const app = div(
      { className: 'app' },
      h1(() => `Count: ${count}`),
      button('Increment', on('click', () => {
        count++;
        update();
      })),
      button('Reset', on('click', () => {
        count = 0;
        update();
      }))
    );

    render(app);

    expect(document.querySelector('.app')).toBeTruthy();
    expect(document.querySelector('h1')?.textContent).toBe('Count: 0');
    expect(document.querySelectorAll('button').length).toBe(2);

    count = 10;
    update();
    expect(document.querySelector('h1')?.textContent).toBe('Count: 10');
  });
});
