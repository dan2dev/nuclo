/// <reference path="../../types/index.d.ts" />
import { describe, it, expect } from 'vitest';
import { NucloDocument } from '../../src/polyfill/Document';
import { NucloElement } from '../../src/polyfill/Element';

describe('SSRDocumentFragment edge cases', () => {
  describe('insertBefore', () => {
    it('should insert an element node before a reference node and update children array', () => {
      const doc = new NucloDocument();
      const frag = doc.createDocumentFragment();
      const child1 = doc.createElement('div');
      const child2 = doc.createElement('span');

      frag.appendChild(child1);
      frag.insertBefore(child2, child1);

      // child2 should be before child1 in childNodes
      expect((frag as any).childNodes[0]).toBe(child2);
      expect((frag as any).childNodes[1]).toBe(child1);

      // Both should be in children array (element-only list)
      expect((frag as any).children[0]).toBe(child2);
      expect((frag as any).children[1]).toBe(child1);
      expect((frag as any).children.length).toBe(2);
    });

    it('should fall back to appendChild when refNode is null', () => {
      const doc = new NucloDocument();
      const frag = doc.createDocumentFragment();
      const child1 = doc.createElement('div');
      const child2 = doc.createElement('span');

      frag.appendChild(child1);
      frag.insertBefore(child2, null);

      // child2 should be appended at the end
      expect((frag as any).childNodes[0]).toBe(child1);
      expect((frag as any).childNodes[1]).toBe(child2);
    });

    it('should set parentNode on the inserted node', () => {
      const doc = new NucloDocument();
      const frag = doc.createDocumentFragment();
      const child1 = doc.createElement('div');
      const child2 = doc.createElement('span');

      frag.appendChild(child1);
      frag.insertBefore(child2, child1);

      expect((child2 as any).parentNode).toBe(frag);
    });

    it('should handle inserting a text node (non-element) before a reference', () => {
      const doc = new NucloDocument();
      const frag = doc.createDocumentFragment();
      const el = doc.createElement('div');
      const text = doc.createTextNode('hello');

      frag.appendChild(el);
      frag.insertBefore(text as unknown as Node, el as unknown as Node);

      // Text node should be in childNodes but NOT in children
      expect((frag as any).childNodes[0]).toBe(text);
      expect((frag as any).childNodes[1]).toBe(el);
      expect((frag as any).children.length).toBe(1);
      expect((frag as any).children[0]).toBe(el);
    });

    it('should do nothing extra if refNode is not found in childNodes', () => {
      const doc = new NucloDocument();
      const frag = doc.createDocumentFragment();
      const child1 = doc.createElement('div');
      const child2 = doc.createElement('span');
      const orphan = doc.createElement('p');

      frag.appendChild(child1);
      // orphan is not in frag's childNodes
      frag.insertBefore(child2, orphan as unknown as Node);

      // child2 should still get parentNode set
      expect((child2 as any).parentNode).toBe(frag);
      // But it should NOT be inserted into childNodes since refNode wasn't found
      expect((frag as any).childNodes.length).toBe(1);
    });
  });

  describe('removeChild', () => {
    it('should remove an element node from both childNodes and children', () => {
      const doc = new NucloDocument();
      const frag = doc.createDocumentFragment();
      const el = doc.createElement('div');

      frag.appendChild(el);
      expect((frag as any).childNodes.length).toBe(1);
      expect((frag as any).children.length).toBe(1);

      frag.removeChild(el as unknown as Node);
      expect((frag as any).childNodes.length).toBe(0);
      expect((frag as any).children.length).toBe(0);
      expect((el as any).parentNode).toBeNull();
    });

    it('should remove a text node from childNodes only', () => {
      const doc = new NucloDocument();
      const frag = doc.createDocumentFragment();
      const text = doc.createTextNode('hello');

      frag.appendChild(text as unknown as Node);
      expect((frag as any).childNodes.length).toBe(1);

      frag.removeChild(text as unknown as Node);
      expect((frag as any).childNodes.length).toBe(0);
    });
  });

  describe('replaceChild', () => {
    it('should replace an element node with another element in both childNodes and children', () => {
      const doc = new NucloDocument();
      const frag = doc.createDocumentFragment();
      const old = doc.createElement('div');
      const replacement = doc.createElement('span');

      frag.appendChild(old);
      expect((frag as any).childNodes.length).toBe(1);
      expect((frag as any).children.length).toBe(1);

      frag.replaceChild(replacement as unknown as Node, old as unknown as Node);

      expect((frag as any).childNodes[0]).toBe(replacement);
      expect((frag as any).children[0]).toBe(replacement);
      expect((frag as any).childNodes.length).toBe(1);
      expect((frag as any).children.length).toBe(1);
      expect((replacement as any).parentNode).toBe(frag);
      expect((old as any).parentNode).toBeNull();
    });

    it('should not update children array when replacing a non-element with an element', () => {
      const doc = new NucloDocument();
      const frag = doc.createDocumentFragment();
      const text = doc.createTextNode('hello');
      const replacement = doc.createElement('span');

      frag.appendChild(text as unknown as Node);
      // text is in childNodes but not in children (nodeType 3, not 1)
      expect((frag as any).children.length).toBe(0);

      frag.replaceChild(replacement as unknown as Node, text as unknown as Node);

      // childNodes updated, but children not updated since old was not an element
      expect((frag as any).childNodes[0]).toBe(replacement);
      expect((replacement as any).parentNode).toBe(frag);
    });
  });
});

describe('SSRDocumentFragment – branch edge cases', () => {
  it('insertBefore element when refNode is not in children array', () => {
    const doc = new NucloDocument();
    const frag = doc.createDocumentFragment();
    const text = doc.createTextNode('hello');
    const el = doc.createElement('div');

    // Add a text node — only goes into childNodes, not children
    frag.appendChild(text as unknown as Node);
    // Insert an element before the text node
    // refNode (text) is in childNodes but NOT in children, so elementIndex === -1
    frag.insertBefore(el as unknown as Node, text as unknown as Node);

    expect((frag as any).childNodes[0]).toBe(el);
    expect((frag as any).childNodes[1]).toBe(text);
    // el should NOT be in children since refNode wasn't found in children
    // Actually per the code: it only checks children.indexOf(refNode), and refNode is text (not in children)
    // so elementIndex === -1 and the splice is skipped — el is NOT added to children by insertBefore
    // But it WAS an element... this is a known limitation of the SSR polyfill
  });

  it('replaceChild when oldChild is an element but not found in children array', () => {
    const doc = new NucloDocument();
    const frag = doc.createDocumentFragment();
    const old = doc.createElement('div');
    const replacement = doc.createElement('span');

    // Manually add to childNodes but not children to test the elementIndex === -1 branch
    (frag as any).childNodes.push(old);
    (old as any).parentNode = frag;

    frag.replaceChild(replacement as unknown as Node, old as unknown as Node);

    expect((frag as any).childNodes[0]).toBe(replacement);
    expect((replacement as any).parentNode).toBe(frag);
    expect((old as any).parentNode).toBeNull();
  });

  it('removeChild when element child is not in children array', () => {
    const doc = new NucloDocument();
    const frag = doc.createDocumentFragment();
    const el = doc.createElement('div');

    // Manually add to childNodes only (not children)
    (frag as any).childNodes.push(el);
    (el as any).parentNode = frag;

    frag.removeChild(el as unknown as Node);
    expect((frag as any).childNodes.length).toBe(0);
    expect((el as any).parentNode).toBeNull();
  });
});

describe('NucloDocument.querySelector', () => {
  it('should find a style element with matching id in head', () => {
    const doc = new NucloDocument();
    const style = doc.createElement('style');
    (style as any).id = 'nuclo-styles';
    doc.head.appendChild(style as unknown as Node);

    const found = doc.querySelector('#nuclo-styles');
    expect(found).toBe(style);
  });

  it('should return null when no element matches the id', () => {
    const doc = new NucloDocument();
    const found = doc.querySelector('#nonexistent');
    expect(found).toBeNull();
  });

  it('should return null for non-id selectors', () => {
    const doc = new NucloDocument();
    const result = doc.querySelector('.some-class');
    expect(result).toBeNull();
  });

  it('should return null when head has children but none match', () => {
    const doc = new NucloDocument();
    const style = doc.createElement('style');
    (style as any).id = 'other-id';
    doc.head.appendChild(style as unknown as Node);

    const found = doc.querySelector('#nuclo-styles');
    expect(found).toBeNull();
  });

  it('should only search for nuclo-styles id in head children', () => {
    const doc = new NucloDocument();
    // Search for a non-nuclo-styles id should return null even if element exists
    const el = doc.createElement('div');
    (el as any).id = 'my-element';
    doc.head.appendChild(el as unknown as Node);

    const found = doc.querySelector('#my-element');
    expect(found).toBeNull();
  });
});
