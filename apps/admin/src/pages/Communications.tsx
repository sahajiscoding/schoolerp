import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCommunicationsData } from '../lib/useCommunicationsData';
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
import { FiCheckCircle, FiPlus, FiSend } from 'react-icons/fi';
import { cn, formatDateLong } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAppData } from '../lib/appData';

const DECLARATION_TYPES = ['Transport', 'Registration', 'Academic', 'Medical', 'Discipline'];
const AUDIENCES = ['Whole school', 'IX - E', 'IX - A', 'V - A'];

export default function Communications() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useCommunicationsData();

  const [openDeclaration, setOpenDeclaration] = useState(false);
  const [openMessage, setOpenMessage] = useState(false);
  const [openPoll, setOpenPoll] = useState(false);

  const [declarationForm, setDeclarationForm] = useState({
    name: '',
    description: '',
    type: 'Transport',
  });
  const [messageForm, setMessageForm] = useState({
    title: '',
    body: '',
    section_label: 'IX - E',
  });
  const [pollForm, setPollForm] = useState({
    question: '',
    audience: 'Whole class',
    closes_at: '',
    options: ['Option A', 'Option B'],
  });

  const canAuthor = isAdmin() || isTeacher();
  const demo = useAppData();
  const demoPeople = demo.people;
  const mySection =
    demoPeople.find((p) => p.id === profile?.id)?.class_teacher_of ?? 'IX - E';
    demoPeople.find((p) => p.id === profile?.id)?.class_teacher_of ?? 'IX - E';

  const handleSign = async (id: string) => {
    if (!profile) return;
    await data.signDeclaration(id);
    data.notify('Declaration signed.');
  };

  const handleCreateDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declarationForm.name.trim()) {
      data.notify('Give the declaration a name before publishing.');
      return;
    }
    if (data.isLive) {
      // Live mode: create via Supabase directly since publish RPC for declarations
      // isn't in scope for this slice.
      const { error } = await (supabase.from('declaration_forms') as any)
        .insert({
          title: declarationForm.name.trim(),
          body: declarationForm.description.trim() || declarationForm.name.trim(),
          audience: declarationForm.type,
          section_ids: [],
          created_by: profile.id,
          due_date: null,
        });
      if (error) {
        data.notify('Could not publish the declaration. Please try again.');
        return;
      }
    } else {
      demo.addDeclaration({
        name: declarationForm.name.trim(),
        description: declarationForm.description.trim() || declarationForm.name.trim(),
        type: declarationForm.type,
      });
    }
    setDeclarationForm({ name: '', description: '', type: 'Transport' });
    setOpenDeclaration(false);
    data.notify('Declaration published.');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!messageForm.body.trim()) {
      data.notify('Write a message first.');
      return;
    }
    if (data.isLive) {
      data.notify('Message send via live threads is coming in the next slice.');
      return;
    }
    demo.broadcastMessage({
      title: messageForm.title.trim() || 'Message from your teacher',
      body: messageForm.body.trim(),
      section_label: messageForm.section_label,
      created_by: profile.id,
    });
    setMessageForm({ title: '', body: '', section_label: 'IX - E' });
    setOpenMessage(false);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!pollForm.question.trim()) {
      data.notify('A poll needs a question.');
      return;
    }
    await data.createPoll({
      question: pollForm.question.trim(),
      audience: pollForm.audience,
      created_by: profile.id,
      closes_at: pollForm.closes_at || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      options: pollForm.options.filter(Boolean),
    });
    setPollForm({ question: '', audience: 'Whole class', closes_at: '', options: ['Option A', 'Option B'] });
    setOpenPoll(false);
    data.notify('Poll published.');
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!profile) return;
    await data.votePoll(pollId, optionId, profile.id);
    data.notify('Vote recorded.');
  };

  // Per-student: a form is "to sign" only if THIS student has not signed it.
  const pendingDeclarations = data.declarations.filter(
    (f) => !(f.signed_by ?? []).includes(profile?.id ?? ''),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Communications</h1>
          <p className="text-muted">
            Declaration forms, messages, and polls.
            {isStudent() && ' Sign your pending forms and reply to your class teacher.'}
            {isTeacher() && ` You send to ${mySection}.`}
          </p>
        </div>
        {canAuthor && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setOpenDeclaration(true)}>
              <FiPlus size={16} /> Declaration form
            </Button>
            <Button variant="outline" onClick={() => setOpenMessage(true)}>
              <FiSend size={16} /> Send message
            </Button>
            <Button onClick={() => setOpenPoll(true)}>
              <FiPlus size={16} /> Create poll
            </Button>
          </div>
        )}
      </div>

      {data.loading && <p className="text-sm text-muted">Loading communications…</p>}

      {data.error && (
        <Card className="flex items-center gap-3 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" role="alert">
          <p className="text-sm text-red-700 dark:text-red-300">{data.error}</p>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => void data.refresh()}>
            Try again
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-ink">Declaration forms</h3>
            {isStudent() ? (
              <Badge variant={pendingDeclarations ? 'warning' : 'success'}>
                {pendingDeclarations ? `${pendingDeclarations} to sign` : 'All signed'}
              </Badge>
            ) : (
              <Badge variant="olive">{data.declarations.length} published</Badge>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {data.declarations.map((form) => {
                  const signedBy = form.signed_by ?? [];
                  const iSigned = signedBy.includes(profile?.id ?? '');
                  return (
                    <TableRow key={form.id}>
                      <TableCell>
                        <div className="font-medium text-ink">{form.name}</div>
                        <div className="text-xs text-muted">{form.description}</div>
                      </TableCell>
                      <TableCell>{form.type}</TableCell>
                      <TableCell>
                        {isStudent() ? (
                          <Badge variant={iSigned ? 'success' : 'pending'}>
                            {iSigned ? 'signed' : 'pending'}
                          </Badge>
                        ) : (
                          <Badge variant={signedBy.length ? 'olive' : 'pending'}>
                            {signedBy.length} signed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isStudent() ? (
                          iSigned ? (
                            <span className="text-xs text-muted">
                              Signed {form.signed_at ? formatDateLong(form.signed_at.slice(0, 10)) : ''}
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSign(form.id)}
                            >
                              <FiCheckCircle size={14} /> Sign
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-muted">
                            {signedBy.length ? `${signedBy.length} student${signedBy.length === 1 ? '' : 's'} signed` : 'Awaiting students'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data.declarations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-4 text-center text-muted">
                      No declaration forms yet.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-ink">Polls</h3>
            {canAuthor ? (
              <Button size="sm" onClick={() => setOpenPoll(true)}>
                <FiPlus size={14} /> Create poll
              </Button>
            ) : null}
          </div>
          <div className="space-y-3">
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
                      const alreadyVoted = myVote !== undefined;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleVote(poll.id, opt.id)}
                          disabled={alreadyVoted}
                          className={cn(
                            'flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-left transition-colors',
                            alreadyVoted
                              ? 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-not-allowed'
                              : 'border-slate-300 bg-white text-ink hover:border-navy hover:bg-navy/5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-olive dark:hover:bg-olive/5',
                          )}
                        >
                          <span className="flex-1 text-sm">{opt.label}</span>
                          <span className="text-xs font-medium">
                            {count} ({pct}%)
                          </span>
                          {alreadyVoted && (
                            <span className="text-[10px] text-emerald-600">Voted</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
            {data.polls.length === 0 && (
              <p className="text-sm text-muted text-center">No polls yet.</p>
            )}
          </div>
        </Card>
      </div>

      {openDeclaration && canAuthor && (
        <Card>
          <form onSubmit={handleCreateDeclaration} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={declarationForm.name}
                onChange={(e) => setDeclarationForm((v) => ({ ...v, name: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Type
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={declarationForm.type}
                onChange={(e) => setDeclarationForm((v) => ({ ...v, type: e.target.value }))}
              >
                {DECLARATION_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted sm:col-span-2">
              Description
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                rows={2}
                value={declarationForm.description}
                onChange={(e) => setDeclarationForm((v) => ({ ...v, description: e.target.value }))}
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={data.loading}>
                {data.loading ? 'Publishing…' : 'Publish declaration'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {openMessage && canAuthor && (
        <Card>
          <form onSubmit={handleSendMessage} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted sm:col-span-2">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={messageForm.title}
                onChange={(e) => setMessageForm((v) => ({ ...v, title: e.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-muted sm:col-span-2">
              Section
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={messageForm.section_label}
                onChange={(e) => setMessageForm((v) => ({ ...v, section_label: e.target.value }))}
              >
                {AUDIENCES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted sm:col-span-2">
              Body
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                rows={3}
                value={messageForm.body}
                onChange={(e) => setMessageForm((v) => ({ ...v, body: e.target.value }))}
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={data.loading}>
                {data.loading ? 'Sending…' : 'Send message'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {openPoll && canAuthor && (
        <Card>
          <form onSubmit={handleCreatePoll} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted sm:col-span-2">
              Question
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={pollForm.question}
                onChange={(e) => setPollForm((v) => ({ ...v, question: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Closes on
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={pollForm.closes_at}
                onChange={(e) => setPollForm((v) => ({ ...v, closes_at: e.target.value }))}
                required
              />
            </label>
            {pollForm.options.map((opt, i) => (
              <label key={i} className="text-xs font-medium text-muted">
                Option {i + 1}
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  value={opt}
                  onChange={(e) =>
                    setPollForm((v) => ({ ...v, options: v.options.map((o, j) => (j === i ? e.target.value : o)) }))
                  }
                />
              </label>
            ))}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={data.loading}>
                {data.loading ? 'Publishing…' : 'Publish poll'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
