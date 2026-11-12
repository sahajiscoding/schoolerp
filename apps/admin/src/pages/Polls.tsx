import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePollsData } from "../lib/usePollsData";
import { Card, Button } from "../components/ui";
import { formatDateLong } from "../lib/utils";

/** Report-parity `/polls` — active surveys. */
export default function Polls() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = usePollsData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ question: "", audience: "Whole class", closes_at: "", options: ["Option A", "Option B"] });

  const canAuthor = isAdmin() || isTeacher();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.question.trim() || !form.closes_at) {
      data.notify("Question, two options, and a closing date are required.");
      return;
    }
    data.addPoll({
      question: form.question.trim(),
      section_ids: [],
      created_by: profile.id,
      closes_on: form.closes_at,
    });
    setForm({ question: "", audience: "Whole class", closes_at: "", options: ["Option A", "Option B"] });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-ink dark:text-white">Polls</h2>
        {canAuthor && (
          <Button size="sm" className="ml-auto" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "New poll"}
          </Button>
        )}
      </div>

      {open && canAuthor && (
        <Card>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted sm:col-span-2">
              Question
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={form.question}
                onChange={(e) => setForm((v) => ({ ...v, question: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Closes on
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={form.closes_at}
                onChange={(e) => setForm((v) => ({ ...v, closes_at: e.target.value }))}
                required
              />
            </label>
            {form.options.map((opt, i) => (
              <label key={i} className="text-xs font-medium text-muted">
                Option {i + 1}
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  value={opt}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, options: v.options.map((o, j) => (j === i ? e.target.value : o)) }))
                  }
                />
              </label>
            ))}
            <div className="sm:col-span-2">
              <Button type="submit">Publish poll</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {data.polls.map((poll) => {
          const myVote = profile ? poll.votes[profile.id] : undefined;
          const totalVotes = Object.keys(poll.votes).length;
          return (
            <Card key={poll.id}>
              <div className="font-semibold text-ink dark:text-white">{poll.question}</div>
              <div className="text-xs text-muted">
                {poll.audience} · closes {formatDateLong(poll.closes_at)} · {totalVotes} vote(s)
              </div>
              <div className="mt-3 space-y-2">
                {poll.options.map((opt) => {
                  const count = Object.values(poll.votes).filter((v) => v === opt.id).length;
                  const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                  return (
                    <button
                      key={opt.id}
                      disabled={!isStudent() || !!myVote}
                      onClick={() => { if (!data.isLive) data.notify('Voting is not available in live mode.'); }}
                      className={
                        myVote === opt.id
                          ? "w-full rounded-lg border border-navy bg-navy/5 px-3 py-2 text-left text-sm font-medium text-navy dark:text-blue-300"
                          : "w-full rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-ink hover:border-navy disabled:opacity-60 dark:border-slate-700 dark:text-white"
                      }
                    >
                      <span className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        {myVote && <span className="text-xs text-muted">{pct}%</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
      {data.polls.length === 0 && <p className="text-sm text-muted">No active surveys.</p>}
    </div>
  );
}
