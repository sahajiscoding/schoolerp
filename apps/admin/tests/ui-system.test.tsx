import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '../src/components/ui';
import { EmptyState, PageHeader } from '../src/components/page';
import { Modal } from '../src/components/modal';
import AppShell from '../src/components/AppShell';

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'admin-1', role: 'admin', full_name: 'School Admin', login_id: 'admin' },
    viewAsRole: () => undefined,
    viewingRole: null,
    demoMode: true,
    configError: null,
    signOut: vi.fn(),
  }),
}));

vi.mock('../src/lib/appData', () => ({
  useAppData: () => ({
    leaves: [],
    people: [],
    notifications: [],
    resetDemoData: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  }),
}));

afterEach(cleanup);

it('renders the shared page hierarchy and actionable empty state', () => {
  render(
    <>
      <PageHeader eyebrow="Administration" title="People" description="School community" />
      <EmptyState title="No people found" action={<Button>Add person</Button>} />
    </>,
  );
  expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Add person' })).toBeTruthy();
});

it('labels the shared modal and closes it with Escape', async () => {
  const onClose = vi.fn();
  render(
    <Modal title="Add person" description="Create a school profile" onClose={onClose}>
      Form
    </Modal>,
  );
  expect(screen.getByRole('dialog', { name: 'Add person' }).getAttribute('aria-modal')).toBe('true');
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledOnce();
});

it('gives the mobile navigation trigger an accessible name', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AppShell>Dashboard content</AppShell>
    </MemoryRouter>,
  );
  expect(screen.getByRole('button', { name: 'Open navigation' })).toBeTruthy();
});
