import { describe, it, expect } from 'vitest';
import { localeFromPath } from '../../../src/utils/locale';

describe('localeFromPath', () => {
  it.each(['/en', '/en/', '/en/blog', '/en/trainings/ai'])('erkennt %s als Englisch', (path) => {
    expect(localeFromPath(path)).toBe('en');
  });

  it.each(['/', '/blog', '/trainings', '/leistungen/ki-mcp', '/english', '/entwicklung'])(
    'erkennt %s als Deutsch',
    (path) => {
      expect(localeFromPath(path)).toBe('de');
    }
  );
});
