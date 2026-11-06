import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Button, Badge } from "../components/ui";
import { formatDateLong } from "../lib/utils";

/**
 * Report-parity `/homeworks/:id/submit` — two-tab submission with a rich-text
 * editor. Demo writes stay in the browser store; live wiring uses Storage
 * signed uploads (10 MB + MIME allowlist per spec §8).
 */
export default function HomeworkSubmit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isStudent } = useAuth();
  const data = useData();
  const [tab, setTab] = useState<"text" | "file">("text");
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");

  const homework = data.homework.find((h) => h.id === id);
  const existing = data.submissions.find((s) => s.assignment_id === id && s.student_id === profile?.id);

  if (!homework) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Homework not found.</p>
        <Link to="/homeworks" className="text-sm text-navy underline dark:text-blue-300">
          Back to Homeworks
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!body.trim() && !fileName.trim()) {
      data.notify("Write a response or attach a file before submitting.");
      return;
    }
    data.submitAssignment({
      assignment_id: homework.id,
      student_id: profile.id,
      body: body.trim(),
      file_name: fileName.trim() || undefined,
    });
    navigate("/homeworks");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/homeworks" className="text-xs text-muted hover:text-navy dark:hover:text-blue-300">
        ← Back to Homeworks
      </Link>
      <Card>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="olive">{homework.type === "HOMEWORK" ? "Homework" : "Assignment"}</Badge>
            <Badge>{homework.subject}</Badge>
            {existing && <Badge variant="success">Submitted</Badge>}
          </div>
          <h2 className="text-lg font-bold text-ink dark:text-white">{homework.title}</h2>
          {homework.description && <p className="text-sm text-muted">{homework.description}</p>}
          <p className="text-xs text-muted">Due {formatDateLong(homework.due_date)} · {homework.section_label}</p>
        </div>
      </Card>

      {isStudent() && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("text")}
                className={
                  tab === "text"
                    ? "rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:text-slate-300"
                }
              >
                Text response
              </button>
              <button
                type="button"
                onClick={() => setTab("file")}
                className={
                  tab === "file"
                    ? "rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:text-slate-300"
                }
              >
                File upload
              </button>
            </div>
            {tab === "text" ? (
              <label className="block text-xs font-medium text-muted">
                Your answer (Tiptap editor on live build; plain text in demo)
                <textarea
                  className="mt-1 min-h-40 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your answer here…"
                />
              </label>
            ) : (
              <label className="block text-xs font-medium text-muted">
                File name (demo — no upload; live uses private Storage + signed URLs)
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. homework-answers.pdf"
                />
                <span className="mt-1 block text-[11px] text-muted">
                  PDF/JPEG/PNG/DOCX up to 10 MB on the live build.
                </span>
              </label>
            )}
            <Button type="submit">{existing ? "Update submission" : "Submit now"}</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
