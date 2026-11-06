import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Table, TableHeader, TableRow, TableHead, TableCell, Badge } from "../components/ui";
import { formatDateLong } from "../lib/utils";

/** Report-parity `/examination-report-cards?page=1&limit=10` — term PDFs + marksheets. */
export default function ExaminationReportCards() {
  const { profile, isStudent } = useAuth();
  const data = useData();
  const [params] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? "10") || 10));

  const cards = useMemo(
    () =>
      isStudent()
        ? data.reportCards.filter((c) => c.student_id === profile?.id)
        : data.reportCards,
    [data.reportCards, isStudent, profile?.id],
  );
  const paged = cards.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ink dark:text-white">Examination Report Cards</h2>
      <Card padded={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Term</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Generated</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {paged.map((c) => {
              const student = data.people.find((p) => p.id === c.student_id);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.term}</div>
                    <div className="text-xs text-muted">
                      {c.class_label} - {c.section_label} · {c.academic_year}
                    </div>
                  </TableCell>
                  <TableCell>{student?.full_name ?? "Student"}</TableCell>
                  <TableCell>
                    {c.total.toFixed(0)} / {c.max_total.toFixed(0)} ({c.percentage.toFixed(1)}%)
                  </TableCell>
                  <TableCell>
                    <Badge variant="olive">{c.grade}</Badge>
                  </TableCell>
                  <TableCell>{formatDateLong(c.generated_at)}</TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
        {paged.length === 0 && <p className="p-6 text-sm text-muted">No report cards yet.</p>}
      </Card>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>
          Page {page} · showing {paged.length} of {cards.length}
        </span>
        <Link className="underline" to={`/examination-report-cards?page=${page + 1}&limit=${limit}`}>
          Next →
        </Link>
      </div>
    </div>
  );
}
