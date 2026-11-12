import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  StatCard,
} from '../components/ui';
import { Modal } from '../components/modal';
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { FiCreditCard, FiLink, FiSend, FiUsers, FiX } from 'react-icons/fi';
import { formatDateLong, inr } from '../lib/utils';

/**
 * Fee module.
 *
 * School rule: the campus offers a 50% sibling discount. The discount lands on
 * the *second* child, never the first. The admin links the pair on this page;
 * the link is mirrored onto the sibling's invoice so the dashboard total is
 * correct everywhere.
 */
export default function Fees() {
  const { profile, isAdmin, isStudent } = useAuth();
  const data = useData();
  const [openSibling, setOpenSibling] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [siblingForm, setSiblingForm] = useState({
    student_id: '',
    sibling_id: '',
    discount_percent: 50,
  });
  const [payForm, setPayForm] = useState({ invoice_id: '', amount: '' });

  // Fee collection and sibling discounts are admin-only, matching the
  // fee_records_admin_write / sibling_links_admin_write RLS policies.
  const canManage = isAdmin();
  const students = data.people.filter((p) => p.role === 'student');
  const myFees = isStudent() ? data.fees.filter((f) => f.student_id === profile?.id) : data.fees;

  /** sibling student id → link, so a row can say "sibling of X". */
  const siblingByStudent = useMemo(() => {
    const map = new Map<string, { firstChildId: string; discount: number }>();
    for (const link of data.siblings) {
      map.set(link.sibling_id, {
        firstChildId: link.student_id,
        discount: link.discount_percent,
      });
    }
    return map;
  }, [data.siblings]);

  const totals = useMemo(() => {
    const billed = myFees.reduce((sum, f) => sum + (f.amount - f.discount), 0);
    const paid = myFees.reduce((sum, f) => sum + f.paid, 0);
    const discounts = myFees.reduce((sum, f) => sum + f.discount, 0);
    return { billed, paid, discounts, due: Math.max(0, billed - paid) };
  }, [myFees]);

  const handleLinkSibling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!siblingForm.student_id || !siblingForm.sibling_id) {
      data.notify('Choose both the first child and the sibling.');
      return;
    }
    if (siblingForm.student_id === siblingForm.sibling_id) {
      data.notify('A student cannot be their own sibling.');
      return;
    }
    data.linkSibling(
      siblingForm.student_id,
      siblingForm.sibling_id,
      Number(siblingForm.discount_percent) || 50,
    );
    setSiblingForm({ student_id: '', sibling_id: '', discount_percent: 50 });
    setOpenSibling(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!payForm.invoice_id || !payForm.amount) {
      data.notify('Pick an invoice and enter the amount received.');
      return;
    }
    data.recordPayment(payForm.invoice_id, Number(payForm.amount) || 0);
    setPayForm({ invoice_id: '', amount: '' });
    setOpenPay(false);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Finance"
        title={isStudent() ? 'My fee' : 'Fee collection'}
        description={canManage
              ? 'Link siblings so the 50% discount lands on the second child, then record payments.'
              : 'Your instalments, discounts and payment status.'}
        meta={`${myFees.length} invoices`}
        actions={canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setOpenSibling(true)}>
              <FiLink size={16} /> Link sibling
            </Button>
            <Button onClick={() => setOpenPay(true)}>
              <FiSend size={16} /> Record payment
            </Button>
          </div>
        ) : undefined}
      />

      <MetricGrid>
        <StatCard label="Billed after discount" value={inr(totals.billed)} icon={FiCreditCard} variant="neutral" />
        <StatCard label="Collected" value={inr(totals.paid)} icon={FiCreditCard} />
        <StatCard label="Outstanding" value={inr(totals.due)} icon={FiCreditCard} variant="terracotta" />
        <StatCard label="Sibling discounts" value={inr(totals.discounts)} icon={FiUsers} variant="warning" />
      </MetricGrid>

      <Card>
        <SectionHeading title={isStudent() ? 'My fee invoices' : 'Fee invoices'} description="Billed amount, applied discount, payment and due status." action={<Badge variant="olive">{myFees.length} invoices</Badge>} />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Payable</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <tbody>
              {myFees.map((fee) => {
                const student = data.people.find((p) => p.id === fee.student_id);
                const siblingInfo = siblingByStudent.get(fee.student_id);
                const firstChild = siblingInfo
                  ? data.people.find((p) => p.id === siblingInfo.firstChildId)
                  : null;
                const payable = fee.amount - fee.discount;
                return (
                  <TableRow key={fee.id}>
                    <TableCell>
                       <div className="font-bold">{student?.full_name ?? '—'}</div>
                      <div className="text-xs text-muted">
                        {student?.class_label} {student?.section_label}
                        {siblingInfo && (
                          <span className="ml-1 text-terracotta">
                            · sibling of {firstChild?.full_name ?? 'another student'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{fee.term}</TableCell>
                    <TableCell>{inr(fee.amount)}</TableCell>
                    <TableCell>
                      {fee.discount > 0 ? (
                        <span className="font-medium text-terracotta">−{inr(fee.discount)}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{inr(payable)}</TableCell>
                    <TableCell>{inr(fee.paid)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted">
                      {formatDateLong(fee.due_date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          fee.status === 'paid'
                            ? 'success'
                            : fee.status === 'partial'
                              ? 'warning'
                              : 'terracotta'
                        }
                      >
                        {fee.status}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        {fee.status !== 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPayForm({ invoice_id: fee.id, amount: `${payable - fee.paid}` });
                              setOpenPay(true);
                            }}
                          >
                            <FiCreditCard size={14} /> Pay
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
               {myFees.length === 0 && <TableRow><TableCell colSpan={canManage ? 9 : 8}><EmptyState title="No fee invoices yet" /></TableCell></TableRow>}
            </tbody>
          </Table>
        </div>
      </Card>

      <Card>
        <SectionHeading
          title="Sibling links"
          description="The 50% campus discount is applied to the sibling — the second child — not the first."
          action={canManage ? (
            <Button variant="outline" size="sm" onClick={() => setOpenSibling(true)}>
              <FiUsers size={14} /> Add link
            </Button>
          ) : undefined}
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First child</TableHead>
                <TableHead>Sibling (discounted)</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Effect on invoice</TableHead>
                {canManage && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <tbody>
              {data.siblings.map((link) => {
                const first = data.people.find((p) => p.id === link.student_id);
                const sib = data.people.find((p) => p.id === link.sibling_id);
                const invoice = data.fees.find((f) => f.student_id === link.sibling_id);
                return (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="font-medium">{first?.full_name ?? '—'}</div>
                      <div className="text-xs text-muted">
                        {first?.class_label} {first?.section_label} · {first?.admission_no}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{sib?.full_name ?? '—'}</div>
                      <div className="text-xs text-muted">
                        {sib?.class_label} {sib?.section_label} · {sib?.admission_no}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="terracotta">{link.discount_percent}%</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {invoice ? (
                        <span className="text-olive">
                          {inr(invoice.discount)} off {invoice.term}
                        </span>
                      ) : (
                        <span className="text-muted">No invoice yet</span>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => data.unlinkSibling(link.id)}
                        >
                          <FiX size={14} /> Remove
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {data.siblings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-4 text-center text-muted">
                    No siblings linked yet.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {canManage && openSibling && (
        <Modal title="Link siblings" description="Pick the first child, then the sibling who receives the discount." onClose={() => setOpenSibling(false)}>
          <form onSubmit={handleLinkSibling} className="space-y-3">
            <div>
              <label htmlFor="first-child" className="field-label">First child (full fee)</label>
              <select
                id="first-child"
                value={siblingForm.student_id}
                onChange={(e) => setSiblingForm({ ...siblingForm, student_id: e.target.value })}
                className="field-control"
              >
                <option value="">Select first child</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} · {s.class_label} {s.section_label} ({s.admission_no})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="discounted-sibling" className="field-label">
                Sibling (receives discount)
              </label>
              <select
                id="discounted-sibling"
                value={siblingForm.sibling_id}
                onChange={(e) => setSiblingForm({ ...siblingForm, sibling_id: e.target.value })}
                className="field-control"
              >
                <option value="">Select sibling</option>
                {students
                  .filter((s) => s.id !== siblingForm.student_id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} · {s.class_label} {s.section_label} ({s.admission_no})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="sibling-discount" className="field-label">Sibling discount (%)</label>
              <input
                id="sibling-discount"
                type="number"
                min={0}
                max={100}
                value={siblingForm.discount_percent}
                onChange={(e) =>
                  setSiblingForm({ ...siblingForm, discount_percent: Number(e.target.value) })
                }
                className="field-control"
              />
              <p className="mt-1 text-xs text-muted">
                Campus policy is 50%. The discount is written onto the sibling’s invoice only.
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="ghost" type="button" onClick={() => setOpenSibling(false)}>
                Cancel
              </Button>
              <Button type="submit">Link &amp; apply discount</Button>
            </div>
          </form>
        </Modal>
      )}

      {canManage && openPay && (
        <Modal title="Record payment" description="Apply a received amount to one fee invoice." onClose={() => setOpenPay(false)}>
          <form onSubmit={handleRecordPayment} className="space-y-3">
            <div>
              <label htmlFor="payment-invoice" className="field-label">Invoice</label>
              <select
                id="payment-invoice"
                value={payForm.invoice_id}
                onChange={(e) => setPayForm({ ...payForm, invoice_id: e.target.value })}
                className="field-control"
              >
                <option value="">Select invoice</option>
                {myFees.map((f) => {
                  const student = data.people.find((p) => p.id === f.student_id);
                  return (
                    <option key={f.id} value={f.id}>
                      {student?.full_name ?? f.student_id} · {f.term} ·{' '}
                      {inr(f.amount - f.discount - f.paid)} due
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label htmlFor="payment-amount" className="field-label">Amount received (₹)</label>
              <input
                id="payment-amount"
                type="number"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                className="field-control"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="ghost" type="button" onClick={() => setOpenPay(false)}>
                Cancel
              </Button>
              <Button type="submit">Record payment</Button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  );
}
