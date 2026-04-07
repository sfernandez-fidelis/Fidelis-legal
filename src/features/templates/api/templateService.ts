import { supabase } from '../../../lib/supabase/client';
import type { TemplateData, TemplateDetailData, TemplateVersionData } from '../../../types';
import { ContractType } from '../../../types';
import { getDefaultTemplate } from './defaultTemplates';
import { getTemplateTypeLabel } from '../templateLabels';

function normalizeTemplateVersion(row: any, template: any): TemplateVersionData {
  return {
    id: row.id,
    templateId: row.template_id,
    organizationId: row.organization_id,
    versionNumber: row.version_number,
    content: row.content,
    changeNote: row.change_note ?? null,
    sourceVersionId: row.source_version_id ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    isPublished: template?.published_version_id === row.id,
    isDraft: template?.draft_version_id === row.id,
  };
}

function normalizeTemplate(row: any, usedByDocuments: number, versions: TemplateVersionData[] = []): TemplateData {
  const publishedVersion = versions.find((item) => item.id === row.published_version_id) ?? null;
  const draftVersion = versions.find((item) => item.id === row.draft_version_id) ?? null;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    type: row.contract_type,
    content: draftVersion?.content ?? publishedVersion?.content ?? row.content ?? getDefaultTemplate(row.contract_type),
    organizationId: row.organization_id,
    status: row.status,
    isPublished: Boolean(row.published_version_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? null,
    publishedVersionId: row.published_version_id ?? null,
    draftVersionId: row.draft_version_id ?? null,
    latestVersionNumber: versions[0]?.versionNumber ?? row.version ?? 1,
    usedByDocuments,
    hasUnpublishedChanges:
      Boolean(row.draft_version_id) &&
      (!row.published_version_id || row.draft_version_id !== row.published_version_id || row.status === 'draft'),
    publishedContent: publishedVersion?.content ?? row.content ?? null,
    draftContent: draftVersion?.content ?? null,
  };
}

async function loadUsageCounts(organizationId: string) {
  const { data, error } = await supabase.from('documents').select('template_id').eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce<Record<string, number>>((acc, item) => {
    if (item.template_id) {
      acc[item.template_id] = (acc[item.template_id] ?? 0) + 1;
    }
    return acc;
  }, {});
}

export const templateService = {
  async listTemplates(organizationId: string): Promise<TemplateData[]> {
    const [{ data: templates, error: templateError }, usageByTemplate] = await Promise.all([
      supabase
        .from('document_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false }),
      loadUsageCounts(organizationId),
    ]);

    if (templateError) {
      throw templateError;
    }

    const templateIds = (templates ?? []).map((item) => item.id);
    const { data: versionRows, error: versionError } = templateIds.length
      ? await supabase
          .from('document_template_versions')
          .select('*')
          .eq('organization_id', organizationId)
          .in('template_id', templateIds)
          .order('version_number', { ascending: false })
      : { data: [], error: null };

    if (versionError) {
      throw versionError;
    }

    const versionsByTemplate = new Map<string, TemplateVersionData[]>();
    for (const row of versionRows ?? []) {
      const template = (templates ?? []).find((item) => item.id === row.template_id);
      const normalized = normalizeTemplateVersion(row, template);
      const current = versionsByTemplate.get(row.template_id) ?? [];
      versionsByTemplate.set(row.template_id, [...current, normalized]);
    }

    return (templates ?? []).map((item) =>
      normalizeTemplate(item, usageByTemplate[item.id] ?? 0, versionsByTemplate.get(item.id) ?? []),
    );
  },

  async getTemplate(organizationId: string, id: string): Promise<TemplateDetailData> {
    const [{ data: template, error: templateError }, usageByTemplate] = await Promise.all([
      supabase
        .from('document_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', id)
        .single(),
      loadUsageCounts(organizationId),
    ]);

    if (templateError) {
      throw templateError;
    }

    const { data: versions, error: versionError } = await supabase
      .from('document_template_versions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('template_id', id)
      .order('version_number', { ascending: false });

    if (versionError) {
      throw versionError;
    }

    const normalizedVersions = (versions ?? []).map((row) => normalizeTemplateVersion(row, template));
    const normalizedTemplate = normalizeTemplate(template, usageByTemplate[id] ?? 0, normalizedVersions);

    return {
      ...normalizedTemplate,
      versions: normalizedVersions,
      publishedVersion: normalizedVersions.find((item) => item.id === template.published_version_id) ?? null,
      draftVersion: normalizedVersions.find((item) => item.id === template.draft_version_id) ?? null,
    };
  },

  async listPublishedTemplates(organizationId: string): Promise<TemplateData[]> {
    const templates = await this.listTemplates(organizationId);
    return templates.filter((item) => item.isPublished && item.status !== 'archived');
  },

  async createTemplate(organizationId: string, userId: string, type: ContractType) {
    const now = new Date().toISOString();
    const name = getTemplateTypeLabel(type);

    const { data: createdTemplate, error: templateError } = await supabase
      .from('document_templates')
      .insert({
        organization_id: organizationId,
        contract_type: type,
        name,
        content: '',
        status: 'draft',
        is_published: false,
        created_by: userId,
        updated_by: userId,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (templateError) {
      throw templateError;
    }

    const defaultContent = getDefaultTemplate(type);
    const { data: createdVersion, error: versionError } = await supabase
      .from('document_template_versions')
      .insert({
        template_id: createdTemplate.id,
        organization_id: organizationId,
        version_number: 1,
        content: defaultContent,
        change_note: 'Initial draft from system default',
        created_by: userId,
        created_at: now,
      })
      .select('id')
      .single();

    if (versionError) {
      throw versionError;
    }

    const { error: updateError } = await supabase
      .from('document_templates')
      .update({
        content: '',
        version: 1,
        draft_version_id: createdVersion.id,
        updated_by: userId,
        updated_at: now,
      })
      .eq('id', createdTemplate.id);

    if (updateError) {
      throw updateError;
    }

    return createdTemplate.id;
  },

  async saveDraft(
    organizationId: string,
    userId: string,
    templateId: string,
    content: string,
    changeNote?: string,
  ) {
    const detail = await this.getTemplate(organizationId, templateId);
    const now = new Date().toISOString();
    const nextVersionNumber = (detail.versions[0]?.versionNumber ?? 0) + 1;

    if ((detail.draftVersion?.content ?? '').trim() === content.trim()) {
      const { error } = await supabase
        .from('document_templates')
        .update({
          status: detail.publishedVersion ? 'draft' : detail.status,
          updated_by: userId,
          updated_at: now,
        })
        .eq('id', templateId)
        .eq('organization_id', organizationId);

      if (error) {
        throw error;
      }

      return detail.draftVersion?.id ?? detail.publishedVersion?.id ?? null;
    }

    const { data: version, error: versionError } = await supabase
      .from('document_template_versions')
      .insert({
        template_id: templateId,
        organization_id: organizationId,
        version_number: nextVersionNumber,
        content,
        change_note: changeNote?.trim() || 'Draft updated',
        source_version_id: detail.draftVersion?.id ?? detail.publishedVersion?.id ?? null,
        created_by: userId,
        created_at: now,
      })
      .select('id')
      .single();

    if (versionError) {
      throw versionError;
    }

    const { error: updateError } = await supabase
      .from('document_templates')
      .update({
        version: nextVersionNumber,
        draft_version_id: version.id,
        status: detail.publishedVersion ? 'draft' : detail.status,
        updated_by: userId,
        updated_at: now,
      })
      .eq('id', templateId)
      .eq('organization_id', organizationId);

    if (updateError) {
      throw updateError;
    }

    return version.id;
  },

  async publishTemplate(
    organizationId: string,
    userId: string,
    templateId: string,
    changeNote: string,
  ) {
    const detail = await this.getTemplate(organizationId, templateId);

    if (!detail.draftVersion) {
      throw new Error('A draft version is required before publishing.');
    }

    const now = new Date().toISOString();
    const note = changeNote.trim();

    if (note && detail.draftVersion.changeNote !== note) {
      const { error: noteError } = await supabase
        .from('document_template_versions')
        .update({
          change_note: note,
        })
        .eq('id', detail.draftVersion.id)
        .eq('organization_id', organizationId);

      if (noteError) {
        throw noteError;
      }
    }

    const { error } = await supabase
      .from('document_templates')
      .update({
        content: detail.draftVersion.content,
        is_published: true,
        status: 'published',
        published_at: now,
        published_version_id: detail.draftVersion.id,
        updated_by: userId,
        updated_at: now,
      })
      .eq('id', templateId)
      .eq('organization_id', organizationId);

    if (error) {
      throw error;
    }
  },

  async rollbackTemplate(
    organizationId: string,
    userId: string,
    templateId: string,
    versionId: string,
    changeNote?: string,
  ) {
    const detail = await this.getTemplate(organizationId, templateId);
    const target = detail.versions.find((item) => item.id === versionId);

    if (!target) {
      throw new Error('Version not found.');
    }

    const now = new Date().toISOString();
    const nextVersionNumber = (detail.versions[0]?.versionNumber ?? 0) + 1;
    const { data: rollbackVersion, error: versionError } = await supabase
      .from('document_template_versions')
      .insert({
        template_id: templateId,
        organization_id: organizationId,
        version_number: nextVersionNumber,
        content: target.content,
        change_note: changeNote?.trim() || `Rollback to v${target.versionNumber}`,
        source_version_id: target.id,
        created_by: userId,
        created_at: now,
      })
      .select('id')
      .single();

    if (versionError) {
      throw versionError;
    }

    const { error: updateError } = await supabase
      .from('document_templates')
      .update({
        version: nextVersionNumber,
        draft_version_id: rollbackVersion.id,
        status: detail.publishedVersion ? 'draft' : detail.status,
        updated_by: userId,
        updated_at: now,
      })
      .eq('id', templateId)
      .eq('organization_id', organizationId);

    if (updateError) {
      throw updateError;
    }
  },

  async archiveTemplate(organizationId: string, userId: string, templateId: string) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('document_templates')
      .update({
        status: 'archived',
        archived_at: now,
        updated_by: userId,
        updated_at: now,
      })
      .eq('id', templateId)
      .eq('organization_id', organizationId);

    if (error) {
      throw error;
    }
  },
};
