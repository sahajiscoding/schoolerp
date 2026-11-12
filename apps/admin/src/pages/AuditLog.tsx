import { useMemo, useState } from 'react';
import { useAppData as useData } from '../lib/appData';
import { Badge, Card, StatCard, Table, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { formatDateTime } from '../lib/utils';
import { FiActivity, FiLock, FiSearch, FiShield } from 'react-icons/fi';

export default function AuditLog() {
  const data = useData();
  const [query, setQuery] = useState('');

  const entries = useMemo(
    () => data.audit.filter((entry) => {
      if (!query) return true;
      const actor = data.people.find((person) => person.id === entry.actorId)?.full_name ?? '';
      return `${actor} ${entry.action} ${entry.target}`.toLowerCase().includes(query.toLowerCase());
    }),
    [data.audit, data.people, query],
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Safeguarding & accountability"
        title="Audit log"
        description="Administrative actions are read-only here. They cannot be edited or deleted from this page."
      />

      <MetricGrid className="lg:grid-cols-2 xl:grid-cols-2">
        <StatCard label="Recorded entries" value={data.audit.length} icon={FiActivity} />
        <StatCard label="Matching this view" value={entries.length} icon={FiSearch} variant="neutral" />
      </MetricGrid>

      <aside className="surface-muted flex items-start gap-3 p-4 text-sm leading-6 text-deep-olive">
        <FiShield size={17} className="mt-1 shrink-0" aria-hidden="true" />
        <p>In the live system this view is backed by <code className="rounded bg-paper/70 px-1.5 py-0.5 text-xs">audit_log</code> with RLS: administrators can read entries and only the service role can insert them.</p>
      </aside>

      <Card padded={false}>
        <div className="flex flex-col gap-4 p-5 pb-3 sm:p-6 sm:pb-3 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading title="Recorded activity" description="Search by actor, action or affected record." />
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search audit log</span>
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actor, action or student" className="field-control pl-10" />
          </label>
        </div>

        {entries.length ? (
          <Table className="min-w-0">
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead className="hidden lg:table-cell">Target</TableHead></TableRow></TableHeader>
            <tbody>
              {entries.map((entry) => {
                const actor = data.people.find((person) => person.id === entry.actorId);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted">{formatDateTime(entry.at)}</TableCell>
                    <TableCell><span className="block text-sm font-semibold">{actor?.full_name ?? 'System'}</span><Badge variant={actor?.role === 'admin' ? 'terracotta' : 'olive'} className="mt-1">{actor?.role ?? 'system'}</Badge></TableCell>
                    <TableCell><span className="text-sm">{entry.action}</span><span className="mt-1 block text-xs text-muted lg:hidden">{entry.target}</span></TableCell>
                    <TableCell className="hidden text-muted lg:table-cell">{entry.target}</TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="p-5 pt-2 sm:p-6 sm:pt-2"><EmptyState title="No entries match that search" description="Clear the search or try another actor, action or record." icon={FiLock} /></div>
        )}
      </Card>
    </Page>
  );
}
