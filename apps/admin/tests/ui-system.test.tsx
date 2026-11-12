import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/components/ui';
import { EmptyState, PageHeader } from '../src/components/page';
import { Modal } from '../src/components/modal';

afterEach(cleanup);

it('renders the community page hierarchy and actionable empty state', () => {
  render(
    <>
      <PageHeader
        eyebrow="Our school community"
        title="People"
        description="One connected campus"
      />
      <EmptyState title="No people found" action={<Button>Welcome someone</Button>} />
    </>,
  );

  expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Welcome someone' })).toBeTruthy();
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
