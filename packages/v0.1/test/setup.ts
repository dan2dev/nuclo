import { vi, beforeEach, afterEach } from 'vitest';

// Globally spy on console.error to suppress noisy error output in tests
// Tests can still verify that errors are logged, but won't see the actual output
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});
