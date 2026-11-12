import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { theme } from '@schoolerp/shared';

const cssPath = resolve(process.cwd(), 'src/index.css');

describe('Future Heritage design contract', () => {
  it('exports the approved semantic palette', () => {
    expect(theme.colors).toMatchObject({
      forest: '#173027',
      parchment: '#ECE8DC',
      paper: '#FCFAF4',
      gold: '#E4CF83',
      moss: '#6D7D42',
      ink: '#172219',
      muted: '#5E6B62',
    });
  });

  it('contains a global focus treatment and reduced-motion override', () => {
    const css = readFileSync(cssPath, 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.page-reveal');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('scrollbar-gutter: stable');
    expect(css).not.toContain('transition: all');
  });
});
