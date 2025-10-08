/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createMarkerComment,
  createMarkerPair, 
  clearBetweenMarkers,
  insertNodesBefore,
  safeRemoveChild
} from '../../src/utility/dom';

describe('DOM Markers', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('createMarkerComment', () => {
    it('should create a comment node with prefix', () => {
      const marker = createMarkerComment('test');
      
      expect(marker).toBeInstanceOf(Comment);
      expect(marker.textContent).toMatch(/^test-[a-z0-9]+$/);
    });

    it('should create unique markers each time', () => {
      const marker1 = createMarkerComment('test');
      const marker2 = createMarkerComment('test');
      
      expect(marker1.textContent).not.toBe(marker2.textContent);
    });

    it('should handle different prefixes', () => {
      const listMarker = createMarkerComment('list');
      const componentMarker = createMarkerComment('component');
      
      expect(listMarker.textContent).toMatch(/^list-[a-z0-9]+$/);
      expect(componentMarker.textContent).toMatch(/^component-[a-z0-9]+$/);
    });

    it('should handle empty prefix', () => {
      const marker = createMarkerComment('');
      
      expect(marker).toBeInstanceOf(Comment);
      expect(marker.textContent).toMatch(/^-[a-z0-9]+$/);
    });

    it('should handle special characters in prefix', () => {
      const marker = createMarkerComment('test-123_abc');
      
      expect(marker.textContent).toMatch(/^test-123_abc-[a-z0-9]+$/);
    });
  });

  describe('createMarkerPair', () => {
    it('should create start and end comment markers', () => {
      const { start, end } = createMarkerPair('test');
      
      expect(start).toBeInstanceOf(Comment);
      expect(end).toBeInstanceOf(Comment);
      expect(start.textContent).toMatch(/^test-start-[a-z0-9]+$/);
      expect(end.textContent).toBe('test-end');
    });

    it('should create unique marker pairs', () => {
      const pair1 = createMarkerPair('test');
      const pair2 = createMarkerPair('test');
      
      expect(pair1.start).not.toBe(pair2.start);
      expect(pair1.end).not.toBe(pair2.end);
      expect(pair1.start.textContent).not.toBe(pair2.start.textContent);
    });

    it('should handle different marker names', () => {
      const { start: start1, end: end1 } = createMarkerPair('list');
      const { start: start2, end: end2 } = createMarkerPair('component');
      
      expect(start1.textContent).toMatch(/^list-start-[a-z0-9]+$/);
      expect(end1.textContent).toBe('list-end');
      expect(start2.textContent).toMatch(/^component-start-[a-z0-9]+$/);
      expect(end2.textContent).toBe('component-end');
    });

    it('should handle empty marker names', () => {
      const { start, end } = createMarkerPair('');
      
      expect(start.textContent).toMatch(/^-start-[a-z0-9]+$/);
      expect(end.textContent).toBe('-end');
    });
  });

  describe('clearBetweenMarkers', () => {
    it('should clear content between markers', () => {
      const { start, end } = createMarkerPair('test');
      const element1 = document.createElement('span');
      const element2 = document.createElement('div');
      
      container.appendChild(start);
      container.appendChild(element1);
      container.appendChild(element2);
      container.appendChild(end);
      
      expect(container.childNodes).toHaveLength(4);
      
      clearBetweenMarkers(start, end);
      
      expect(container.childNodes).toHaveLength(2);
      expect(container.childNodes[0]).toBe(start);
      expect(container.childNodes[1]).toBe(end);
    });

    it('should handle no content between markers', () => {
      const { start, end } = createMarkerPair('test');
      
      container.appendChild(start);
      container.appendChild(end);
      
      expect(() => {
        clearBetweenMarkers(start, end);
      }).not.toThrow();
      
      expect(container.childNodes).toHaveLength(2);
    });

    it('should handle text nodes between markers', () => {
      const { start, end } = createMarkerPair('test');
      const textNode = document.createTextNode('Hello');
      
      container.appendChild(start);
      container.appendChild(textNode);
      container.appendChild(end);
      
      clearBetweenMarkers(start, end);
      
      expect(container.childNodes).toHaveLength(2);
      expect(container.textContent).toBe('');
    });

    it('should handle mixed node types between markers', () => {
      const { start, end } = createMarkerPair('test');
      const element = document.createElement('span');
      const textNode = document.createTextNode('Text');
      const commentNode = document.createComment('Comment');
      
      container.appendChild(start);
      container.appendChild(element);
      container.appendChild(textNode);
      container.appendChild(commentNode);
      container.appendChild(end);
      
      expect(container.childNodes).toHaveLength(5);
      
      clearBetweenMarkers(start, end);
      
      expect(container.childNodes).toHaveLength(2);
    });

    it('should handle nested elements between markers', () => {
      const { start, end } = createMarkerPair('test');
      const parent = document.createElement('div');
      const child = document.createElement('span');
      parent.appendChild(child);
      
      container.appendChild(start);
      container.appendChild(parent);
      container.appendChild(end);
      
      clearBetweenMarkers(start, end);
      
      expect(container.childNodes).toHaveLength(2);
    });

    it('should handle markers not in same parent', () => {
      const { start, end } = createMarkerPair('test');
      const otherContainer = document.createElement('div');
      
      container.appendChild(start);
      otherContainer.appendChild(end);
      
      expect(() => {
        clearBetweenMarkers(start, end);
      }).not.toThrow();
    });

    it('should handle disconnected markers', () => {
      const { start, end } = createMarkerPair('test');
      
      expect(() => {
        clearBetweenMarkers(start, end);
      }).not.toThrow();
    });
  });

  describe('insertNodesBefore', () => {
    it('should insert single node before reference', () => {
      const reference = document.createElement('div');
      const nodeToInsert = document.createElement('span');
      
      container.appendChild(reference);
      
      insertNodesBefore([nodeToInsert], reference);
      
      expect(container.children).toHaveLength(2);
      expect(container.children[0]).toBe(nodeToInsert);
      expect(container.children[1]).toBe(reference);
    });

    it('should insert multiple nodes before reference', () => {
      const reference = document.createElement('div');
      const node1 = document.createElement('span');
      const node2 = document.createElement('p');
      const node3 = document.createElement('h1');
      
      container.appendChild(reference);
      
      insertNodesBefore([node1, node2, node3], reference);
      
      expect(container.children).toHaveLength(4);
      expect(container.children[0]).toBe(node1);
      expect(container.children[1]).toBe(node2);
      expect(container.children[2]).toBe(node3);
      expect(container.children[3]).toBe(reference);
    });

    it('should handle empty nodes array', () => {
      const reference = document.createElement('div');
      container.appendChild(reference);
      
      insertNodesBefore([], reference);
      
      expect(container.children).toHaveLength(1);
      expect(container.children[0]).toBe(reference);
    });

    it('should handle text nodes', () => {
      const reference = document.createElement('div');
      const textNode = document.createTextNode('Hello');
      
      container.appendChild(reference);
      
      insertNodesBefore([textNode], reference);
      
      expect(container.childNodes).toHaveLength(2);
      expect(container.childNodes[0]).toBe(textNode);
      expect(container.childNodes[1]).toBe(reference);
    });

    it('should handle comment nodes', () => {
      const reference = document.createElement('div');
      const commentNode = document.createComment('Comment');
      
      container.appendChild(reference);
      
      insertNodesBefore([commentNode], reference);
      
      expect(container.childNodes).toHaveLength(2);
      expect(container.childNodes[0]).toBe(commentNode);
      expect(container.childNodes[1]).toBe(reference);
    });

    it('should handle reference node without parent', () => {
      const reference = document.createElement('div');
      const nodeToInsert = document.createElement('span');
      
      expect(() => {
        insertNodesBefore([nodeToInsert], reference);
      }).not.toThrow();
    });

    it('should handle document fragment as reference', () => {
      const fragment = document.createDocumentFragment();
      const reference = document.createElement('div');
      const nodeToInsert = document.createElement('span');
      
      fragment.appendChild(reference);
      
      insertNodesBefore([nodeToInsert], reference);
      
      expect(fragment.children).toHaveLength(2);
      expect(fragment.children[0]).toBe(nodeToInsert);
      expect(fragment.children[1]).toBe(reference);
    });

    it('should maintain insertion order', () => {
      const reference = document.createElement('div');
      const nodes = [];
      for (let i = 0; i < 10; i++) {
        const node = document.createElement('span');
        node.textContent = `Node ${i}`;
        nodes.push(node);
      }
      
      container.appendChild(reference);
      
      insertNodesBefore(nodes, reference);
      
      for (let i = 0; i < 10; i++) {
        expect(container.children[i]).toBe(nodes[i]);
        expect(container.children[i].textContent).toBe(`Node ${i}`);
      }
      expect(container.children[10]).toBe(reference);
    });
  });



  describe('safeRemoveChild', () => {
    it('should remove nodes with parent', () => {
      const child = document.createElement('span');
      container.appendChild(child);
      
      expect(container.children).toHaveLength(1);
      safeRemoveChild(child);
      expect(container.children).toHaveLength(0);
    });

    it('should handle nodes without parent gracefully', () => {
      const orphan = document.createElement('span');
      
      expect(() => {
        safeRemoveChild(orphan);
      }).not.toThrow();
    });

    it('should remove text nodes', () => {
      const textNode = document.createTextNode('Hello');
      container.appendChild(textNode);
      
      expect(container.childNodes).toHaveLength(1);
      safeRemoveChild(textNode);
      expect(container.childNodes).toHaveLength(0);
    });

    it('should remove comment nodes', () => {
      const commentNode = document.createComment('Comment');
      container.appendChild(commentNode);
      
      expect(container.childNodes).toHaveLength(1);
      safeRemoveChild(commentNode);
      expect(container.childNodes).toHaveLength(0);
    });

    it('should handle nested elements', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      parent.appendChild(child);
      container.appendChild(parent);
      
      expect(container.children).toHaveLength(1);
      safeRemoveChild(parent);
      expect(container.children).toHaveLength(0);
    });

    it('should remove from document fragments', () => {
      const fragment = document.createDocumentFragment();
      const element = document.createElement('div');
      fragment.appendChild(element);
      
      expect(fragment.children).toHaveLength(1);
      safeRemoveChild(element);
      expect(fragment.children).toHaveLength(0);
    });

    it('should handle elements with event listeners', () => {
      const button = document.createElement('button');
      let clicked = false;
      button.addEventListener('click', () => { clicked = true; });
      
      container.appendChild(button);
      button.click();
      expect(clicked).toBe(true);
      
      safeRemoveChild(button);
      expect(container.children).toHaveLength(0);
    });

    it('should handle elements with complex DOM structure', () => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <h1>Title</h1>
        <div class="content">
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;
      
      container.appendChild(wrapper);
      expect(container.children).toHaveLength(1);
      
      safeRemoveChild(wrapper);
      expect(container.children).toHaveLength(0);
    });
  });

  describe('integration scenarios', () => {
    it('should support marker-based content replacement', () => {
      const { start, end } = createMarkerPair('content');
      const oldContent = document.createTextNode('Old content');
      
      container.appendChild(start);
      container.appendChild(oldContent);
      container.appendChild(end);
      
      expect(container.childNodes).toHaveLength(3);
      expect(container.textContent).toBe('Old content');
      
      // Clear old content
      clearBetweenMarkers(start, end);
      
      // Add new content
      const newContent = document.createElement('span');
      newContent.textContent = 'New content';
      insertNodesBefore([newContent], end);
      
      expect(container.childNodes).toHaveLength(3);
      expect(container.querySelector('span')?.textContent).toBe('New content');
    });

    it('should support multiple marker pairs in same container', () => {
      const { start: start1, end: end1 } = createMarkerPair('section1');
      const { start: start2, end: end2 } = createMarkerPair('section2');
      
      container.appendChild(start1);
      container.appendChild(document.createElement('div'));
      container.appendChild(end1);
      container.appendChild(start2);
      container.appendChild(document.createElement('span'));
      container.appendChild(end2);
      
      expect(container.childNodes).toHaveLength(6);
      
      // Clear first section
      clearBetweenMarkers(start1, end1);
      expect(container.childNodes).toHaveLength(5);
      
      // Clear second section
      clearBetweenMarkers(start2, end2);
      expect(container.childNodes).toHaveLength(4);
    });

    it('should handle complex marker operations', () => {
      const { start, end } = createMarkerPair('dynamic');
      
      container.appendChild(start);
      container.appendChild(end);
      
      // Add content multiple times
      for (let i = 0; i < 5; i++) {
        clearBetweenMarkers(start, end);
        
        const elements = [];
        for (let j = 0; j < 3; j++) {
          const el = document.createElement('div');
          el.textContent = `Iteration ${i}, Element ${j}`;
          elements.push(el);
        }
        
        insertNodesBefore(elements, end);
        
        expect(container.children).toHaveLength(3);
      }
      
      expect(container.children[0].textContent).toBe('Iteration 4, Element 0');
      expect(container.children[1].textContent).toBe('Iteration 4, Element 1');
      expect(container.children[2].textContent).toBe('Iteration 4, Element 2');
    });

    it('should handle cleanup scenarios', () => {
      const { start, end } = createMarkerPair('cleanup');
      const elements = [];
      
      container.appendChild(start);
      for (let i = 0; i < 10; i++) {
        const el = document.createElement('div');
        el.textContent = `Element ${i}`;
        elements.push(el);
        container.appendChild(el);
      }
      container.appendChild(end);
      
      expect(container.childNodes).toHaveLength(12);
      
      // Remove all content between markers
      clearBetweenMarkers(start, end);
      expect(container.childNodes).toHaveLength(2);
      
      // Clean up markers themselves
      safeRemoveChild(start);
      safeRemoveChild(end);
      expect(container.childNodes).toHaveLength(0);
    });

    it('should handle performance with many operations', () => {
      const { start, end } = createMarkerPair('perf');
      
      container.appendChild(start);
      container.appendChild(end);
      
      // Perform many insert/clear cycles
      for (let i = 0; i < 100; i++) {
        const elements = [];
        for (let j = 0; j < 10; j++) {
          const el = document.createElement('span');
          el.textContent = `${i}-${j}`;
          elements.push(el);
        }
        
        insertNodesBefore(elements, end);
        clearBetweenMarkers(start, end);
      }
      
      expect(container.childNodes).toHaveLength(2); // Just markers
    });
  });
});