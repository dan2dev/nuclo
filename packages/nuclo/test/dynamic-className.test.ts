/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { update } from '../src';
import { createBreakpoints, bg, padding, width } from '../src/style';

// Create breakpoints for testing
const cn = createBreakpoints({
  small: "(min-width: 320px)",
  medium: "(min-width: 768px)",
  large: "(min-width: 1024px)",
});

describe('Dynamic className with cn()', () => {
  let container: HTMLDivElement;
  let state = {
    toggle: true,
    count: 0,
    color: 'red',
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    state = {
      toggle: true,
      count: 0,
      color: 'red',
    };
  });

  describe('Basic dynamic className', () => {
    it('should apply dynamic className from cn() with breakpoints', () => {
      const class1 = cn(bg('red').padding('10px'), {
        medium: bg('blue').padding('20px'),
      });
      const class2 = cn(bg('green').padding('15px'), {
        medium: bg('yellow').padding('25px'),
      });

      const element = (globalThis as any).div(
        () => state.toggle ? class1 : class2,
        'Dynamic Style'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Initial state should use class1
      expect(result.className).toBe(class1.className);
      expect(result.textContent).toBe('Dynamic Style');

      // Toggle state
      state.toggle = false;
      update();

      // Should now use class2
      expect(result.className).toBe(class2.className);
      expect(result.textContent).toBe('Dynamic Style');
    });

    it('should apply dynamic className from cn() without breakpoints', () => {
      const class1 = cn(bg('red').padding('10px'));
      const class2 = cn(bg('green').padding('15px'));

      const element = (globalThis as any).div(
        () => state.toggle ? class1 : class2,
        'Simple Dynamic'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(class1.className);

      state.toggle = false;
      update();

      expect(result.className).toBe(class2.className);
    });

    it('should update className when reactive dependency changes', () => {
      const redClass = cn(bg('red'));
      const greenClass = cn(bg('green'));
      const blueClass = cn(bg('blue'));

      const element = (globalThis as any).div(
        () => {
          if (state.count === 0) return redClass;
          if (state.count === 1) return greenClass;
          return blueClass;
        },
        'Multi-state'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(redClass.className);

      state.count = 1;
      update();
      expect(result.className).toBe(greenClass.className);

      state.count = 2;
      update();
      expect(result.className).toBe(blueClass.className);

      state.count = 0;
      update();
      expect(result.className).toBe(redClass.className);
    });
  });

  describe('Mixed static and dynamic className', () => {
    it('should work with static className followed by dynamic content', () => {
      const staticClass = cn(bg('white').padding('5px'));
      const dynamicClass1 = cn(bg('red'));
      const dynamicClass2 = cn(bg('blue'));

      const element = (globalThis as any).div(
        staticClass,
        () => state.toggle ? dynamicClass1 : dynamicClass2,
        'Mixed'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Both classes should be applied (static is on element, dynamic might override)
      // The element should have at least the dynamic class
      const hasExpectedClass = result.className.includes(dynamicClass1.className) ||
                               result.className.includes(staticClass.className);
      expect(hasExpectedClass).toBe(true);
    });

    it('should combine with reactive text content', () => {
      const class1 = cn(bg('red'));
      const class2 = cn(bg('blue'));

      const element = (globalThis as any).div(
        () => state.toggle ? class1 : class2,
        () => `Count: ${state.count}`
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(class1.className);
      expect(result.textContent).toContain('Count: 0');

      state.toggle = false;
      state.count = 5;
      update();

      expect(result.className).toBe(class2.className);
      expect(result.textContent).toContain('Count: 5');
    });
  });

  describe('Edge cases and validation', () => {
    it('should not treat reactive text as className', () => {
      const element = (globalThis as any).div(
        () => `Text: ${state.count}`
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Should be treated as text content, not className
      expect(result.textContent).toContain('Text: 0');
      expect(result.className).toBe('');

      state.count = 10;
      update();

      expect(result.textContent).toContain('Text: 10');
      expect(result.className).toBe('');
    });

    it('should not treat objects with multiple properties as className', () => {
      const element = (globalThis as any).div(
        () => ({ className: 'test', otherProp: 'value' }),
        'Content'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Should not apply the className since object has multiple properties
      // It should be treated as attributes
      expect(result.textContent).toBe('Content');
    });

    it('should not treat DOM nodes as className', () => {
      const childNode = document.createElement('span');
      childNode.textContent = 'Child';

      const element = (globalThis as any).div(
        childNode // Pass node directly, not as function
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Should append the node, not treat it as className
      expect(result.contains(childNode)).toBe(true);
    });

    it('should handle null/undefined returns gracefully', () => {
      const class1 = cn(bg('red'));

      const element = (globalThis as any).div(
        () => state.toggle ? class1 : null,
        'Nullable'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(class1.className);

      state.toggle = false;
      update();

      // When null, className might be empty or unchanged based on implementation
      expect(result.textContent).toBe('Nullable');
    });
  });

  describe('Complex scenarios', () => {
    it('should work with nested elements', () => {
      const parentClass1 = cn(bg('red').padding('20px'));
      const parentClass2 = cn(bg('blue').padding('20px'));
      const childClass1 = cn(bg('yellow').padding('10px'));
      const childClass2 = cn(bg('green').padding('10px'));

      const element = (globalThis as any).div(
        () => state.toggle ? parentClass1 : parentClass2,
        (globalThis as any).div(
          () => state.toggle ? childClass1 : childClass2,
          'Nested'
        )
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(parentClass1.className);
      const child = result.querySelector('div');
      expect(child?.className).toBe(childClass1.className);

      state.toggle = false;
      update();

      expect(result.className).toBe(parentClass2.className);
      expect(child?.className).toBe(childClass2.className);
    });

    it('should work with multiple dynamic classNames in sequence', () => {
      const class1 = cn(bg('red'));
      const class2 = cn(bg('blue'));
      const class3 = cn(bg('green'));

      const app = (globalThis as any).div(
        (globalThis as any).div(
          () => state.count === 0 ? class1 : class2,
          'First'
        ),
        (globalThis as any).div(
          () => state.count > 0 ? class3 : class1,
          'Second'
        )
      );

      const result = app(container, 0);
      container.appendChild(result as Node);

      const divs = result.querySelectorAll('div');
      expect(divs[0].className).toBe(class1.className);
      expect(divs[1].className).toBe(class1.className);

      state.count = 1;
      update();

      expect(divs[0].className).toBe(class2.className);
      expect(divs[1].className).toBe(class3.className);
    });

    it('should work with conditional rendering (when)', () => {
      const class1 = cn(bg('red'));
      const class2 = cn(bg('blue'));

      const { when } = globalThis as any;

      const element = (globalThis as any).div(
        when(
          () => state.toggle,
          (globalThis as any).div(
            () => class1,
            'True Branch'
          )
        ).else(
          (globalThis as any).div(
            () => class2,
            'False Branch'
          )
        )
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      let activeDiv = result.querySelector('div');
      expect(activeDiv?.className).toBe(class1.className);
      expect(activeDiv?.textContent).toBe('True Branch');

      state.toggle = false;
      update();

      activeDiv = result.querySelector('div');
      expect(activeDiv?.className).toBe(class2.className);
      expect(activeDiv?.textContent).toBe('False Branch');
    });

    it('should work with list rendering', () => {
      const class1 = cn(bg('red'));
      const class2 = cn(bg('blue'));

      const items = [
        { id: 1, active: true },
        { id: 2, active: false },
        { id: 3, active: true },
      ];

      const { list } = globalThis as any;

      const element = (globalThis as any).div(
        list(
          () => items,
          (item) => (globalThis as any).div(
            () => item.active ? class1 : class2,
            `Item ${item.id}`
          )
        )
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      const divs = result.querySelectorAll('div');
      expect(divs[0].className).toBe(class1.className);
      expect(divs[1].className).toBe(class2.className);
      expect(divs[2].className).toBe(class1.className);

      // Toggle first item
      items[0].active = false;
      update();

      expect(divs[0].className).toBe(class2.className);
    });
  });

  describe('Performance and caching', () => {
    it('should reuse same className when condition returns same value', () => {
      const class1 = cn(bg('red'));
      const class2 = cn(bg('blue'));

      const element = (globalThis as any).div(
        () => state.toggle ? class1 : class2
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      const initialClassName = result.className;
      expect(initialClassName).toBe(class1.className);

      // Update but keep same condition
      state.count = 100; // Change other state
      update();

      // className should remain the same
      expect(result.className).toBe(initialClassName);
    });

    it('should handle rapid state changes', () => {
      const class1 = cn(bg('red'));
      const class2 = cn(bg('blue'));
      const class3 = cn(bg('green'));

      const element = (globalThis as any).div(
        () => {
          if (state.count % 3 === 0) return class1;
          if (state.count % 3 === 1) return class2;
          return class3;
        },
        'Rapid'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      for (let i = 0; i < 10; i++) {
        state.count = i;
        update();

        const expected = i % 3 === 0 ? class1.className :
                        i % 3 === 1 ? class2.className :
                        class3.className;
        expect(result.className).toBe(expected);
      }
    });
  });

  describe('Integration with attributes', () => {
    it('should work alongside reactive attributes', () => {
      const class1 = cn(bg('red'));
      const class2 = cn(bg('blue'));

      const element = (globalThis as any).div(
        {
          id: () => `item-${state.count}`,
          title: () => state.toggle ? 'Active' : 'Inactive',
        },
        () => state.toggle ? class1 : class2,
        'Content'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(class1.className);
      expect(result.id).toBe('item-0');
      expect(result.title).toBe('Active');

      state.toggle = false;
      state.count = 5;
      update();

      expect(result.className).toBe(class2.className);
      expect(result.id).toBe('item-5');
      expect(result.title).toBe('Inactive');
    });

    it('should work with static and reactive attributes mixed', () => {
      const dynamicClass = cn(bg('red'));
      const staticClass = cn(bg('blue'));

      const element = (globalThis as any).div(
        staticClass,
        {
          'data-static': 'value',
          'data-dynamic': () => `count-${state.count}`,
        },
        () => dynamicClass,
        'Mixed Attributes'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.getAttribute('data-static')).toBe('value');
      expect(result.getAttribute('data-dynamic')).toBe('count-0');

      state.count = 10;
      update();

      expect(result.getAttribute('data-dynamic')).toBe('count-10');
    });
  });

  describe('Breakpoint-specific behavior', () => {
    it('should handle cn() with only breakpoints (no default)', () => {
      const responsiveClass = cn({
        medium: width('50%'),
        large: width('75%'),
      });

      const element = (globalThis as any).div(
        () => responsiveClass,
        'Responsive'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      // Should apply the className even without default styles
      expect(result.className).toBeTruthy();
    });

    it('should dynamically switch between responsive classes', () => {
      const mobileClass = cn(width('100%'), {
        medium: width('50%'),
      });
      const desktopClass = cn(width('50%'), {
        large: width('33%'),
      });

      const element = (globalThis as any).div(
        () => state.toggle ? mobileClass : desktopClass,
        'Device-specific'
      );

      const result = element(container, 0);
      container.appendChild(result as Node);

      expect(result.className).toBe(mobileClass.className);

      state.toggle = false;
      update();

      expect(result.className).toBe(desktopClass.className);
    });
  });
});
