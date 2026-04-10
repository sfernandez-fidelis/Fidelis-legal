import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DocumentEditor } from './DocumentEditor';
import { ContractType } from '../../../types';

vi.mock('../../../components/forms/PartyForm', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../../../components/forms/PolicyForm', () => ({
  default: () => <div>Policy form</div>,
}));

vi.mock('../../../components/LivePreview', () => ({
  default: () => <div>Vista previa</div>,
}));

vi.mock('../../auth/hooks/usePermissions', () => ({
  usePermissions: () => ({
    role: 'viewer',
    isViewer: true,
    isEditor: false,
    isAdmin: false,
    canEditContent: false,
    canManageOrganization: false,
    canViewAuditLog: false,
  }),
}));

describe('DocumentEditor', () => {
  it('allows changing steps even when content editing is disabled', async () => {
    const user = userEvent.setup();

    render(
      <DocumentEditor
        contacts={[]}
        initialType={ContractType.COUNTER_GUARANTEE_PRIVATE}
        mode="create"
        onChange={() => {}}
        saveIndicator="saved"
      />,
    );

    await user.click(screen.getByRole('button', { name: /Partes/i }));

    expect(screen.getByText('Parte principal')).toBeInTheDocument();
  });
});
