import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (!globalThis.URL.createObjectURL) {
  Object.defineProperty(globalThis.URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'blob:preview-url'),
  });
}

if (!globalThis.URL.revokeObjectURL) {
  Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });
}
