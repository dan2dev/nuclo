/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { update } from '../src/core/updateController';
import { createBreakpoints, bg, padding } from '../src/style';
import '../src/core/runtimeBootstrap';

const cn = createBreakpoints({
  small: "(min-width: 320px)",
  medium: "(min-width: 768px)",
});

describe('Static and reactive className ordering', () => {
  let container: HTMLDivElement;
  let state: { toggle: boolean };

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    state = { toggle: true };
  });

  it('should apply both classes when static className comes before reactive className', () => {
    const staticClass = cn(padding('20px'));
    const reactiveClass1 = cn(bg('#0000FF'));
    const reactiveClass2 = cn(bg('#FF0000'));

    const element = (globalThis as any).div(
      "text",
      staticClass,
      () => state.toggle ? reactiveClass1 : reactiveClass2,
    );

    const result = element(container, 0) as HTMLDivElement;
    container.appendChild(result as Node);

    // Both static and reactive classes should be present
    const classes = result.className.split(' ').filter(c => c);
    expect(classes.length).toBe(2);
    const staticClassName = typeof staticClass === 'string' ? staticClass : staticClass.className;
    const reactiveClassName1 = typeof reactiveClass1 === 'string' ? reactiveClass1 : reactiveClass1.className;
    expect(classes).toContain(staticClassName);
    expect(classes).toContain(reactiveClassName1);

    // After update, static class should still be there with new reactive class
    state.toggle = false;
    update();

    const updatedClasses = result.className.split(' ').filter(c => c);
    expect(updatedClasses.length).toBe(2);
    const reactiveClassName2 = typeof reactiveClass2 === 'string' ? reactiveClass2 : reactiveClass2.className;
    expect(updatedClasses).toContain(staticClassName);
    expect(updatedClasses).toContain(reactiveClassName2);
    expect(updatedClasses).not.toContain(reactiveClassName1);
  });

  it('should apply both classes when reactive className comes before static className', () => {
    const staticClass = cn(padding('20px'));
    const reactiveClass1 = cn(bg('#0000FF'));
    const reactiveClass2 = cn(bg('#FF0000'));

    const element = (globalThis as any).div(
      "text",
      () => state.toggle ? reactiveClass1 : reactiveClass2,
      staticClass,
    );

    const result = element(container, 0) as HTMLDivElement;
    container.appendChild(result as Node);

    // Both static and reactive classes should be present
    const classes = result.className.split(' ').filter(c => c);
    expect(classes.length).toBe(2);
    const staticClassName = typeof staticClass === 'string' ? staticClass : staticClass.className;
    const reactiveClassName1 = typeof reactiveClass1 === 'string' ? reactiveClass1 : reactiveClass1.className;
    expect(classes).toContain(staticClassName);
    expect(classes).toContain(reactiveClassName1);

    // After update, static class should still be there with new reactive class
    state.toggle = false;
    update();

    const updatedClasses = result.className.split(' ').filter(c => c);
    expect(updatedClasses.length).toBe(2);
    const reactiveClassName2 = typeof reactiveClass2 === 'string' ? reactiveClass2 : reactiveClass2.className;
    expect(updatedClasses).toContain(staticClassName);
    expect(updatedClasses).toContain(reactiveClassName2);
    expect(updatedClasses).not.toContain(reactiveClassName1);
  });

  it('should handle multiple static classes with reactive className', () => {
    const staticClass1 = cn(padding('20px'));
    const staticClass2 = cn(bg('#FFFFFF'));
    const reactiveClass = cn(bg('#0000FF'));

    const element = (globalThis as any).div(
      staticClass1,
      staticClass2,
      () => reactiveClass,
      "text"
    );

    const result = element(container, 0) as HTMLDivElement;
    container.appendChild(result as Node);

    // All three classes should be present
    const classes = result.className.split(' ').filter(c => c);
    expect(classes.length).toBe(3);
    const staticClassName1 = typeof staticClass1 === 'string' ? staticClass1 : staticClass1.className;
    const staticClassName2 = typeof staticClass2 === 'string' ? staticClass2 : staticClass2.className;
    const reactiveClassName = typeof reactiveClass === 'string' ? reactiveClass : reactiveClass.className;
    expect(classes).toContain(staticClassName1);
    expect(classes).toContain(staticClassName2);
    expect(classes).toContain(reactiveClassName);
  });

  it('should work with the example from the issue - static then reactive', () => {
    const p20 = cn(padding('20px'));
    const pgBlue = cn(bg('#0000FF'));

    const element = (globalThis as any).div(
      "olá",
      p20,
      () => pgBlue,
    );

    const result = element(container, 0) as HTMLDivElement;
    container.appendChild(result as Node);

    const classes = result.className.split(' ').filter(c => c);
    expect(classes.length).toBe(2);
    const p20ClassName = typeof p20 === 'string' ? p20 : p20.className;
    const pgBlueClassName = typeof pgBlue === 'string' ? pgBlue : pgBlue.className;
    expect(classes).toContain(p20ClassName);
    expect(classes).toContain(pgBlueClassName);
  });

  it('should work with the example from the issue - reactive then static', () => {
    const p20 = cn(padding('20px'));
    const pgBlue = cn(bg('#0000FF'));

    const element = (globalThis as any).div(
      "olá",
      () => pgBlue,
      p20,
    );

    const result = element(container, 0) as HTMLDivElement;
    container.appendChild(result as Node);

    const classes = result.className.split(' ').filter(c => c);
    expect(classes.length).toBe(2);
    const p20ClassName = typeof p20 === 'string' ? p20 : p20.className;
    const pgBlueClassName = typeof pgBlue === 'string' ? pgBlue : pgBlue.className;
    expect(classes).toContain(p20ClassName);
    expect(classes).toContain(pgBlueClassName);
  });
});
