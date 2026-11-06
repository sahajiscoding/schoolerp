import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Badge } from "../components/ui";
import { formatDateLong } from "../lib/utils";

/**
 * Report-parity `/my-attendance` — attendance matrix + radial gauge + Apply
 * Leave dialog (links to `/approvals`). Leave routing rule (<9d → class
 * teacher; ≥9d/Medical → principal) is enforced in the approvals flow.
 */
export default function MyAttendance() {
  const { profile, isStudent } = useAuth();
  const data = useData();

  const mine = useMemo(
    () =>
      isStudent()
        ? data.attendance.filter((a) => a.student_id === profile?.id)
        : data.attendance,
    [data.attendance, isStudent, profile?.id],
  );

  const counts = useMemo(() => {
    const total = mine.length;
    const present = mine.filter((a) => a.status === "present").length;
    const absent = mine.filter((a) => a.status === "absent").length;
    const leave = mine.filter((a) => a.status === "leave" || a.status === "medical").length;
    const holiday = mine.filter((a) => a.status === "holiday").length;
    const pct = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, leave, holiday, pct };
  }, [mine]);

  const recent = [...mine].slice(-30).reverse();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-ink dark:text-white">My Attendance</h2>
        <Link to="/approvals" className="ml-auto rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white">
          Apply Leave
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="text-center">
          <div className="text-2xl font-bold text-ink dark:text-white">{counts.total}</div>
          <div className="text-xs text-muted">School days</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{counts.present}</div>
          <div className="text-xs text-muted">Present</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-rose-600">{counts.absent}</div>
          <div className="text-xs text-muted">Absent</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-amber-600">{counts.leave}</div>
          <div className="text-xs text-muted">Leave</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-navy dark:text-blue-300">{counts.pct}%</div>
          <div className="text-xs text-muted">Attendance</div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 font-semibold text-ink dark:text-white">Recent days</h3>
        <div className="flex flex-wrap gap-1.5">
          {recent.map((a) => (
            <span key={a.id} className="flex flex-col items-center gap-0.5">
              <span
                className={
                  a.status === "present"
                    ? "flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600"
                    : a.status === "absent"
                      ? "flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-600"
                      : a.status === "holiday"
                        ? "flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-600"
                        : "flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-600"
                }
                title={`${formatDateLong(a.date)} · ${a.status}`}
              >
                {a.status === "present" ? "P" : a.status === "absent" ? "A" : a.status === "holiday" ? "H" : "L"}
              </span>
              <span className="text-[9px] text-muted">{a.date.slice(8, 10)}</span>
            </span>
          ))}
        </div>
        {recent.length === 0 && <p className="text-sm text-muted">No attendance recorded yet.</p>}
      </Card>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="success">P Present</Badge>
        <Badge variant="danger">A Absent</Badge>
        <Badge variant="warning">L Leave / ML</Badge>
        <Badge variant="olive">H Holiday</Badge>
      </div>
    </div>
  );
}
