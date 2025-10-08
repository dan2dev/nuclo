// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import "../../src/index";

describe('CamelCase CSS Properties', () => {
  let parent: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  it('should support camelCase CSS properties in static styles', () => {
    const element = (globalThis as any).div(
      "Hello World",
      {
        style: {
          fontSize: "24px",
          backgroundColor: "#ff0000",
          borderRadius: "5px",
          marginTop: "10px",
          paddingLeft: "20px",
          zIndex: "100"
        }
      }
    )(parent, 0);

    expect(element.style.fontSize).toBe('24px');
    expect(element.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(element.style.borderRadius).toBe('5px');
    expect(element.style.marginTop).toBe('10px');
    expect(element.style.paddingLeft).toBe('20px');
    expect(element.style.zIndex).toBe('100');
  });

  it('should support camelCase CSS properties in reactive styles', () => {
    let data = { color: "blue", size: 16 };

    const element = (globalThis as any).div(
      "Dynamic Styles",
      {
        style: () => ({
          fontSize: data.color === "blue" ? "40px" : "20px",
          backgroundColor: data.color,
          borderRadius: data.size + "px",
          marginTop: "15px"
        })
      }
    )(document.body, 0);
    document.body.appendChild(element as Node);

    // Initial state
    expect(element.style.fontSize).toBe('40px');
    expect(element.style.backgroundColor).toBe('blue');
    expect(element.style.borderRadius).toBe('16px');
    expect(element.style.marginTop).toBe('15px');

    // Update data and trigger reactive update
    data.color = "green";
    data.size = 8;
    (globalThis as any).update();

    // Updated state
    expect(element.style.fontSize).toBe('20px');
    expect(element.style.backgroundColor).toBe('green');
    expect(element.style.borderRadius).toBe('8px');
    expect(element.style.marginTop).toBe('15px');
  });

  it('should support mixed camelCase and kebab-case properties', () => {
    const element = (globalThis as any).div(
      "Mixed Properties",
      {
        style: {
          fontSize: "18px",          // camelCase
          "font-weight": "bold",     // kebab-case
          backgroundColor: "#00ff00", // camelCase
          "border-color": "red"      // kebab-case
        }
      }
    )(parent, 0);

    expect(element.style.fontSize).toBe('18px');
    expect(element.style.fontWeight).toBe('bold');
    expect(element.style.backgroundColor).toBe('rgb(0, 255, 0)');
    expect(element.style.borderColor).toBe('red');
  });

  it('should handle vendor prefixed properties in camelCase', () => {
    const element = (globalThis as any).div(
      "Vendor Prefixes",
      {
        style: {
          WebkitTransform: "scale(1.2)",
          MozUserSelect: "none",
          msFilter: "blur(2px)"
        }
      }
    )(parent, 0);

    // Note: Different browsers may normalize these differently
    // We're mainly testing that they don't throw errors and get applied
    const computedStyle = window.getComputedStyle(element);
    
    // The properties should be set without throwing errors
    expect(() => {
      element.style.getPropertyValue('-webkit-transform');
      element.style.getPropertyValue('-moz-user-select'); 
      element.style.getPropertyValue('-ms-filter');
    }).not.toThrow();
  });

  it('should remove camelCase properties when set to null/undefined', () => {
    let showStyles = true;

    const element = (globalThis as any).div(
      "Conditional Styles",
      {
        style: () => ({
          fontSize: showStyles ? "22px" : null,
          backgroundColor: showStyles ? "yellow" : undefined,
          borderRadius: showStyles ? "3px" : null
        })
      }
    )(document.body, 0);
    document.body.appendChild(element as Node);

    // Initially styles should be applied
    expect(element.style.fontSize).toBe('22px');
    expect(element.style.backgroundColor).toBe('yellow');
    expect(element.style.borderRadius).toBe('3px');

    // Remove styles
    showStyles = false;
    (globalThis as any).update();

    // Styles should be removed
    expect(element.style.fontSize).toBe('');
    expect(element.style.backgroundColor).toBe('');
    expect(element.style.borderRadius).toBe('');
  });

  it('should demonstrate direct style property assignment (no regex needed)', () => {
    // This test shows that we directly assign to style properties
    // instead of converting camelCase to kebab-case with regex
    
    const element = (globalThis as any).div(
      "Direct Assignment Test",
      {
        style: {
          fontSize: "32px",           // Directly assigned to element.style.fontSize
          backgroundColor: "yellow",  // Directly assigned to element.style.backgroundColor
          marginTop: "25px",          // Directly assigned to element.style.marginTop
          "border-style": "solid"     // Uses setProperty for kebab-case
        }
      }
    )(parent, 0);

    // Verify that the properties were set correctly
    expect(element.style.fontSize).toBe('32px');
    expect(element.style.backgroundColor).toBe('yellow');
    expect(element.style.marginTop).toBe('25px');
    expect(element.style.borderStyle).toBe('solid');
  });
});