import { useState } from 'react';
import { useAppData as useData } from '../lib/appData';
import { Badge, Button, Card, StatCard, Table, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { Modal } from '../components/modal';
import { FiGrid, FiLayers, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';

export default function Classes() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sections: 'A' });

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      data.notify('Give the class a name, for example “XI”.');
      return;
    }
    if (data.classes.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      data.notify(`${name} already exists.`);
      return;
    }
    const sections = form.sections.split(',').map((section) => section.trim()).filter(Boolean);
    data.addClass({ name, sections });
    setForm({ name: '', sections: 'A' });
    setOpen(false);
  };

  const countStudents = (className: string) => data.people.filter(
    (person) => person.role === 'student' && person.class_label === className,
  ).length;
  const totalSections = data.classes.reduce((sum, item) => sum + item.sections.length, 0);
  const placedStudents = data.people.filter((person) => person.role === 'student' && person.class_label).length;

  return (
    <Page>
      <PageHeader
        eyebrow="Our school community"
        title="Classes & sections"
        description="Organise the class structure and see where students and class teachers are placed."
        actions={<Button onClick={() => setOpen(true)}><FiPlus size={16} aria-hidden="true" /> Add class</Button>}
      />

      <MetricGrid className="lg:grid-cols-3 xl:grid-cols-3">
        <StatCard label="Classes" value={data.classes.length} icon={FiGrid} />
        <StatCard label="Sections" value={totalSections} icon={FiLayers} variant="terracotta" />
        <StatCard label="Students placed" value={placedStudents} icon={FiUsers} variant="neutral" />
      </MetricGrid>

      <Card padded={false}>
        <div className="p-5 pb-2 sm:p-6 sm:pb-2">
          <SectionHeading title="Class structure" description="Class teachers shown here come from the existing roster." />
        </div>
        {data.classes.length ? (
          <Table className="min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead className="hidden md:table-cell">Sections</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="hidden lg:table-cell">Class teacher</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {data.classes.map((item) => {
                const teacher = data.people.find(
                  (person) => person.role === 'teacher' && person.class_teacher_of?.startsWith(`${item.name} `),
                );
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="font-bold">{item.name}</span>
                      <span className="mt-1 block text-xs text-muted md:hidden">Sections {item.sections.join(', ') || '—'} · {teacher?.full_name ?? 'No class teacher'}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">{item.sections.map((section) => <Badge key={section} variant="olive">{section}</Badge>)}</div>
                    </TableCell>
                    <TableCell><span className="inline-flex items-center gap-1.5"><FiUsers size={13} className="text-muted" aria-hidden="true" />{countStudents(item.name)}</span></TableCell>
                    <TableCell className="hidden lg:table-cell">{teacher?.full_name ?? <span className="text-muted">Not assigned</span>}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="danger" size="sm" onClick={() => data.removeClass(item.id)} aria-label={`Remove ${item.name}`}><FiTrash2 size={14} aria-hidden="true" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="p-5 pt-2 sm:p-6 sm:pt-2"><EmptyState title="No classes yet" description="Add the first class to begin placing sections and students." icon={FiGrid} /></div>
        )}
      </Card>

      {open && (
        <Modal title="Add class" description="Create a class and its section labels." onClose={() => setOpen(false)} size="sm">
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label htmlFor="class-name" className="field-label">Class name</label>
              <input id="class-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field-control" placeholder="XI" />
            </div>
            <div>
              <label htmlFor="class-sections" className="field-label">Sections (comma separated)</label>
              <input id="class-sections" value={form.sections} onChange={(event) => setForm({ ...form, sections: event.target.value })} className="field-control" placeholder="A, B, C" />
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Add class</Button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  );
}
