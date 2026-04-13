import type { DocumentPreviewInsertion } from '../types';

const ADDITIONAL_TEXT_TOKENS = ['{{TEXTO_ADICIONAL}}', '{{ADDITIONAL_TEXT}}'] as const;
const CLAUSE_SPLIT_REGEX =
  /(?=(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S(?:E|\u00c9)PTIMA|OCTAVA|NOVENA|D(?:E|\u00c9)CIMA|UND(?:E|\u00c9)CIMA|DUOD(?:E|\u00c9)CIMA|AUT(?:E|\u00c9)NTICA):)/g;
const CLAUSE_LABEL_REGEX =
  /(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S(?:E|\u00c9)PTIMA|OCTAVA|NOVENA|D(?:E|\u00c9)CIMA|UND(?:E|\u00c9)CIMA|DUOD(?:E|\u00c9)CIMA|AUT(?:E|\u00c9)NTICA):/i;

export type TemplateRenderMode = 'preview' | 'export';

function getDocumentRoot() {
  return document.implementation.createHTMLDocument('template-preview');
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function decorateVariableHtml(html: string, mode: TemplateRenderMode) {
  if (mode !== 'preview' || !html.trim()) {
    return html;
  }

  return `<span class="preview-variable-highlight">${html}</span>`;
}

export function buildAdditionalTextHtml(additionalText: string | undefined, mode: TemplateRenderMode) {
  const trimmed = additionalText?.trim();
  if (!trimmed) {
    return '';
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const content = paragraphs
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 14px;">${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`,
    )
    .join('');

  const heading =
    mode === 'preview'
      ? '<p class="preview-manual-heading">Texto adicional</p>'
      : '<p style="margin: 0 0 12px; font-weight: bold; font-size: 10pt; letter-spacing: 0.08em; text-transform: uppercase;">Texto adicional</p>';

  const className = mode === 'preview' ? 'preview-manual-block' : '';
  const style = mode === 'preview' ? '' : ' style="margin-top: 32px; page-break-inside: avoid;"';

  return `
    <div data-additional-text="true" class="${className}"${style}>
      ${heading}
      ${content}
    </div>
  `;
}

export function injectAdditionalText(compiledHtml: string, additionalTextHtml: string) {
  if (!additionalTextHtml) {
    return compiledHtml;
  }

  const hasPlaceholder = ADDITIONAL_TEXT_TOKENS.some((token) => compiledHtml.includes(token));
  if (hasPlaceholder) {
    return ADDITIONAL_TEXT_TOKENS.reduce(
      (result, token) => result.replaceAll(token, additionalTextHtml),
      compiledHtml,
    );
  }

  if (compiledHtml.includes('{{FIRMAS}}')) {
    return compiledHtml.replace('{{FIRMAS}}', `${additionalTextHtml}{{FIRMAS}}`);
  }

  if (compiledHtml.includes('{{AUTENTICA}}')) {
    return compiledHtml.replace('{{AUTENTICA}}', `${additionalTextHtml}{{AUTENTICA}}`);
  }

  return `${compiledHtml}${additionalTextHtml}`;
}

function cloneWithHtml(source: HTMLElement, innerHtml: string) {
  const next = source.cloneNode(false) as HTMLElement;
  next.innerHTML = innerHtml.trim();
  return next;
}

function splitCompoundParagraphs(root: HTMLElement) {
  const paragraphs = Array.from(root.querySelectorAll('p'));

  paragraphs.forEach((paragraph) => {
    if (!CLAUSE_LABEL_REGEX.test(paragraph.textContent ?? '')) {
      return;
    }

    const parts = paragraph.innerHTML
      .split(CLAUSE_SPLIT_REGEX)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      return;
    }

    const fragment = paragraph.ownerDocument.createDocumentFragment();
    parts.forEach((part) => {
      fragment.appendChild(cloneWithHtml(paragraph, part));
    });

    paragraph.replaceWith(fragment);
  });
}

function buildInsertionMap(insertions: DocumentPreviewInsertion[] | undefined) {
  return new Map(
    (insertions ?? []).map((item) => [
      item.anchorId,
      {
        preserveEmpty: Boolean(item.preserveEmpty),
        text: item.text ?? '',
      },
    ]),
  );
}

function normalizeBlockText(block: HTMLElement) {
  const cloned = block.cloneNode(true) as HTMLElement;
  cloned.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
  return (cloned.textContent ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function applyPreviewOverride(block: HTMLElement, anchorId: string, text?: string) {
  const originalText = normalizeBlockText(block);

  block.setAttribute('contenteditable', 'true');
  block.setAttribute('data-editable-block', 'true');
  block.setAttribute('data-insertion-anchor', anchorId);
  block.setAttribute('data-original-text', originalText);
  block.setAttribute('spellcheck', 'false');
  block.setAttribute('tabindex', '0');
  block.classList.add('preview-editable-block');

  if (text !== undefined) {
    block.innerHTML = escapeHtml(text).replace(/\n/g, '<br />');
  }
}

function shouldCreateAnchor(block: HTMLElement) {
  return Boolean((block.textContent ?? '').trim());
}

function createExportOverrideBlock(block: HTMLElement, text: string) {
  const next = block.cloneNode(false) as HTMLElement;
  next.removeAttribute('contenteditable');
  next.removeAttribute('data-editable-block');
  next.removeAttribute('data-insertion-anchor');
  next.removeAttribute('data-original-text');
  next.removeAttribute('spellcheck');
  next.removeAttribute('tabindex');
  next.classList.remove('preview-editable-block');

  if (!next.className.trim()) {
    next.removeAttribute('class');
  }

  next.innerHTML = text ? escapeHtml(text).replace(/\n/g, '<br />') : '';
  return next;
}

export function injectPreviewInsertions(
  compiledHtml: string,
  insertions: DocumentPreviewInsertion[] | undefined,
  mode: TemplateRenderMode,
) {
  if (mode === 'export' && !(insertions ?? []).length) {
    return compiledHtml;
  }

  const doc = getDocumentRoot();
  const root = doc.createElement('div');
  root.innerHTML = compiledHtml;

  splitCompoundParagraphs(root);

  const blocks = Array.from(root.querySelectorAll('p, h1, h2, h3, h4, h5, h6')).filter((node) =>
    shouldCreateAnchor(node as HTMLElement),
  ) as HTMLElement[];
  const insertionMap = buildInsertionMap(insertions);

  blocks.forEach((block, index) => {
    const anchorId = `slot-${index + 1}`;
    const override = insertionMap.get(anchorId);

    if (mode === 'preview') {
      applyPreviewOverride(block, anchorId, override ? override.text : undefined);
      return;
    }

    if (!override) {
      return;
    }

    block.replaceWith(createExportOverrideBlock(block, override.preserveEmpty ? override.text : override.text.trim()));
  });

  return root.innerHTML;
}
