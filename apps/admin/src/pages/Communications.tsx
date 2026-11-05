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
import { FiCheckCircle, FiPlus, FiSend, FiUsers } from 'react-icons/fi';
import { cn, formatDateLong } from '../lib/utils';

const DECLARATION_TYPES = ['Transport', 'Registration', 'Academic', 'Medical', 'Discipline'];
const AUDIENCES = ['Whole school', 'IX - E', 'IX - A', 'V - A'];

export default function Communications() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();

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
  const canCreatePoll = canAuthor;
  const mySection =
    data.people.find((p) => p.id === profile?.id)?.class_teacher_of ?? 'IX - E';

  const handleSign = (id: string) => {
    if (!profile) return;
    data.signDeclaration(id, profile.id);
  };

  const handleCreateDeclaration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declarationForm.name.trim()) {
      data.notify('Give the declaration a name before publishing.');
      return;
    }
    data.addDeclaration({
      name: declarationForm.name.trim(),
      description: declarationForm.description.trim() || declarationForm.name.trim(),
      type: declarationForm.type,
    });
    setDeclarationForm({ name: '', description: '', type: 'Transport' });
    setOpenDeclaration(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!messageForm.body.trim()) {
      data.notify('Write a message first.');
      return;
    }
    data.broadcastMessage({
      title: messageForm.title.trim() || 'Message from your teacher',
      body: messageForm.body.trim(),
      section_label: messageForm.section_label,
      created_by: profile.id,
    });
    setMessageForm({ title: '', body: '', section_label: 'IX - E' });
    setOpenMessage(false);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!pollForm.question.trim()) {
      data.notify('A poll needs a question.');
      return;
    }
    data.createPoll({
      question: pollForm.question.trim(),
      audience: pollForm.audience,
      created_by: profile.id,
      closes_at: pollForm.closes_at || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      options: pollForm.options.filter(Boolean),
    });
    setPollForm({ question: '', audience: 'Whole class', closes_at: '', options: ['Option A', 'Option B'] });
    setOpenPoll(false);
  };

  const handleVote = (pollId: string, optionId: string) => {
    if (!profile) return;
    data.votePoll(pollId, optionId, profile.id);
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-ink">Declaration forms</h3>
            {isStudent() ? (
              <Badge variant={pendingDeclarations ? 'terracotta' : 'success'}>
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
                          <Badge variant={iSigned ? 'success' : 'pending'}>{iSigned ? 'signed' : 'pending'}</Badge>
                        ) : (
                          <Badge variant={signedBy.length ? 'olive' : 'pending'}>{signedBy.length} signed</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isStudent() ? (
                          iSigned ? (
                            <span className="text-xs text-muted">
                              Signed {form.signed_at ? formatDateLong(form.signed_at.slice(0, 10)) : ''}
                            </span>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleSign(form.id)}>
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
                      No declaration forms.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink">Polls</h3>
            {canCreatePoll && (
              <Button size="sm" onClick={() => setOpenPoll(true)}>
                <FiPlus size={14} /> New
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {data.polls.map((poll) => {
              const totalVotes = Object.values(poll.votes).length;
              const optionVotes = (id: string) =>
                Object.values(poll.votes).filter((v) => v === id).length;
              const hasVoted = profile ? poll.votes[profile.id] : false;
              return (
                <div key={poll.id} className="rounded-lg border border-sand/40 p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="font-medium text-ink">{poll.question}</div>
                    <Badge variant="olive">{poll.audience}</Badge>
                  </div>
                  <div className="mb-3 text-xs text-muted">
                    {totalVotes} vote{totalVotes === 1 ? '' : 's'} · closes{' '}
                    {formatDateLong(poll.closes_at)}
                  </div>
                  {poll.options.map((opt) => {
                    const voted = hasVoted === opt.id;
                    const share = totalVotes > 0 ? Math.round((optionVotes(opt.id) / totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} className="mb-2">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className={voted ? 'font-medium text-olive' : ''}>{opt.label}</span>
                          <span className="text-muted">{share}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200">
                          <div
                            className={cn('h-2 rounded-full transition-all duration-300', voted ? 'bg-olive' : 'bg-slate-300')}
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        {!hasVoted && isStudent() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(poll.id, opt.id)}
                            className="mt-2 w-full text-[10px]"
                          >
                            Vote
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {hasVoted && <span className="mt-1 block text-xs text-olive">Your vote is recorded</span>}
                </div>
              );
            })}
            {data.polls.length === 0 && (
              <div className="py-6 text-center text-sm text-muted">
                No polls yet. {canCreatePoll && 'Create one to get started.'}
              </div>
            )}
          </div>
        </Card>
      </div>

      {canAuthor && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">Recent messages</h3>
              <p className="text-sm text-muted">Broadcasts land in the student notification bell.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpenMessage(true)}>
              <FiSend size={14} /> Send
            </Button>
          </div>
          <div className="space-y-2">
            {data.notifications
              .filter((n) => n.kind === 'notice')
              .slice(0, 6)
              .map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-lg border border-sand/40 p-3">
                  <span className="mt-0.5 rounded bg-olive/10 p-1.5 text-olive">
                    <FiUsers size={14} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{n.title}</div>
                    <div className="truncate text-xs text-muted">{n.body}</div>
                  </div>
                  <span className="ml-auto shrink-0 text-[10px] text-slate-400">
                    {formatDateLong(n.created_at.slice(0, 10))}
                  </span>
                </div>
              ))}
            {data.notifications.filter((n) => n.kind === 'notice').length === 0 && (
              <div className="py-4 text-center text-sm text-muted">No messages sent yet.</div>
            )}
          </div>
        </Card>
      )}

      {openDeclaration && (
        <Modal title="Publish declaration form" onClose={() => setOpenDeclaration(false)}>
          <form onSubmit={handleCreateDeclaration} className="space-y-3">
            <Field label="Form name">
              <input
                value={declarationForm.name}
                onChange={(e) => setDeclarationForm({ ...declarationForm, name: e.target.value })}
                className={inputCls}
                placeholder="Transport Norms Declaration"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={declarationForm.description}
                onChange={(e) => setDeclarationForm({ ...declarationForm, description: e.target.value })}
                rows={3}
                className={inputCls}
                placeholder="What the student or parent is agreeing to"
              />
            </Field>
            <Field label="Type">
              <select
                value={declarationForm.type}
                onChange={(e) => setDeclarationForm({ ...declarationForm, type: e.target.value })}
                className={inputCls}
              >
                {DECLARATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <ModalActions onCancel={() => setOpenDeclaration(false)} submitLabel="Publish" />
          </form>
        </Modal>
      )}

      {openMessage && (
        <Modal title="Send a message" onClose={() => setOpenMessage(false)}>
          <form onSubmit={handleSendMessage} className="space-y-3">
            <Field label="Subject">
              <input
                value={messageForm.title}
                onChange={(e) => setMessageForm({ ...messageForm, title: e.target.value })}
                className={inputCls}
                placeholder="Revision schedule for the half-yearly"
              />
            </Field>
            <Field label="Message">
              <textarea
                value={messageForm.body}
                onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })}
                rows={5}
                className={inputCls}
                placeholder="Write your message to the class…"
              />
            </Field>
            <Field label="Send to">
              <select
                value={messageForm.section_label}
                onChange={(e) => setMessageForm({ ...messageForm, section_label: e.target.value })}
                className={inputCls}
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <ModalActions onCancel={() => setOpenMessage(false)} submitLabel="Send message" />
          </form>
        </Modal>
      )}

      {openPoll && (
        <Modal title="Create poll" onClose={() => setOpenPoll(false)}>
          <form onSubmit={handleCreatePoll} className="space-y-3">
            <Field label="Question">
              <input
                value={pollForm.question}
                onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                className={inputCls}
                placeholder="What topic should we revise next?"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Audience">
                <select
                  value={pollForm.audience}
                  onChange={(e) => setPollForm({ ...pollForm, audience: e.target.value })}
                  className={inputCls}
                >
                  <option value="Whole class">Whole class</option>
                  <option value="Section E">Section E</option>
                  <option value="Selected students">Selected students</option>
                </select>
              </Field>
              <Field label="Closes on">
                <input
                  type="date"
                  value={pollForm.closes_at}
                  onChange={(e) => setPollForm({ ...pollForm, closes_at: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Options">
              <div className="space-y-2">
                {pollForm.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => {
                        const opts = [...pollForm.options];
                        opts[i] = e.target.value;
                        setPollForm({ ...pollForm, options: opts });
                      }}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPollForm({
                          ...pollForm,
                          options: pollForm.options.filter((_, index) => index !== i),
                        })
                      }
                      className="text-terracotta hover:text-terracotta/80"
                      aria-label="Remove option"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </Field>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ''] })}
            >
              <FiPlus size={14} /> Add option
            </Button>
            <ModalActions onCancel={() => setOpenPoll(false)} submitLabel="Publish poll" />
          </form>
        </Modal>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-olive focus:outline-none focus:ring-1 focus:ring-olive';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <Button variant="ghost" type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit">{submitLabel}</Button>
    </div>
  );
}
