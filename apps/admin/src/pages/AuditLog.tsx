import { useMemo, useState } from 'react';
import { useAppData as useData } from '../lib/appData';
import {
  Card,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  StatCard,
} from '../components/ui';
import { MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { formatDateTime } from '../lib/utils';
import { FiShield } from 'react-icons/fi';

export default function AuditLog() {
  const data = useData();
  const [query, setQuery] = useState('');

  const entries = useMemo(
    () =>
      data.audit.filter((entry) => {
        if (!query) return true;
        const actor = data.people.find((p) => p.id === entry.actorId)?.full_name ?? '';
        return `${actor} ${entry.action} ${entry.target}`.toLowerCase().includes(query.toLowerCase());
      }),
    [data.audit, data.people, query],
  );
  const actorCount = new Set(data.audit.map((entry) => entry.actorId)).size;

  return (
    <Page>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="Every administrative action is recorded. Entries are read-only and cannot be edited or deleted here."
        meta={`${data.audit.length} recorded actions`}
      />

      <MetricGrid className="xl:grid-cols-3">
        <StatCard label="Recorded actions" value={data.audit.length} icon={FiShield} />
        <StatCard label="Actors represented" value={actorCount} icon={FiShield} variant="neutral" />
        <StatCard label="Visible results" value={entries.length} icon={FiShield} variant="terracotta" />
      </MetricGrid>

      <div className="flex items-start gap-2 rounded-heritage border border-moss/20 bg-moss/10 p-4 text-xs leading-5 text-[#4f5f28]">
        <FiShield size={14} className="mt-0.5 shrink-0" />
        <span>
          In the live system this table is backed by <code>audit_log</code> with RLS: admins can
          select, only the service role can insert.
        </span>
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-4 px-5 pt-5 sm:px-6 sm:pt-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading title="Activity ledger" description="Read-only actions ordered by recorded time." className="mb-0" />
          <input
            aria-label="Search audit log"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actor, action or student"
            className="field-control max-w-sm"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {entries.map((entry) => {
                const actor = data.people.find((p) => p.id === entry.actorId);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted">
                      {formatDateTime(entry.at)}
                    </TableCell>
                    <TableCell>
                       <div className="text-sm font-bold">{actor?.full_name ?? 'System'}</div>
                      <Badge variant={actor?.role === 'admin' ? 'terracotta' : 'olive'} className="mt-1">
                        {actor?.role ?? 'system'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{entry.action}</TableCell>
                    <TableCell className="text-sm text-muted">{entry.target}</TableCell>
                  </TableRow>
                );
              })}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-4 text-center text-muted">
                    No entries match that search.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </Page>
  );
}
