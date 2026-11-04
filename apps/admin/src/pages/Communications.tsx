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
import { FiSend, FiAlertCircle, FiCheckCircle, FiPlus, FiUsers } from 'react-icons/fi';

export default function Communications() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [openDeclaration, setOpenDeclaration] = useState(false);
  const [openPoll, setOpenPoll] = useState(false);
  const [pollForm, setPollForm] = useState({
    question: '',
    audience: 'Whole class',
    closes_at: '',
    options: ['Option A', 'Option B'],
  });

  const students = data.people.filter((p) => p.role === 'student');
  const canCreatePoll = isAdmin() || isTeacher();

  const handleSign = (id: string) => {
    data.signDeclaration(id);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.createPoll({
      question: pollForm.question,
      audience: pollForm.audience,
      created_by: profile.id,
      closes_at: pollForm.closes_at,
      options: pollForm.options.filter(Boolean),
    });
    setPollForm({ question: '', audience: 'Whole class', closes_at: '', options: ['Option A', 'Option B'] });
    setOpenPoll(false);
  };

  const handleVote = (pollId: string, optionId: string) => {
    if (!profile) return;
    data.votePoll(pollId, optionId, profile.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Communications</h1>
          <p className="text-muted">
            Declaration forms, messages, and polls. Teachers can create polls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Declaration forms */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-ink">Declaration forms</h3>
            {isStudent() && (
              <Badge variant="olive" className="text-[10px]">
                Sign pending forms
              </Badge>
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
                {data.declarations.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>{form.name}</TableCell>
                    <TableCell>{form.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={form.status === 'signed' ? 'success' : 'pending'}
                      >
                        {form.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {form.status === 'pending' && isStudent() ? (
                        <Button variant="outline" size="sm" onClick={() => handleSign(form.id)}>
                          <FiCheckCircle size={14} /> Sign
                        </Button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {data.declarations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted py-4">
                      No declaration forms.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        {/* Polls */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-ink">Polls</h3>
            {canCreatePoll && (
              <Button onClick={() => setOpenPoll(true)}>
                <FiPlus size={16} /> Create poll
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
                <div key={poll.id} className="border border-sand/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-ink">{poll.question}</div>
                    <Badge variant="olive" className="text-[10px]">
                      {poll.audience}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted mb-3">
                    Closes {new Date(poll.closes_at).toLocaleDateString()}
                  </div>
                  {poll.options.map((opt) => {
                    const voted = hasVoted === opt.id;
                    const pct = totalVotes > 0 ? Math.round((optionVotes(opt.id) / totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{opt.label}</span>
                          <span className="text-muted">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={cn('h-2 rounded-full transition-all duration-300', voted ? 'bg-olive' : 'bg-slate-200')}
                            style={{ width: voted ? pct : 0 }}
                          />
                        </div>
                        {!hasVoted && isStudent() && (
                          <Button
                            key={`vote-${opt.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(poll.id, opt.id)}
                            className="mt-2 w-full text-[10px] border-slate-200"
                          >
                            Vote
                          </Button>
                                                    )}
                        {hasVoted && (
                          <span key={`voted-${opt.id}`} className="text-xs text-slate-400 mt-1 block">
                            Voted
                          </span>
                                                    )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {data.polls.length === 0 && (
              <div className="text-center text-muted py-6">
                No polls yet. {canCreatePoll && 'Create one to get started.'}
              </div>
            )}
          </div>
        </Card>

        {canCreatePoll && openPoll && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 lg:hidden">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
              <h2 className="text-lg font-bold text-ink mb-4">Create poll</h2>
              <form onSubmit={handleCreatePoll} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Question</label>
                  <input
                    value={pollForm.question}
                    onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="What topic should we revise next?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Audience</label>
                  <select
                    value={pollForm.audience}
                    onChange={(e) => setPollForm({ ...pollForm, audience: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Whole class">Whole class</option>
                    <option value="Section E">Section E</option>
                    <option value="Selected students">Selected students</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Closes at</label>
                  <input
                    type="datetime-local"
                    value={pollForm.closes_at}
                    onChange={(e) => setPollForm({ ...pollForm, closes_at: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Options</label>
                  {pollForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={opt}
                        onChange={(e) => {
                          const opts = [...pollForm.options];
                          opts[i] = e.target.value;
                          setPollForm({ ...pollForm, options: opts });
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const opts = [...pollForm.options];
                          opts.splice(i, 1);
                          setPollForm({ ...pollForm, options: opts });
                        }}
                        className="text-terracotta hover:text-terracotta/80"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" type="button" onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ''] })}>
                    <FiPlus size={14} /> Add option
                  </Button>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" type="button" onClick={() => setOpenPoll(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Publish poll</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
