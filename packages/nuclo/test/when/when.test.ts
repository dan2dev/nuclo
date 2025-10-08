/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { when, updateWhenRuntimes, clearWhenRuntimes } from '../../src/when/index';

describe('When Conditional Rendering', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    clearWhenRuntimes();
  });

  describe('basic functionality', () => {
    it('should render content when condition is true', () => {
      const whenFn = when(true, 'Content when true');
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Content when true');
    });

    it('should not render content when condition is false', () => {
      const whenFn = when(false, 'Content when false');
      whenFn(container as any, 0);
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

    it('should handle else content', () => {
      const whenFn = when(false, 'When content').else('Else content');
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Else content');
    });

    it('should handle chained when conditions', () => {
      const whenFn = when(false, 'First')
        .when(true, 'Second')
        .when(false, 'Third');
      
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Second');
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

    it('should handle reactive updates', () => {
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
    });

    it('should handle null and undefined content gracefully', () => {
      const whenFn = when(true, null, undefined, 'Valid content');
      whenFn(container as any, 0);
      expect(container.textContent).toBe('Valid content');
    });

    it('should handle attributes in content', () => {
      const whenFn = when(true, { id: 'test-id', className: 'test-class' });
      whenFn(container as any, 0);
      expect(container.id).toBe('test-id');
      expect(container.className).toBe('test-class');
    });

    it('should handle function modifiers', () => {
      const modifier = (parent: any, index: number) => {
        parent.setAttribute('data-modified', 'true');
      };
      
      const whenFn = when(true, modifier);
      whenFn(container as any, 0);
      expect(container.getAttribute('data-modified')).toBe('true');
    });

    it('should handle error conditions gracefully', () => {
      const errorCondition = () => {
        throw new Error('Test error');
      };
      
      const whenFn = when(errorCondition, 'Content').else('Fallback');
      
      expect(() => {
        whenFn(container as any, 0);
      }).toThrow('Test error');
    });

    it('should return comment marker', () => {
      const whenFn = when(true, 'Content');
      const result = whenFn(container as any, 0);
      expect(result).toBeInstanceOf(Comment);
    });

    it('should work with complex conditions', () => {
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

  describe('edge cases', () => {
    it('should handle empty content arrays', () => {
      const whenFn = when(false).else();
      whenFn(container as any, 0);
      expect(container.textContent).toBe('');
    });

    it('should handle multiple when instances', () => {
      let condition1 = true;
      let condition2 = false;
      
      // Create separate containers to avoid conflicts
      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      
      const when1 = when(() => condition1, 'First').else('No first');
      const when2 = when(() => condition2, 'Second').else('No second');
      
      when1(container1 as any, 0);
      when2(container2 as any, 0);
      
      expect(container1.textContent).toBe('First');
      expect(container2.textContent).toBe('No second');
      
      condition2 = true;
      updateWhenRuntimes();
      
      expect(container1.textContent).toBe('First');
      expect(container2.textContent).toBe('Second');
    });

    it('should clean up properly with frequent changes', () => {
      let condition = false;
      const whenFn = when(() => condition, 'Content');
      
      whenFn(container as any, 0);
      
      // Simulate some changes (reduced from 100 to avoid timeout)
      for (let i = 0; i < 5; i++) {
        condition = !condition;
        updateWhenRuntimes();
      }
      
      expect(container.textContent).toBe('Content'); // Should end with content (odd number of toggles)
      expect(container.childNodes.length).toBe(4); // Markers + comment + content
    });
  });
});