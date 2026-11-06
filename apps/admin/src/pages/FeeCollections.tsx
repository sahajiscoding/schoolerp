import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Table, TableHeader, TableRow, TableHead, TableCell, Button } from "../components/ui";
import { inr as formatINR, formatDateLong } from "../lib/utils";

/**
 * Report-parity `/fee-collections/create?student=:id` — fee dashboard +
 * payment ledger. Sibling 50% discount = second child only (admin-owned,
 * enforced in RLS on live; demo applies it in the store).
 */
export default function FeeCollections() {
  const { profile, isStudent } = useAuth();
  const data = useData();
  const [params] = useSearchParams();
  const studentParam = params.get("student");

  const targetId = studentParam && !isStudent() ? studentParam : profile?.id;
  const invoices = useMemo(
    () => data.fees.filter((f) => f.student_id === targetId),
    [data.fees, targetId],
  );
  const total = invoices.reduce((s, f) => s + f.amount, 0);
  const paid = invoices.reduce((s, f) => s + f.paid, 0);
  const balance = total - paid;

  const handlePay = (invoiceId: string, amount: number) => {
    data.recordPayment(invoiceId, amount);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ink dark:text-white">Fee Collections</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-2xl font-bold text-ink dark:text-white">{formatINR(total)}</div>
          <div className="text-xs text-muted">Total demand</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-emerald-600">{formatINR(paid)}</div>
          <div className="text-xs text-muted">Collected</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-rose-600">{formatINR(balance)}</div>
          <div className="text-xs text-muted">Balance</div>
        </Card>
      </div>
      <Card padded={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Term</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {invoices.map((f) => (
              <TableRow key={f.id}>
                <TableCell>
                  <div className="font-medium">{f.term}</div>
                  <div className="text-xs text-muted">{f.academic_year}</div>
                </TableCell>
                <TableCell>{formatINR(f.amount)}</TableCell>
                <TableCell>{formatINR(f.discount)}</TableCell>
                <TableCell>{formatINR(f.paid)}</TableCell>
                <TableCell>{formatDateLong(f.due_date)}</TableCell>
                <TableCell>
                  <span
                    className={
                      f.status === "paid"
                        ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : f.status === "partial"
                          ? "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    }
                  >
                    {f.status}
                  </span>
                </TableCell>
                <TableCell>
                  {f.status !== "paid" && (
                    <Button size="sm" onClick={() => handlePay(f.id, f.amount - f.discount - f.paid)}>
                      Pay balance
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        {invoices.length === 0 && <p className="p-6 text-sm text-muted">No fee invoices.</p>}
      </Card>
    </div>
  );
}
