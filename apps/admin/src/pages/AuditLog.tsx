import { useMemo, useState } from 'react';
import { useAuditLogData } from '../lib/useAuditLogData';
import {
  Card,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui';
import { formatDateTime } from '../lib/utils';
import { FiShield } from 'react-icons/fi';

export default function AuditLog() {
  const data = useAuditLogData();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Audit Log</h1>
        <p className="text-muted">
          Every administrative action is recorded. Entries are read-only — admins cannot edit or delete
          them, on this page or in the database.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-olive/15 bg-olive/5 p-3 text-xs text-olive">
        <FiShield size={14} className="mt-0.5 shrink-0" />
        <span>
          In the live system this table is backed by <code>audit_log</code> with RLS: admins can
          select, only the service role can insert.
        </span>
      </div>

      <Card>
        <div className="mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actor, action or student"
            className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
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
                      <div className="text-sm font-medium">{actor?.full_name ?? 'System'}</div>
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
    </div>
  );
}
