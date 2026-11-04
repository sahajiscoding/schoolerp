import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui';

export default function AuditLog() {
  const { isAdmin } = useAuth();

  if (!isAdmin()) return <div className="p-4 text-terracotta">Admin only</div>;

  const logs = [
    { actor: 'School Administrator', action: 'Created user', entity: 'Sahaj Chugh (0185/18)', time: '2026-11-03 10:00' },
    { actor: 'Anuradha Gupta', action: 'Approved leave', entity: 'Aarav Mehta', time: '2026-11-03 09:15' },
    { actor: 'School Administrator', action: 'Linked sibling', entity: 'Vivaan Chugh → Sahaj Chugh', time: '2026-11-02 14:20' },
    { actor: 'Radhika Malhotra', action: 'Published assignment', entity: 'Quadratic equations worksheet', time: '2026-11-01 06:15' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Audit Log</h1>
          <p className="text-muted">Administrative actions are recorded and read-only.</p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {logs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{log.actor}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-sm text-muted">{log.entity}</TableCell>
                  <TableCell className="text-sm text-muted">{log.time}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted py-4">
                    No audit records yet.
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
