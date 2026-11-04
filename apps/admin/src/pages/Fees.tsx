import { useState } from 'react';
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
} from '../components/ui';
import { FiCreditCard, FiPlus, FiUsers, FiSend, FiRotateCcw } from 'react-icons/fi';

export default function Fees() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [openSibling, setOpenSibling] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [siblingForm, setSiblingForm] = useState({
    student_id: '',
    sibling_id: '',
    discount_percent: 50,
  });
  const [payForm, setPayForm] = useState({
    invoice_id: '',
    amount: '',
  });

  const canManage = isAdmin() || isTeacher();
  const students = data.people.filter((p) => p.role === 'student');
  const myFees = isStudent() ? data.fees.filter((f) => f.student_id === profile?.id) : data.fees;

  const handleLinkSibling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.linkSibling(siblingForm.student_id, siblingForm.sibling_id, Number(siblingForm.discount_percent) || 50);
    setSiblingForm({ student_id: '', sibling_id: '', discount_percent: 50 });
    setOpenSibling(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.recordPayment(payForm.invoice_id, Number(payForm.amount) || 0);
    setPayForm({ invoice_id: '', amount: '' });
    setOpenPay(false);
  };

  const siblingMap = new Map(data.siblings.map((s) => [s.student_id, s]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {isStudent() ? 'My Fee' : 'Fees'}
          </h1>
          <p className="text-muted">
            {canManage
              ? 'Link siblings and apply 50% sibling discount to the sibling, not the first child.'
              : 'View your fee invoices and payment status.'}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button onClick={() => setOpenSibling(true)}>
              <FiUsers size={16} /> Link sibling
            </Button>
            <Button onClick={() => setOpenPay(true)}>
              <FiSend size={16} /> Record payment
            </Button>
          </div>
        )}
      </div>

      {canManage && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <Card className="p-4">
            <div className="text-xs text-muted">Total invoices</div>
            <div className="text-2xl font-bold text-ink">{myFees.length}</div>
          </Card>
          <Card className="p-4 border-olive/10 bg-olive/5">
            <div className="text-xs text-muted text-olive">Paid</div>
            <div className="text-2xl font-bold text-olive">
              {myFees.filter((f) => f.status === 'paid').length}
            </div>
          </Card>
          <Card className="p-4 border-terracotta/10 bg-terracotta/5">
            <div className="text-xs text-muted text-terracotta">Unpaid / partial</div>
            <div className="text-2xl font-bold text-terracotta">
              {myFees.filter((f) => f.status !== 'paid').length}
            </div>
          </Card>
        </div>
      )}

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink">
            {isStudent() ? 'My fee invoices' : 'All fee invoices'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead>Sibling</TableHead> : null}
              </TableRow>
            </TableHeader>
            <tbody>
              {myFees.map((fee) => {
                const student = data.people.find((p) => p.id === fee.student_id);
                const siblingLink = siblingMap.get(fee.student_id);
                const isSibling = fee.sibling_of || siblingLink;
                return (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">
                      {student?.full_name ?? '—'} {isSibling ? <span className="text-xs text-terracotta ml-1">(sibling)</span> : null}
                    </TableCell>
                    <TableCell>{fee.term}</TableCell>
                    <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {fee.discount > 0 ? (
                        <span className="text-terracotta font-medium">-₹{fee.discount.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell>₹{fee.paid.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted">{fee.due_date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={(
                          fee.status === 'paid'
                            ? 'success'
                            : fee.status === 'partial'
                              ? 'warning'
                              : 'terracotta'
                        )}
                      >
                        {fee.status}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-sm">
                        {fee.sibling_of ? 'Linked sibling' : <span className="text-muted">—</span>}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
              {myFees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted py-4">
                    No fee invoices yet.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink">Sibling links</h3>
          <p className="text-muted text-sm">
            50% discount applies to the sibling, not the first child.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First child</TableHead>
                <TableHead>Sibling</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {data.siblings.map((link) => {
                const first = data.people.find((p) => p.id === link.student_id);
                const sib = data.people.find((p) => p.id === link.sibling_id);
                return (
                  <TableRow key={link.id}>
                    <TableCell>{first?.full_name ?? '—'}</TableCell>
                    <TableCell>{sib?.full_name ?? '—'}</TableCell>
                    <TableCell>{link.discount_percent}%</TableCell>
                    <TableCell>
                      {canManage && (
                        <Button variant="danger" size="sm" onClick={() => {
                          data.linkSibling(link.student_id, link.sibling_id, 0);
                        }}>
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.siblings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted py-4">
                    No sibling links yet.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {canManage && openSibling && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 lg:hidden">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">Link sibling</h2>
            <form onSubmit={handleLinkSibling} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">First child</label>
                <select
                  value={siblingForm.student_id}
                  onChange={(e) => setSiblingForm({ ...siblingForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select first child</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.login_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Sibling</label>
                <select
                  value={siblingForm.sibling_id}
                  onChange={(e) => setSiblingForm({ ...siblingForm, sibling_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select sibling</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.login_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Sibling discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={siblingForm.discount_percent}
                  onChange={(e) =>
                    setSiblingForm({
                      ...siblingForm,
                      discount_percent: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpenSibling(false)}>
                  Cancel
                </Button>
                <Button type="submit">Link sibling</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {canManage && openPay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 lg:hidden">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">Record payment</h2>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Invoice</label>
                <select
                  value={payForm.invoice_id}
                  onChange={(e) => setPayForm({ ...payForm, invoice_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select invoice</option>
                  {myFees.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.student_id} · {f.term} · ₹{f.amount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Amount paid</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpenPay(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record payment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
