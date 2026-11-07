import { expect, it } from 'vitest';
import { expandDashboardEvents } from '../src/lib/dashboard';
import { seedEvents } from '../src/lib/seed';

it('expands multi-day events into the four dashboard day rows', () => {
  const events = expandDashboardEvents(seedEvents, new Date(2026, 10, 7, 12));

  expect(events.map((event) => event.display_date)).toEqual([
    '2026-11-07',
    '2026-11-09',
    '2026-11-10',
    '2026-11-11',
  ]);
});
