import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { theme } from '@schoolerp/shared';

const cssPath = resolve(process.cwd(), 'src/index.css');

describe('Living Campus design contract', () => {
  it('exports the approved semantic palette', () => {
    expect(theme.colors).toMatchObject({
      olive: '#586A36',
      deepOlive: '#3F512A',
      leaf: '#DCE6C4',
      daylight: '#F7F2E8',
      paper: '#FFFEFA',
      terracotta: '#D97747',
      clay: '#F1D5C3',
      ink: '#2F3D2A',
    });
  });

  it('contains focus, reveal, and reduced-motion contracts', () => {
    const css = readFileSync(cssPath, 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('.page-reveal');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
