import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NucloElement } from '../../src/polyfill/Element';
import { NucloEvent } from '../../src/polyfill/Event';

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

    it('should initialize sheet for style elements', () => {
      const style = new NucloElement('style');

      expect(style.sheet).toBeDefined();
      expect(style.sheet?.cssRules).toBeDefined();
    });

    it('should not have sheet for non-style elements', () => {
      const div = new NucloElement('div');

      expect(div.sheet).toBeUndefined();
    });
  });

  describe('innerHTML', () => {
    it('should serialize children to HTML', () => {
      const parent = new NucloElement('div');
      const child1 = new NucloElement('span');
      const child2 = new NucloElement('p');

      parent.appendChild(child1);
      parent.appendChild(child2);

      const html = parent.innerHTML;

      expect(html).toContain('<span></span>');
      expect(html).toContain('<p></p>');
    });

    it('should serialize nested elements', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');
      const grandchild = new NucloElement('strong');

      child.appendChild(grandchild);
      parent.appendChild(child);

      const html = parent.innerHTML;

      expect(html).toContain('<span><strong></strong></span>');
    });

    it('should include element attributes in serialization', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('a');

      child.setAttribute('href', 'https://example.com');
      child.id = 'link-1';
      child.className = 'btn primary';
      parent.appendChild(child);

      const html = parent.innerHTML;

      expect(html).toContain('id="link-1"');
      expect(html).toContain('class="btn primary"');
      expect(html).toContain('href="https://example.com"');
    });

    it('should set innerHTML value', () => {
      const div = new NucloElement('div');

      div.innerHTML = '<p>Test</p>';

      expect((div as any)._innerHTML).toBe('<p>Test</p>');
    });

    it('should serialize text nodes', () => {
      const parent = new NucloElement('div');
      const text = { nodeType: 3, textContent: 'Hello World' };

      parent.children.push(text);

      const html = parent.innerHTML;

      expect(html).toBe('Hello World');
    });

    it('should serialize comment nodes', () => {
      const parent = new NucloElement('div');
      const comment = { nodeType: 8, data: 'This is a comment' };

      parent.children.push(comment);

      const html = parent.innerHTML;

      expect(html).toBe('<!--This is a comment-->');
    });

    it('should handle empty data in comment nodes', () => {
      const parent = new NucloElement('div');
      const comment = { nodeType: 8, data: undefined };

      parent.children.push(comment);

      const html = parent.innerHTML;

      expect(html).toBe('<!---->');
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

  describe('event listeners', () => {
    it('should add event listener', () => {
      const div = new NucloElement('div');
      const listener = vi.fn();

      div.addEventListener('click', listener);

      const event = new NucloEvent('click');
      div.dispatchEvent(event);

      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should remove event listener', () => {
      const div = new NucloElement('div');
      const listener = vi.fn();

      div.addEventListener('click', listener);
      div.removeEventListener('click', listener);

      div.dispatchEvent(new NucloEvent('click'));

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners', () => {
      const div = new NucloElement('div');
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      div.addEventListener('click', listener1);
      div.addEventListener('click', listener2);

      div.dispatchEvent(new NucloEvent('click'));

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should bubble events to parent', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');
      parent.appendChild(child);

      const parentListener = vi.fn();
      parent.addEventListener('click', parentListener);

      const event = new NucloEvent('click', { bubbles: true });
      child.dispatchEvent(event);

      expect(parentListener).toHaveBeenCalledWith(event);
    });

    it('should not bubble when bubbles is false', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');
      parent.appendChild(child);

      const parentListener = vi.fn();
      parent.addEventListener('click', parentListener);

      const event = new NucloEvent('click', { bubbles: false });
      child.dispatchEvent(event);

      expect(parentListener).not.toHaveBeenCalled();
    });

    it('should catch errors in listeners', () => {
      const div = new NucloElement('div');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      div.addEventListener('click', () => {
        throw new Error('Listener error');
      });

      const result = div.dispatchEvent(new NucloEvent('click'));

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('querySelector', () => {
    it('should find element by ID', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');
      child.id = 'test-id';
      parent.appendChild(child);

      const found = parent.querySelector('#test-id');

      expect(found).toBe(child);
    });

    it('should find element by class', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');
      child.classList.add('test-class');
      parent.appendChild(child);

      const found = parent.querySelector('.test-class');

      expect(found).toBe(child);
    });

    it('should find element by tag name', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');
      parent.appendChild(child);

      const found = parent.querySelector('span');

      expect(found).toBe(child);
    });

    it('should find nested elements', () => {
      const grandparent = new NucloElement('div');
      const parent = new NucloElement('section');
      const child = new NucloElement('span');
      child.id = 'nested';

      parent.appendChild(child);
      grandparent.appendChild(parent);

      const found = grandparent.querySelector('#nested');

      expect(found).toBe(child);
    });

    it('should return null when not found', () => {
      const parent = new NucloElement('div');

      expect(parent.querySelector('#non-existent')).toBe(null);
      expect(parent.querySelector('.non-existent')).toBe(null);
      expect(parent.querySelector('span')).toBe(null);
    });

    it('should match self for ID selector', () => {
      const div = new NucloElement('div');
      div.id = 'self';

      const found = div.querySelector('#self');

      expect(found).toBe(div);
    });

    it('should match self for class selector', () => {
      const div = new NucloElement('div');
      div.classList.add('self');

      const found = div.querySelector('.self');

      expect(found).toBe(div);
    });

    it('should match self for tag selector', () => {
      const div = new NucloElement('div');

      const found = div.querySelector('div');

      expect(found).toBe(div);
    });
  });

  describe('querySelectorAll', () => {
    it('should find all elements by class', () => {
      const parent = new NucloElement('div');
      const child1 = new NucloElement('span');
      const child2 = new NucloElement('p');
      const child3 = new NucloElement('div');

      child1.classList.add('test');
      child2.classList.add('test');
      parent.appendChild(child1);
      parent.appendChild(child2);
      parent.appendChild(child3);

      const found = parent.querySelectorAll('.test');

      // Note: querySelectorAll also checks parent, so this would include parent if it had the class
      expect(found.length).toBeGreaterThanOrEqual(2);
      expect(found).toContain(child1);
      expect(found).toContain(child2);
    });

    it('should find all elements by tag name', () => {
      const parent = new NucloElement('div');
      const span1 = new NucloElement('span');
      const span2 = new NucloElement('span');
      const p = new NucloElement('p');

      parent.appendChild(span1);
      parent.appendChild(p);
      parent.appendChild(span2);

      const found = parent.querySelectorAll('span');

      expect(found.length).toBeGreaterThanOrEqual(2);
      expect(found).toContain(span1);
      expect(found).toContain(span2);
    });

    it('should find single element by ID', () => {
      const parent = new NucloElement('div');
      const child = new NucloElement('span');
      child.id = 'unique';
      parent.appendChild(child);

      const found = parent.querySelectorAll('#unique');

      expect(found.length).toBe(1);
      expect(found[0]).toBe(child);
    });

    it('should include self in results', () => {
      const div = new NucloElement('div');
      div.classList.add('test');

      const found = div.querySelectorAll('.test');

      expect(found).toContain(div);
    });

    it('should find nested elements', () => {
      const grandparent = new NucloElement('div');
      const parent = new NucloElement('div');
      const child = new NucloElement('span');

      child.classList.add('nested');
      parent.classList.add('nested');
      parent.appendChild(child);
      grandparent.appendChild(parent);

      const found = grandparent.querySelectorAll('.nested');

      expect(found.length).toBeGreaterThanOrEqual(2);
      expect(found).toContain(parent);
      expect(found).toContain(child);
    });

    it('should return empty array when nothing found', () => {
      const parent = new NucloElement('div');

      expect(parent.querySelectorAll('.non-existent').length).toBe(0);
    });
  });

  describe('style element sheet', () => {
    it('should insert CSS rule', () => {
      const style = new NucloElement('style');

      const index = style.sheet!.insertRule('.test { color: red; }', 0);

      expect(index).toBe(0);
      expect(style.sheet!.cssRules.length).toBe(1);
      expect((style.sheet!.cssRules[0] as any).cssText).toBe('.test { color: red; }');
    });

    it('should insert rule at specified index', () => {
      const style = new NucloElement('style');

      style.sheet!.insertRule('.first { }', 0);
      style.sheet!.insertRule('.second { }', 1);
      style.sheet!.insertRule('.middle { }', 1);

      expect((style.sheet!.cssRules[0] as any).cssText).toBe('.first { }');
      expect((style.sheet!.cssRules[1] as any).cssText).toBe('.middle { }');
      expect((style.sheet!.cssRules[2] as any).cssText).toBe('.second { }');
    });

    it('should append rule when index not specified', () => {
      const style = new NucloElement('style');

      style.sheet!.insertRule('.first { }');
      style.sheet!.insertRule('.second { }');

      expect(style.sheet!.cssRules.length).toBe(2);
      expect((style.sheet!.cssRules[1] as any).cssText).toBe('.second { }');
    });

    it('should delete CSS rule', () => {
      const style = new NucloElement('style');

      style.sheet!.insertRule('.first { }', 0);
      style.sheet!.insertRule('.second { }', 1);
      style.sheet!.deleteRule(0);

      expect(style.sheet!.cssRules.length).toBe(1);
      expect((style.sheet!.cssRules[0] as any).cssText).toBe('.second { }');
    });

    it('should parse selector from CSS rule', () => {
      const style = new NucloElement('style');

      style.sheet!.insertRule('.my-class { color: blue; }', 0);

      const rule = style.sheet!.cssRules[0] as any;
      expect(rule.selectorText).toBe('.my-class');
    });
  });
});
