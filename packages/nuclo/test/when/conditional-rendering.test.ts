/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { when, updateWhenRuntimes, clearWhenRuntimes } from '../../src/when/index';
import { update } from '../../src';

describe('Conditional Rendering (when)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up any when runtimes to prevent interference between tests
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Note: Not clearing when runtimes here as it may interfere with nested tests
  });

  describe('basic when functionality', () => {
    it('should render content when condition is true', () => {
      const whenFn = when(true, 'Content when true');
      
      const result = whenFn(container as any, 0);
      expect(result).toBeInstanceOf(Comment);
      expect(container.textContent).toBe('Content when true');
    });

    it('should not render content when condition is false', () => {
      const whenFn = when(false, 'Content when false');
      
      const result = whenFn(container as any, 0);
      expect(result).toBeInstanceOf(Comment);
      expect(container.textContent).toBe('');
    });

    it('should handle function conditions', () => {
      let condition = false;
      const whenFn = when(() => condition, 'Dynamic content');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('');
      
      condition = true;
      updateWhenRuntimes();
      expect(container.textContent).toBe('Dynamic content');
    });

    it('should handle multiple content items', () => {
      const whenFn = when(true, 'First', ' Second', ' Third');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('First Second Third');
    });

    it('should handle DOM elements as content', () => {
      const element = document.createElement('span');
      element.textContent = 'Element content';
      
      const whenFn = when(true, element);
      
      whenFn(container as any, 0);
      expect(container.querySelector('span')?.textContent).toBe('Element content');
    });
  });

  describe('when.else functionality', () => {
    it('should render else content when condition is false', () => {
      const whenFn = when(false, 'When content').else('Else content');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Else content');
    });

    it('should render when content over else when condition is true', () => {
      const whenFn = when(true, 'When content').else('Else content');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('When content');
    });

    it('should handle multiple else content items', () => {
      const whenFn = when(false, 'When').else('Else', ' content', ' here');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Else content here');
    });

    it('should handle DOM elements in else', () => {
      const element = document.createElement('span');
      element.textContent = 'Else element';
      
      const whenFn = when(false, 'When').else(element);
      
      whenFn(container as any, 0);
      expect(container.querySelector('span')?.textContent).toBe('Else element');
    });
  });

  describe('chained when conditions', () => {
    it('should handle multiple when conditions', () => {
      const whenFn = when(false, 'First')
        .when(true, 'Second')
        .when(false, 'Third');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Second');
    });

    it('should render first matching condition', () => {
      const whenFn = when(false, 'First')
        .when(true, 'Second')
        .when(true, 'Third'); // This should not render
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Second');
    });

    it('should handle chained when with else', () => {
      const whenFn = when(false, 'First')
        .when(false, 'Second')
        .else('Fallback');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Fallback');
    });

    it('should handle dynamic chained conditions', () => {
      let condition1 = false;
      let condition2 = false;
      
      const whenFn = when(() => condition1, 'First')
        .when(() => condition2, 'Second')
        .else('Else');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Else');
      
      condition2 = true;
      updateWhenRuntimes();
      expect(container.textContent).toBe('Second');
      
      condition1 = true;
      updateWhenRuntimes();
      expect(container.textContent).toBe('First'); // First takes precedence
    });
  });

  describe('reactive updates', () => {
    it('should update content when conditions change', () => {
      let showContent = false;
      const whenFn = when(() => showContent, 'Dynamic content');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('');
      
      showContent = true;
      updateWhenRuntimes();
      expect(container.textContent).toBe('Dynamic content');
      
      showContent = false;
      updateWhenRuntimes();
      expect(container.textContent).toBe('');
    });

    it('should handle switching between when and else', () => {
      let condition = true;
      const whenFn = when(() => condition, 'When true').else('When false');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('When true');
      
      condition = false;
      updateWhenRuntimes();
      expect(container.textContent).toBe('When false');
      
      condition = true;
      updateWhenRuntimes();
      expect(container.textContent).toBe('When true');
    });

    it('should handle complex condition changes', () => {
      let user = { role: 'guest' };
      
      const whenFn = when(() => user.role === 'admin', 'Admin panel')
        .when(() => user.role === 'user', 'User dashboard')
        .else('Please log in');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Please log in');
      
      user.role = 'user';
      updateWhenRuntimes();
      expect(container.textContent).toBe('User dashboard');
      
      user.role = 'admin';
      updateWhenRuntimes();
      expect(container.textContent).toBe('Admin panel');
    });
  });

  describe('error handling', () => {
    it('should handle errors in condition functions gracefully', () => {
      const errorCondition = () => {
        throw new Error('Condition error');
      };
      
      const whenFn = when(errorCondition, 'Content').else('Fallback');
      
      expect(() => {
        whenFn(container as any, 0);
      }).toThrow('Condition error');
    });

    it('should handle null and undefined content', () => {
      const whenFn = when(true, null, undefined, 'Valid content');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Valid content');
    });

    it('should handle empty content arrays', () => {
      const whenFn = when(false).else();
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('');
    });
  });

  describe('complex scenarios', () => {
    // Note: Nested conditional rendering has an issue where inner when runtimes 
    // interfere with outer when runtimes. This is a known limitation that could
    // be addressed in a future enhancement.
    it('should handle nested conditional rendering', () => {
      let showOuter = true;
      let showInner = false;
      
      const outerContainer = document.createElement('div');
      container.appendChild(outerContainer);
      
      const outerWhen = when(() => showOuter, 
        when(() => showInner, 'Inner content').else('Inner fallback')
      ).else('Outer fallback');
      
      outerWhen(outerContainer as any, 0);
      updateWhenRuntimes();
      expect(outerContainer.textContent).toBe('Inner fallback');
      
      showInner = true;
      updateWhenRuntimes();
      expect(outerContainer.textContent).toBe('Inner content');
      
      showOuter = false;
      updateWhenRuntimes();
      expect(outerContainer.textContent).toBe('Outer fallback');
    });

    it('should handle attributes in conditional content', () => {
      const whenFn = when(true, { id: 'test-id', className: 'test-class' });
      
      whenFn(container as any, 0);
      expect(container.id).toBe('test-id');
      expect(container.className).toBe('test-class');
    });

    it('should handle function modifiers in conditional content', () => {
      const modifier = (parent: any, index: number) => {
        parent.setAttribute('data-modified', 'true');
      };
      
      const whenFn = when(true, modifier);
      
      whenFn(container as any, 0);
      expect(container.getAttribute('data-modified')).toBe('true');
    });

    it('should preserve content order with multiple updates', () => {
      let items = ['A', 'B', 'C'];
      
      const whenFn = when(true, () => items.join(' - '));
      
      whenFn(container as any, 0);
      update();
      expect(container.textContent).toBe('A - B - C');
      
      items = ['X', 'Y', 'Z'];
      update();
      expect(container.textContent).toBe('X - Y - Z');
    });

    it('should handle multiple when instances in same container', () => {
      let condition1 = true;
      let condition2 = false;
      
      const when1 = when(() => condition1, 'First: ').else('No first');
      const when2 = when(() => condition2, 'Second').else('No second');
      
      when1(container as any, 0);
      when2(container as any, 1);
      
      updateWhenRuntimes();
      expect(container.textContent).toBe('First: No second');
      
      condition2 = true;
      updateWhenRuntimes();
      expect(container.textContent).toBe('First: Second');
      
      condition1 = false;
      updateWhenRuntimes();
      expect(container.textContent).toBe('No firstSecond');
    });
  });

  describe('performance and cleanup', () => {
    it('should clean up properly when conditions change frequently', () => {
      let condition = false;
      const whenFn = when(() => condition, 'Content');
      
      whenFn(container as any, 0);
      
      // Simulate frequent changes
      for (let i = 0; i < 10; i++) { // Reduce iterations to avoid test timeout
        condition = !condition;
        updateWhenRuntimes();
      }
      
      expect(container.textContent).toBe('');
      expect(container.childNodes.length).toBe(2); // Should only have start and end markers
    });

    it('should handle many when instances without memory leaks', () => {
      const conditions = Array(10).fill(false); // Reduce count for performance
      const whenFns = conditions.map((_, i) => 
        when(() => conditions[i], `Content ${i}`)
      );
      
      whenFns.forEach((fn, i) => fn(container as any, i));
      
      // Enable some conditions
      conditions[0] = true;
      conditions[5] = true;
      
      updateWhenRuntimes();
      
      expect(container.textContent).toBe('Content 0Content 5');
    });
  });

  describe('browser environment handling', () => {
    it('should handle browser-specific functionality', () => {
      // This test verifies the when system works in jsdom environment
      const whenFn = when(true, 'Browser content');
      
      const result = whenFn(container as any, 0);
      expect(result).toBeInstanceOf(Comment);
      expect(container.textContent).toBe('Browser content');
    });
  });
});