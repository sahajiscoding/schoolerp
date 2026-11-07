import { eachDayOfInterval, format, parseISO } from 'date-fns';
import type { SchoolEvent } from './types';

export type DashboardEvent = SchoolEvent & { display_date: string };

/** Expands a multi-day event into the day rows used by the dashboard. */
export function expandDashboardEvents(events: SchoolEvent[], now: Date): DashboardEvent[] {
  const today = format(now, 'yyyy-MM-dd');

  return events
    .flatMap((event) =>
      eachDayOfInterval({ start: parseISO(event.start_date), end: parseISO(event.end_date) }).map((day) => {
        const displayDate = format(day, 'yyyy-MM-dd');
        return { ...event, start_date: displayDate, end_date: displayDate, display_date: displayDate };
      }),
    )
    .filter((event) => event.display_date >= today)
    .sort((a, b) => a.display_date.localeCompare(b.display_date))
    .slice(0, 4);
}
