import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractType } from '../../../types';
import { createTemplateDetail } from '../../../test/fixtures';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  supabase: {
    from: vi.fn((...args: unknown[]) => mocks.from(...args)),
  },
}));

vi.mock('../../../lib/supabase/client', () => ({
  supabase: mocks.supabase,
}));

import { templateService } from './templateService';

describe('templateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a template and its initial version', async () => {
    let versionInsertSeen = false;

    mocks.from.mockImplementation((table: string) => {
      if (table === 'document_templates') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'tpl-created' },
                error: null,
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }

      if (table === 'document_template_versions') {
        versionInsertSeen = true;

        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'ver-created' },
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const id = await templateService.createTemplate('org-1', 'user-1', ContractType.COUNTER_GUARANTEE_PRIVATE);

    expect(id).toBe('tpl-created');
    expect(versionInsertSeen).toBe(true);
  });

  it('publishes the current draft version', async () => {
    const detail = createTemplateDetail();
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    const getTemplateSpy = vi.spyOn(templateService, 'getTemplate').mockResolvedValue(detail);

    mocks.from.mockImplementation((table: string) => {
      if (table === 'document_template_versions') {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }

      if (table === 'document_templates') {
        return {
          update,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await templateService.publishTemplate('org-1', 'user-1', 'tpl-1', 'Ready for launch');

    expect(getTemplateSpy).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });
});
