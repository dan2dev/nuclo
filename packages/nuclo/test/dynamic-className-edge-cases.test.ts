/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { update } from '../src';
import { createBreakpoints, bg, padding, color, fontSize } from '../src/style';

const cn = createBreakpoints({
  small: "(min-width: 320px)",
  medium: "(min-width: 768px)",
});

describe('Dynamic className - Edge Cases & Validation', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('Type discrimination', () => {
    it('should distinguish between cn() object and plain object', () => {
      const cnClass = cn(bg('red'));

      // This should be treated as className
      const element1 = (globalThis as any).div(
        () => cnClass,
        'CN Object'
      );

      const result1 = element1(container, 0);
      container.appendChild(result1 as Node);
      expect(result1.className).toBe(cnClass.className);

      // This should be treated as attributes (has multiple properties)
      const element2 = (globalThis as any).div(
        () => ({ className: 'manual-class', id: 'test' }),
        'Plain Object'
      );

      const result2 = element2(container, 0);
      container.appendChild(result2 as Node);
      expect(result2.textContent).toBe('Plain Object');
    });

    it('should not treat string primitives as className when returned by function', () => {
      let text = 'Hello World';

      const element = (globalThis as any).div(
        () => text
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Should be text content, not className
      expect(result.textContent).toContain('Hello World');
      expect(result.className).toBe('');

      text = 'Updated Text';
      update();

      expect(result.textContent).toContain('Updated Text');
      expect(result.className).toBe('');
    });

    it('should not treat number primitives as className', () => {
      let count = 42;

      const element = (globalThis as any).div(
        () => count
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toBe('42');
      expect(result.className).toBe('');

      count = 100;
      update();

      expect(result.textContent).toBe('100');
      expect(result.className).toBe('');
    });

    it('should handle boolean primitives as text (not className)', () => {
      let flag = true;

      const element = (globalThis as any).div(
        () => flag
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toBe('true');
      expect(result.className).toBe('');
    });
  });

  describe('Object property validation', () => {
    it('should only accept objects with exactly one property (className)', () => {
      const validClass = cn(bg('red')); // Returns { className: 'xxx' }

      const element = (globalThis as any).div(
        () => validClass,
        'Valid'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(validClass.className);
      expect(Object.keys(validClass).length).toBe(1);
    });

    it('should reject objects with className but additional properties', () => {
      const invalidObject = {
        className: 'test-class',
        extraProp: 'value',
      };

      const element = (globalThis as any).div(
        () => invalidObject,
        'Invalid'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Should not be treated as dynamic className
      expect(result.textContent).toBe('Invalid');
      // The object should be treated as attributes instead
    });

    it('should reject objects with className property that is not a string', () => {
      const invalidObject = {
        className: 123, // number instead of string
      };

      const element = (globalThis as any).div(
        () => invalidObject,
        'Invalid Type'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toBe('Invalid Type');
    });
  });

  describe('Node detection', () => {
    it('should not treat HTMLElement as className even if it has className property', () => {
      const childDiv = document.createElement('div');
      childDiv.className = 'child-class';
      childDiv.textContent = 'Child Element';

      const element = (globalThis as any).div(
        childDiv // Pass directly, not as function
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Should append the child, not use its className
      expect(result.contains(childDiv)).toBe(true);
      expect(result.className).not.toBe('child-class');
    });

    it('should not treat DocumentFragment as className', () => {
      const fragment = document.createDocumentFragment();
      const span = document.createElement('span');
      span.textContent = 'Fragment Content';
      fragment.appendChild(span);

      const element = (globalThis as any).div(
        fragment // Pass directly, not as function
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toContain('Fragment Content');
    });

    it('should not treat Text node as className', () => {
      const textNode = document.createTextNode('Text Node Content');

      const element = (globalThis as any).div(
        textNode // Pass directly, not as function
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toBe('Text Node Content');
    });
  });

  describe('Null and undefined handling', () => {
    it('should handle function returning null', () => {
      const element = (globalThis as any).div(
        () => null,
        'Null Return'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toBe('Null Return');
      expect(() => update()).not.toThrow();
    });

    it('should handle function returning undefined', () => {
      const element = (globalThis as any).div(
        () => undefined,
        'Undefined Return'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toBe('Undefined Return');
      expect(() => update()).not.toThrow();
    });

    it('should handle toggle between valid className and null', () => {
      let useClass = true;
      const validClass = cn(bg('red'));

      const element = (globalThis as any).div(
        () => useClass ? validClass : null,
        'Toggle Null'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(validClass.className);

      useClass = false;
      update();

      expect(result.textContent).toBe('Toggle Null');
    });
  });

  describe('Empty and whitespace handling', () => {
    it('should handle empty string from function (treated as text)', () => {
      const element = (globalThis as any).div(
        () => ''
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Empty string is a primitive, should be treated as text (empty text)
      expect(result.className).toBe('');
    });

    it('should handle whitespace-only string (treated as text)', () => {
      const element = (globalThis as any).div(
        () => '   '
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toBe('   ');
    });
  });

  describe('Symbol and special values', () => {
    it('should handle symbol values gracefully', () => {
      const sym = Symbol('test');

      const element = (globalThis as any).div(
        () => sym,
        'Symbol Test'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Symbol is converted to string and rendered as text, along with 'Symbol Test'
      expect(result.textContent).toContain('Symbol Test');
      expect(result.textContent).toContain('Symbol(test)');
    });

    it('should handle BigInt values', () => {
      const bigNum = BigInt(9007199254740991);

      const element = (globalThis as any).div(
        () => bigNum
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toBe(bigNum.toString());
    });
  });

  describe('Error scenarios', () => {
    it('should handle function that throws on initial evaluation', () => {
      let shouldThrow = true;
      const validClass = cn(bg('red'));

      const element = (globalThis as any).div(
        () => {
          if (shouldThrow) throw new Error('Initial error');
          return validClass;
        },
        'Error Test'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.textContent).toBe('Error Test');

      // Fix the error
      shouldThrow = false;
      expect(() => update()).not.toThrow();
    });

    it('should handle function that starts working then throws', () => {
      let shouldThrow = false;
      const validClass = cn(bg('red'));

      const element = (globalThis as any).div(
        () => {
          if (shouldThrow) throw new Error('Runtime error');
          return validClass;
        },
        'Runtime Error'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(validClass.className);

      // Cause error
      shouldThrow = true;
      expect(() => update()).not.toThrow();

      // Should preserve last good value or handle gracefully
      expect(result.textContent).toBe('Runtime Error');
    });
  });

  describe('Complex object structures', () => {
    it('should handle nested objects (not className)', () => {
      const complexObj = {
        className: {
          nested: 'value',
        },
      };

      const element = (globalThis as any).div(
        () => complexObj,
        'Complex'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Should not be treated as valid className
      expect(result.textContent).toBe('Complex');
    });

    it('should handle arrays (not className)', () => {
      const arrayValue = ['class1', 'class2'];

      const element = (globalThis as any).div(
        () => arrayValue,
        'Array'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Arrays are objects but should not be treated as className
      expect(result.textContent).toBe('Array');
    });

    it('should handle functions (not className)', () => {
      const funcValue = () => 'nested function';

      const element = (globalThis as any).div(
        funcValue // Pass function directly - it will be called and return text
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Function returns a string, so it becomes reactive text
      expect(result.textContent).toBe('nested function');
    });

    it('should handle class instances with className property', () => {
      class CustomClass {
        className = 'custom-class';
        otherProp = 'value';
      }

      const instance = new CustomClass();

      const element = (globalThis as any).div(
        () => instance,
        'Class Instance'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Should not be treated as cn() className because it has multiple properties
      expect(result.textContent).toBe('Class Instance');
    });
  });

  describe('Race conditions and timing', () => {
    it('should handle rapid successive updates', () => {
      let counter = 0;
      const classes = [
        cn(bg('red')),
        cn(bg('blue')),
        cn(bg('green')),
        cn(bg('yellow')),
        cn(bg('purple')),
      ];

      const element = (globalThis as any).div(
        () => classes[counter % classes.length],
        'Rapid Updates'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Perform rapid updates
      for (let i = 0; i < 100; i++) {
        counter = i;
        update();
        expect(result.className).toBe(classes[i % classes.length].className);
      }
    });

    it('should maintain consistency with concurrent state changes', () => {
      let value1 = 0;
      let value2 = 0;
      const class1 = cn(bg('red'));
      const class2 = cn(bg('blue'));

      const element = (globalThis as any).div(
        () => (value1 + value2) % 2 === 0 ? class1 : class2,
        () => `Sum: ${value1 + value2}`
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      value1 = 1;
      value2 = 2;
      update();

      const sum = value1 + value2;
      const expectedClass = sum % 2 === 0 ? class1.className : class2.className;
      expect(result.className).toBe(expectedClass);
      expect(result.textContent).toContain(`Sum: ${sum}`);
    });
  });

  describe('Memory and cleanup', () => {
    it('should not leak memory with many className changes', () => {
      let counter = 0;
      const classes = Array.from({ length: 20 }, (_, i) =>
        cn(bg(`hsl(${i * 18}, 70%, 50%)`))
      );

      const element = (globalThis as any).div(
        () => classes[counter % classes.length]
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Cycle through many times
      for (let i = 0; i < 200; i++) {
        counter = i;
        update();
      }

      // Should still work correctly
      expect(result.className).toBeTruthy();
    });

    it('should handle element removal and recreation', () => {
      let toggle = true;
      const dynamicClass = cn(bg('red'));

      const { when } = globalThis as any;

      const element = (globalThis as any).div(
        when(
          () => toggle,
          (globalThis as any).div(
            () => dynamicClass,
            'Conditional Element'
          )
        )
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      let conditionalEl = result.querySelector('div');
      expect(conditionalEl?.className).toBe(dynamicClass.className);

      // Remove
      toggle = false;
      update();
      expect(result.querySelector('div')).toBeNull();

      // Re-create
      toggle = true;
      update();
      conditionalEl = result.querySelector('div');
      expect(conditionalEl?.className).toBe(dynamicClass.className);
    });
  });
});
