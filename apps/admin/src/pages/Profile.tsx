import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Button, Badge } from "../components/ui";
import { cn } from "../lib/utils";

/** Report-parity `/profile` — 7-tab student master dossier + change password. */
const TABS = ["Overview", "Personal", "Academic", "Attendance", "Fees", "Library", "Security"] as const;

export default function Profile() {
  const { profile, signOut } = useAuth();
  const data = useData();
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [newPassword, setNewPassword] = useState("");

  const me = data.people.find((p) => p.id === profile?.id);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ink dark:text-white">Profile</h2>

      <Card className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
          {(profile?.full_name ?? "U").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-ink dark:text-white">{profile?.full_name ?? "User"}</div>
          <div className="text-xs text-muted">
            {profile?.login_id ?? ""} · {profile?.role ?? ""}
          </div>
        </div>
        {profile?.must_change_password && (
          <Badge variant="warning" className="ml-auto">
            Password change required
          </Badge>
        )}
      </Card>

      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              tab === t
                ? "border-navy bg-navy text-white"
                : "border-slate-300 bg-white text-slate-600 hover:border-navy dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Card>
        {tab === "Overview" && (
          <div className="text-sm text-muted">Login ID {profile?.login_id} · Active account · Academic year 2026-27.</div>
        )}
        {tab === "Personal" && (
          <div className="text-sm text-muted">{me?.full_name} · {me?.email} · {me?.phone ?? "—"}</div>
        )}
        {tab === "Academic" && (
          <div className="text-sm text-muted">
            {me?.class_label && me?.section_label
              ? `${me.class_label} - ${me.section_label}`
              : "No class assigned yet."}
          </div>
        )}
        {tab === "Attendance" && (
          <div className="text-sm text-muted">
            {data.attendance.filter((a) => a.student_id === profile?.id).length} days recorded.
          </div>
        )}
        {tab === "Fees" && (
          <div className="text-sm text-muted">
            {data.fees.filter((f) => f.student_id === profile?.id).length} invoices on file.
          </div>
        )}
        {tab === "Library" && (
          <div className="text-sm text-muted">
            {data.bookIssues.filter((i) => i.student_id === profile?.id && i.status !== "returned").length} active
            loan(s).
          </div>
        )}
        {tab === "Security" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newPassword.trim().length < 8) {
                data.notify("Password must be at least 8 characters.");
                return;
              }
              data.notify("Password update is queued on the live build (demo keeps it browser-only).");
              setNewPassword("");
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="text-xs font-medium text-muted">
              New password
              <input
                type="password"
                autoComplete="new-password"
                className="mt-1 block w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <Button type="submit">Change password</Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
            >
              Sign out
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
