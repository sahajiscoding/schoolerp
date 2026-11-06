import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Button } from "../components/ui";

/** Report-parity `/messages/create` — compose to teachers/admins (server-side targeting on live). */
export default function MessageCreate() {
  const { profile } = useAuth();
  const data = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: "", body: "", recipientId: "" });

  const recipients = data.people.filter((p) => p.is_active && p.id !== profile?.id);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.subject.trim() || !form.body.trim() || !form.recipientId) {
      data.notify("Subject, recipient, and a message are required.");
      return;
    }
    data.createThread({
      subject: form.subject.trim(),
      participant_ids: [profile.id, form.recipientId],
      sender_id: profile.id,
      body: form.body.trim(),
    });
    navigate("/messages?box=sent&page=1&limit=10");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/messages" className="text-xs text-muted hover:text-navy dark:hover:text-blue-300">
        ← Back to messages
      </Link>
      <h2 className="text-xl font-bold text-ink dark:text-white">New message</h2>
      <Card>
        <form onSubmit={handleSend} className="space-y-3">
          <label className="block text-xs font-medium text-muted">
            Recipient
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.recipientId}
              onChange={(e) => setForm((v) => ({ ...v, recipientId: e.target.value }))}
              required
            >
              <option value="">Select a recipient…</option>
              {recipients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.role})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-muted">
            Subject
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.subject}
              onChange={(e) => setForm((v) => ({ ...v, subject: e.target.value }))}
              required
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            Message
            <textarea
              className="mt-1 min-h-32 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.body}
              onChange={(e) => setForm((v) => ({ ...v, body: e.target.value }))}
              required
            />
          </label>
          <Button type="submit">Send message</Button>
        </form>
      </Card>
    </div>
  );
}
