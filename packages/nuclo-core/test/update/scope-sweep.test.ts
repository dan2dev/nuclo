/// <reference path="../../types/index.d.ts" />
/** @vitest-environment jsdom */
import { it, expect } from 'vitest';
import { scope, getScopeRoots } from '../../src/update/scope';

it('re-registers a root that was pruned while disconnected', () => {
  const el = document.createElement('div');
  scope('back')(el as never, 0);
  expect(getScopeRoots(['back'])).toEqual([]); // detached: pruned
  document.body.appendChild(el);
  scope('back')(el as never, 0); // forceUpdate()-style reclaim
  expect(getScopeRoots(['back'])).toEqual([el]);
  el.remove();
});

it('registers the same root/id only once', () => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  for (let i = 0; i < 200; i++) scope('once')(el as never, 0);
  expect(getScopeRoots(['once'])).toEqual([el]);
  el.remove();
});
