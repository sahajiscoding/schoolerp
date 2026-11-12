import { useState } from 'react';
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
  StatCard,
} from '../components/ui';
import { Modal } from '../components/modal';
import { MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { FiGrid, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';

export default function Classes() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sections: 'A' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      data.notify('Give the class a name, for example “XI”.');
      return;
    }
    if (data.classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      data.notify(`${name} already exists.`);
      return;
    }
    const sections = form.sections
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    data.addClass({ name, sections });
    setForm({ name: '', sections: 'A' });
    setOpen(false);
  };

  const countStudents = (className: string) =>
    data.people.filter((p) => p.role === 'student' && p.class_label === className).length;

  const sectionCount = data.classes.reduce((sum, schoolClass) => sum + schoolClass.sections.length, 0);
  const studentCount = data.people.filter((person) => person.role === 'student').length;

  return (
    <Page>
      <PageHeader
        eyebrow="Administration"
        title="Classes & sections"
        description="Maintain class groups, their sections and current class-teacher coverage."
        meta={`${data.classes.length} classes · ${sectionCount} sections`}
        actions={<Button onClick={() => setOpen(true)}>
          <FiPlus size={16} /> Add class
        </Button>}
      />

      <MetricGrid className="xl:grid-cols-3">
        <StatCard label="Classes" value={data.classes.length} icon={FiGrid} />
        <StatCard label="Sections" value={sectionCount} icon={FiGrid} variant="neutral" />
        <StatCard label="Students placed" value={studentCount} icon={FiUsers} variant="terracotta" />
      </MetricGrid>

      <Card padded={false}>
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <SectionHeading title="Class ledger" description="Sections, student totals and assigned class teachers." />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="hidden lg:table-cell">Class teacher</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {data.classes.map((cls) => {
                const teacher = data.people.find(
                  (p) => p.role === 'teacher' && p.class_teacher_of?.startsWith(`${cls.name} `),
                );
                return (
                  <TableRow key={cls.id}>
                    <TableCell className="font-bold">{cls.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cls.sections.map((section) => (
                          <Badge key={section} variant="olive">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <FiUsers size={13} className="text-muted" />
                        {countStudents(cls.name)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      {teacher?.full_name ?? <span className="text-muted">Not assigned</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => data.removeClass(cls.id)}
                        aria-label={`Remove ${cls.name}`}
                      >
                        <FiTrash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>

      {open && (
        <Modal title="Add class" description="Create a class and its initial section list." onClose={() => setOpen(false)} size="sm">
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label htmlFor="class-name" className="field-label">Class name</label>
                <input
                  id="class-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="field-control"
                  placeholder="XI"
                />
              </div>
              <div>
                <label htmlFor="class-sections" className="field-label">
                  Sections (comma separated)
                </label>
                <input
                  id="class-sections"
                  value={form.sections}
                  onChange={(e) => setForm({ ...form, sections: e.target.value })}
                  className="field-control"
                  placeholder="A, B, C"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add class</Button>
              </div>
            </form>
        </Modal>
      )}
    </Page>
  );
}
