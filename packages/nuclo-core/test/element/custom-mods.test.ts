/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import '../../src'; // Auto-initializes the globals

describe('Custom Mods', () => {
  it('should support modifying the element directly without returning anything', () => {
    // Note: NodeModFn receives parent and index. 
    // We define it with at least one parameter so it's not treated as a zero-arity reactive primitive factory.
    const applyCustomClass = (className: string) => (el: any) => {
      if (!el.className) {
        el.className = className;
      } else {
        el.className += ` ${className}`;
      }
    };

    const myDiv = div(applyCustomClass('custom-class'))(document.body, 0);
    const element = myDiv as HTMLDivElement;
    expect(element.className).toBe('custom-class');
  });

  it('should support returning an attributes object', () => {
    // By taking `_parent` as an argument, we ensure this is treated as a NodeModFn
    // and not a zero-arity reactive primitive.
    const withCustomData = (key: string, value: string) => (_parent: any) => {
      return { [`data-${key}`]: value };
    };

    const myDiv = div(withCustomData('test', '123'))(document.body, 0);
    const element = myDiv as HTMLDivElement;
    expect(element.dataset.test).toBe('123');
  });

  it('should support returning a primitive to become a text node', () => {
    // A primitive can be passed directly or returned from a NodeModFn
    const withTextContent = (text: string) => (_parent: any) => {
      return text;
    };

    const myDiv = div(withTextContent('Hello Custom Mod'))(document.body, 0);
    const element = myDiv as HTMLDivElement;
    expect(element.textContent).toContain('Hello Custom Mod');
  });

  it('should support returning a reactive primitive (function)', () => {
    let state = 'initial';
    // To provide a reactive primitive, we can just pass the zero-arity function directly
    // If we want a builder that returns a reactive primitive, it MUST be returned directly
    // since NodeModFn returning a function is not supported. We just pass `() => state`.
    const reactiveTextMod = () => state;

    const myDiv = div(reactiveTextMod)(document.body, 0);
    const element = myDiv as HTMLDivElement;
    document.body.appendChild(element);
    
    // Using a comment to indicate where text is placed
    expect(element.textContent).toContain('initial');

    state = 'updated';
    update();

    expect(element.textContent).toContain('updated');
  });

  it('should support returning a DOM Node', () => {
    // A NodeModFn can return a DOM Node to be appended
    const withChildNode = () => (_parent: any) => {
      const span = document.createElement('span');
      span.textContent = 'child span';
      span.className = 'child-class';
      return span;
    };

    const myDiv = div(withChildNode())(document.body, 0);
    const element = myDiv as HTMLDivElement;
    const child = element.querySelector('.child-class');
    expect(child).toBeTruthy();
    expect(child?.textContent).toBe('child span');
  });

  it('should support attaching event listeners directly', () => {
    const clickHandler = vi.fn();
    const onClick = (handler: EventListener) => (el: any) => {
      if (el.addEventListener) {
        el.addEventListener('click', handler);
      } else {
        el.onclick = handler;
      }
    };

    const myDiv = div(onClick(clickHandler))(document.body, 0);
    const element = myDiv as HTMLDivElement;
    
    element.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });
  
  it('should process multiple custom mods sequentially', () => {
    const setRole = () => (_parent: any) => ({ role: 'button' });
    const setTabIndex = () => (_parent: any) => ({ tabIndex: 0 });
    const addClass = (className: string) => (el: any) => {
      el.className = el.className ? `${el.className} ${className}` : className;
    };

    const myDiv = div(
      setRole(),
      setTabIndex(),
      addClass('interactive')
    )(document.body, 0);

    const element = myDiv as HTMLDivElement;
    expect(element.getAttribute('role')).toBe('button');
    expect(element.tabIndex).toBe(0);
    expect(element.className).toBe('interactive');
  });
});
