import { describe, it, expect, vi } from 'vitest';
import { NucloElement } from '../../src/polyfill/Element';

describe('NucloElement', () => {
  describe('constructor', () => {
    it('should create an element with lowercase tagName', () => {
      const div = new NucloElement('DIV');

      expect(div.tagName).toBe('div');
      expect(div.nodeName).toBe('DIV');
    });

    it('should initialize with default properties', () => {
      const div = new NucloElement('div');

      expect(div.nodeType).toBe(1); // ELEMENT_NODE
      expect(div.className).toBe('');
      expect(div.textContent).toBe('');
      expect(div.id).toBe('');
      expect(div.parentNode).toBe(null);
      expect(div.children).toEqual([]);
      expect(div.attributes).toBeInstanceOf(Map);
    });

    it('should initialize classList', () => {
      const div = new NucloElement('div');

      expect(div.classList).toBeDefined();
      expect(div.classList.length).toBe(0);
    });

    it('should initialize style object', () => {
      const div = new NucloElement('div');

      expect(div.style).toBeDefined();
    });

  });

  describe('style', () => {
    it('should set and get style properties', () => {
      const div = new NucloElement('div');

      div.style.color = 'red';
      div.style.fontSize = '16px';

      expect(div.style.color).toBe('red');
      expect(div.style.fontSize).toBe('16px');
    });

    it('should support setProperty', () => {
      const div = new NucloElement('div');

      div.style.setProperty('color', 'blue');

      expect(div.style.getPropertyValue('color')).toBe('blue');
    });

    it('should support getPropertyValue', () => {
      const div = new NucloElement('div');

      div.style.setProperty('background', 'white');

      expect(div.style.getPropertyValue('background')).toBe('white');
    });

    it('should return empty string for non-existent property', () => {
      const div = new NucloElement('div');

      expect(div.style.getPropertyValue('unknown')).toBe('');
    });

    it('should generate cssText from properties', () => {
      const div = new NucloElement('div');

      div.style.color = 'red';
      div.style.fontSize = '16px';

      const cssText = div.style.cssText;

      expect(cssText).toContain('color: red');
      expect(cssText).toContain('fontSize: 16px');
    });
  });

  describe('classList', () => {
    it('should add single class', () => {
      const div = new NucloElement('div');

      div.classList.add('active');

      expect(div.className).toBe('active');
      expect(div.classList.contains('active')).toBe(true);
    });

    it('should add multiple classes', () => {
      const div = new NucloElement('div');

      div.classList.add('btn', 'primary', 'large');

      expect(div.className).toBe('btn primary large');
    });

    it('should not add duplicate classes', () => {
      const div = new NucloElement('div');

      div.classList.add('active');
      div.classList.add('active');

      expect(div.className).toBe('active');
    });

    it('should remove class', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary active';

      div.classList.remove('primary');

      expect(div.className).toBe('btn active');
      expect(div.classList.contains('primary')).toBe(false);
    });

    it('should remove multiple classes', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary large active';

      div.classList.remove('primary', 'large');

      expect(div.className).toBe('btn active');
    });

    it('should toggle class without force', () => {
      const div = new NucloElement('div');

      const result1 = div.classList.toggle('active');
      expect(result1).toBe(true);
      expect(div.classList.contains('active')).toBe(true);

      const result2 = div.classList.toggle('active');
      expect(result2).toBe(false);
      expect(div.classList.contains('active')).toBe(false);
    });

    it('should toggle class with force=true', () => {
      const div = new NucloElement('div');

      div.classList.toggle('active', true);
      expect(div.classList.contains('active')).toBe(true);

      div.classList.toggle('active', true);
      expect(div.classList.contains('active')).toBe(true);
    });

    it('should toggle class with force=false', () => {
      const div = new NucloElement('div');
      div.className = 'active';

      div.classList.toggle('active', false);
      expect(div.classList.contains('active')).toBe(false);

      div.classList.toggle('active', false);
      expect(div.classList.contains('active')).toBe(false);
    });

    it('should check contains', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary';

      expect(div.classList.contains('btn')).toBe(true);
      expect(div.classList.contains('primary')).toBe(true);
      expect(div.classList.contains('active')).toBe(false);
    });

    it('should replace class', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary';

      const result = div.classList.replace('primary', 'secondary');

      expect(result).toBe(true);
      expect(div.className).toBe('btn secondary');
    });

    it('should return false when replacing non-existent class', () => {
      const div = new NucloElement('div');
      div.className = 'btn';

      const result = div.classList.replace('primary', 'secondary');

      expect(result).toBe(false);
      expect(div.className).toBe('btn');
    });

    it('should get item by index', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary active';

      expect(div.classList.item(0)).toBe('btn');
      expect(div.classList.item(1)).toBe('primary');
      expect(div.classList.item(2)).toBe('active');
      expect(div.classList.item(3)).toBe(null);
    });

    it('should return correct length', () => {
      const div = new NucloElement('div');

      expect(div.classList.length).toBe(0);

      div.className = 'btn primary';
      expect(div.classList.length).toBe(2);
    });

    it('should convert to string', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary';

      expect(div.classList.toString()).toBe('btn primary');
    });

    it('should be iterable', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary active';

      const classes = [...div.classList];

      expect(classes).toEqual(['btn', 'primary', 'active']);
    });

    it('should support forEach', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary';

      const callback = vi.fn();
      div.classList.forEach(callback);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, 'btn', 0, div.classList);
      expect(callback).toHaveBeenNthCalledWith(2, 'primary', 1, div.classList);
    });

    it('should support entries', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary';

      const entries = [...div.classList.entries()];

      expect(entries).toEqual([
        [0, 'btn'],
        [1, 'primary']
      ]);
    });

    it('should support keys', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary';

      const keys = [...div.classList.keys()];

      expect(keys).toEqual([0, 1]);
    });

    it('should support values', () => {
      const div = new NucloElement('div');
      div.className = 'btn primary';

      const values = [...div.classList.values()];

      expect(values).toEqual(['btn', 'primary']);
    });

    it('should have supports method', () => {
      const div = new NucloElement('div');

      expect(div.classList.supports()).toBe(false);
    });
  });

  describe('attributes', () => {
    it('should set attribute', () => {
      const div = new NucloElement('div');

      div.setAttribute('data-test', 'value');

      expect(div.getAttribute('data-test')).toBe('value');
    });

    it('should set class via setAttribute', () => {
      const div = new NucloElement('div');

      div.setAttribute('class', 'btn primary');

      expect(div.className).toBe('btn primary');
      expect(div.getAttribute('class')).toBe('btn primary');
    });

    it('should set id via setAttribute', () => {
      const div = new NucloElement('div');

      div.setAttribute('id', 'my-id');

      expect(div.id).toBe('my-id');
      expect(div.getAttribute('id')).toBe('my-id');
    });

    it('should get attribute', () => {
      const div = new NucloElement('div');
      div.setAttribute('title', 'Hello');

      expect(div.getAttribute('title')).toBe('Hello');
    });

    it('should return null for non-existent attribute', () => {
      const div = new NucloElement('div');

      expect(div.getAttribute('non-existent')).toBe(null);
    });

    it('should remove attribute', () => {
      const div = new NucloElement('div');
      div.setAttribute('data-test', 'value');

      div.removeAttribute('data-test');

      expect(div.hasAttribute('data-test')).toBe(false);
      expect(div.getAttribute('data-test')).toBe(null);
    });

    it('should clear className when removing class attribute', () => {
      const div = new NucloElement('div');
      div.className = 'btn';

      div.removeAttribute('class');

      expect(div.className).toBe('');
    });

    it('should check hasAttribute', () => {
      const div = new NucloElement('div');
      div.setAttribute('data-test', 'value');

      expect(div.hasAttribute('data-test')).toBe(true);
      expect(div.hasAttribute('other')).toBe(false);
    });
  });

  describe('appendChild', () => {
    it('should append a child element', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');

      const result = parent.appendChild(child);

      expect(result).toBe(child);
      expect(parent.children).toContain(child);
      expect((child as any).parentNode).toBe(parent);
    });

    it('should append multiple children', () => {
      const parent = new NucloElement('div');
      const child1 = new NucloElement('span');
      const child2 = new NucloElement('p');

      parent.appendChild(child1);
      parent.appendChild(child2);

      expect(parent.children.length).toBe(2);
      expect(parent.children).toEqual([child1, child2]);
    });
  });

  describe('insertBefore', () => {
    it('should insert before reference node', () => {
      const parent = new NucloElement('div');
      const child1 = new NucloElement('span');
      const child2 = new NucloElement('p');
      const child3 = new NucloElement('div');

      parent.appendChild(child1);
      parent.appendChild(child3);
      parent.insertBefore(child2, child3);

      expect(parent.children).toEqual([child1, child2, child3]);
      expect((child2 as any).parentNode).toBe(parent);
    });

    it('should append when referenceNode is null', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');

      const result = parent.insertBefore(child, null);

      expect(result).toBe(child);
      expect(parent.children).toContain(child);
    });

    it('should handle inserting at beginning', () => {
      const parent = new NucloElement('div');
      const child1 = new NucloElement('span');
      const child2 = new NucloElement('p');

      parent.appendChild(child2);
      parent.insertBefore(child1, child2);

      expect(parent.children[0]).toBe(child1);
      expect(parent.children[1]).toBe(child2);
    });
  });

  describe('removeChild', () => {
    it('should remove a child', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');

      parent.appendChild(child);
      const result = parent.removeChild(child);

      expect(result).toBe(child);
      expect(parent.children).not.toContain(child);
      expect((child as any).parentNode).toBe(null);
    });

    it('should remove specific child from multiple', () => {
      const parent = new NucloElement('div');
      const child1 = new NucloElement('span');
      const child2 = new NucloElement('p');
      const child3 = new NucloElement('div');

      parent.appendChild(child1);
      parent.appendChild(child2);
      parent.appendChild(child3);
      parent.removeChild(child2);

      expect(parent.children).toEqual([child1, child3]);
    });
  });

  describe('replaceChild', () => {
    it('should replace a child', () => {
      const parent = new NucloElement('div');
      const oldChild = new NucloElement('span');
      const newChild = new NucloElement('p');

      parent.appendChild(oldChild);
      const result = parent.replaceChild(newChild, oldChild);

      expect(result).toBe(oldChild);
      expect(parent.children).toContain(newChild);
      expect(parent.children).not.toContain(oldChild);
      expect((newChild as any).parentNode).toBe(parent);
      expect((oldChild as any).parentNode).toBe(null);
    });

    it('should replace in correct position', () => {
      const parent = new NucloElement('div');
      const child1 = new NucloElement('span');
      const child2 = new NucloElement('p');
      const child3 = new NucloElement('div');
      const newChild = new NucloElement('section');

      parent.appendChild(child1);
      parent.appendChild(child2);
      parent.appendChild(child3);
      parent.replaceChild(newChild, child2);

      expect(parent.children).toEqual([child1, newChild, child3]);
    });
  });

  describe('childNodes', () => {
    it('is the children array: elements, text and comments alike', () => {
      const div = new NucloElement('div');
      const span = new NucloElement('span');
      const text = { nodeType: 3, textContent: 'x', parentNode: null } as unknown as Node;
      div.appendChild(span as unknown as Node);
      div.appendChild(text);
      expect(Array.from(div.childNodes as unknown as unknown[])).toEqual([span, text]);
      expect(div.childNodes).toBe(div.children);
    });
  });

  describe('SSR stubs', () => {
    it('accepts and drops event listeners (SSR never dispatches)', () => {
      const div = new NucloElement('div');
      const listener = vi.fn();
      div.addEventListener('click', listener);
      expect(div.dispatchEvent(new Event('click'))).toBe(true);
      div.removeEventListener('click', listener);
      expect(listener).not.toHaveBeenCalled();
    });

    it('finds nothing with querySelector/querySelectorAll', () => {
      const div = new NucloElement('div');
      div.id = 'root';
      div.appendChild(new NucloElement('span') as unknown as Node);
      expect(div.querySelector('#root')).toBeNull();
      expect(div.querySelector('span')).toBeNull();
      expect(Array.from(div.querySelectorAll('span'))).toEqual([]);
    });
  });
});
