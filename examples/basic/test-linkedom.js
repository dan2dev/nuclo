import { parseHTML } from 'linkedom';

const { window, document } = parseHTML('<!DOCTYPE html><html><head></head><body></body></html>');

Object.assign(global, {
  window,
  document,
  HTMLElement: window.HTMLElement,
  Element: window.Element,
  Node: window.Node,
  Text: window.Text,
  Comment: window.Comment,
});

console.log('Document:', typeof document);
console.log('Global document:', typeof global.document);
console.log('Window:', typeof window);
console.log('Global window:', typeof global.window);

// Try importing nuclo after setting up globals
import('nuclo').then(() => {
  console.log('Nuclo imported successfully!');
}).catch(err => {
  console.error('Error importing nuclo:', err.message);
});
