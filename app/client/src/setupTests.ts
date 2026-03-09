import '@testing-library/jest-dom/vitest';

// @ts-expect-error React 19 + Vitest test-only global
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
