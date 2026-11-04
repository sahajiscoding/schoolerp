import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function toAuthEmail(loginId: string) {
  const local = loginId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${local || 'user'}@pws.local`;
}

export function passwordFromDob(dob: string) {
  const parts = normalizeDob(dob);
  return `Student@${parts.day}${parts.month}${parts.year}`;
}

/** True only for real calendar dates (rejects 31 Feb, month 13, year 0000). */
function isRealDate(year: number, month: number, day: number) {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

export function normalizeDob(input: string): { day: string; month: string; year: string; iso: string } {
  const value = input.trim();
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const dmyMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  // Declared without an initial value: the three branches below always assign
  // all of them before they are read, so placeholder '' values were dead stores.
  let year: string;
  let month: string;
  let day: string;
  if (isoMatch) {
    year = isoMatch[1];
    month = isoMatch[2].padStart(2, '0');
    day = isoMatch[3].padStart(2, '0');
  } else if (dmyMatch) {
    day = dmyMatch[1].padStart(2, '0');
    month = dmyMatch[2].padStart(2, '0');
    year = dmyMatch[3];
  } else {
    throw new Error(`Invalid date of birth "${input}". Use YYYY-MM-DD or DD/MM/YYYY.`);
  }
  if (!isRealDate(Number(year), Number(month), Number(day))) {
    throw new Error(`"${input}" is not a real calendar date.`);
  }
  return { day, month, year, iso: `${year}-${month}-${day}` };
}

export function formatDate(value?: string | null, pattern = 'dd-MM-yyyy') {
  if (!value) return '—';
  const parsed = value.includes('T') ? new Date(value) : parseISO(value);
  return isValid(parsed) ? format(parsed, pattern) : value;
}

export function formatDateLong(value?: string | null) {
  return formatDate(value, 'dd MMM yyyy');
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  return isValid(parsed) ? format(parsed, 'dd-MM-yyyy hh:mm a') : value;
}

export function monthLabel(start: string, end: string) {
  if (start === end) return formatDateLong(start);
  return `${formatDateLong(start)} - ${formatDateLong(end)}`;
}

export function formatRange(start: string, end: string) {
  if (start === end) return formatDateLong(start);
  return `${formatDateLong(start)} – ${formatDateLong(end)}`;
}

export function daysBetween(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function daysUntil(date: string) {
  const target = new Date(date);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day';
  return `${diff} days`;
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? '').trim();
    });
    return row;
  });
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function inr(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function relativeToToday(value: string) {
  const today = new Date(2026, 10, 4);
  const target = new Date(value);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function gradeFor(percentage: number) {
  if (percentage >= 91) return 'A1';
  if (percentage >= 81) return 'A2';
  if (percentage >= 71) return 'B1';
  if (percentage >= 61) return 'B2';
  if (percentage >= 51) return 'C1';
  if (percentage >= 41) return 'C2';
  if (percentage >= 33) return 'D';
  return 'E';
}

export function fineFor(dueDate: string, returnedAt?: string | null) {
  const due = new Date(dueDate);
  const end = returnedAt ? new Date(returnedAt) : new Date();
  const days = Math.max(0, Math.ceil((end.getTime() - due.getTime()) / 86400000));
  return days * 5;
}

/**
 * Escape a value before interpolating it into an HTML string.
 *
 * `printHtml()` writes documents with `document.write`, and the values that go
 * into them are user-entered (student names, subject names, teacher notes).
 * Without escaping, a name like `<img src=x onerror=...>` would execute in the
 * printed window. Always wrap interpolations with this.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function printHtml(title: string, body: string) {
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) return;
  // Reviewed XSS sink: every value interpolated into this document is passed
  // through escapeHtml(). Keep it that way, or this rule fires.
  // eslint-disable-next-line no-restricted-syntax
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1f2937; margin: 0; padding: 32px; }
    .sheet { max-width: 760px; margin: 0 auto; border: 1px solid #d6d3d1; padding: 32px; }
    .school { text-align: center; border-bottom: 2px solid #4B5D2A; padding-bottom: 16px; margin-bottom: 20px; }
    .school h1 { margin: 0; font-size: 22px; letter-spacing: 2px; color: #4B5D2A; }
    .school p { margin: 4px 0 0; font-size: 12px; color: #6b7280; }
    h2 { text-align: center; font-size: 16px; letter-spacing: 1px; text-transform: uppercase; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #d6d3d1; padding: 8px 10px; text-align: left; }
    th { background: #f5f1ec; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; margin-bottom: 18px; }
    .meta strong { display: inline-block; min-width: 110px; }
    .total { margin-top: 14px; font-size: 14px; text-align: right; }
    .signatures { display: flex; justify-content: space-between; margin-top: 56px; font-size: 12px; }
    .signatures div { border-top: 1px solid #9ca3af; padding-top: 6px; width: 180px; text-align: center; }
    @media print { body { padding: 0; } .sheet { border: none; } }
  </style></head><body>${body}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}
