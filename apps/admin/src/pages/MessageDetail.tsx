import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, Button } from "../components/ui";
import { useMessagesData } from "../lib/useMessagesData";

/** Report-parity `/messages/:id` — thread detail + reply. */
export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const data = useMessagesData();
  const [reply, setReply] = useState("");
  const thread = data.threads.find((t) => t.id === id);

  if (!thread) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Message not found.</p>
        <Link to="/messages" className="text-sm text-navy underline dark:text-blue-300">
          Back to messages
        </Link>
      </div>
    );
  }

  const nameOf = (pid: string) => data.people.find((p) => p.id === pid)?.full_name ?? "User";

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reply.trim()) {
      data.notify("Write a reply first.");
      return;
    }
    data.sendMessage(thread.id, profile.id, reply.trim());
    setReply("");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/messages" className="text-xs text-muted hover:text-navy dark:hover:text-blue-300">
        ← Back to messages
      </Link>
      <h2 className="text-xl font-bold text-ink dark:text-white">{thread.subject}</h2>
      <Card className="space-y-3">
        {thread.messages.map((m) => (
          <div
            key={m.id}
            className={
              m.sender_id === profile?.id
                ? "ml-auto max-w-[80%] rounded-xl bg-navy px-3 py-2 text-sm text-white"
                : "max-w-[80%] rounded-xl bg-slate-100 px-3 py-2 text-sm text-ink dark:bg-slate-700 dark:text-white"
            }
          >
            <div className="text-[11px] font-medium opacity-70">{nameOf(m.sender_id)}</div>
            <div>{m.body}</div>
          </div>
        ))}
      </Card>
      <Card>
        <form onSubmit={handleReply} className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
          />
          <Button type="submit">Reply</Button>
        </form>
      </Card>
    </div>
  );
}
