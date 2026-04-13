import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LivePreview from './LivePreview';
import { createDocument } from '../test/fixtures';

describe('LivePreview', () => {
  it('allows expanding the preview and editing inline insertions', async () => {
    const user = userEvent.setup();
    const onPreviewInsertionsChange = vi.fn();
    const document = createDocument();
    const { container } = render(
      <LivePreview
        canEditPreviewInsertions
        data={document}
        onPreviewInsertionsChange={onPreviewInsertionsChange}
        templateContent="<p>PRIMERA: Documento base</p>"
        type={document.type}
      />,
    );

    const slot = container.querySelector<HTMLElement>('[data-insertion-anchor="slot-1"]');
    expect(slot).not.toBeNull();
    expect(slot).toHaveTextContent('PRIMERA: Documento base');
    expect(slot).toHaveAttribute('contenteditable', 'true');

    slot!.innerHTML = 'PRIMERA: Nota breve';
    fireEvent.blur(slot!);
    await user.click(screen.getByRole('button', { name: /expandir/i }));

    expect(onPreviewInsertionsChange).toHaveBeenCalledWith([{ anchorId: 'slot-1', text: 'PRIMERA: Nota breve' }]);
    expect(screen.getByRole('dialog', { name: /vista previa expandida/i })).toBeInTheDocument();
  });
});
