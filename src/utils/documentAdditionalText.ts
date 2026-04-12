import type { DocumentPreviewInsertion } from '../types';

const ADDITIONAL_TEXT_TOKENS = ['{{TEXTO_ADICIONAL}}', '{{ADDITIONAL_TEXT}}'] as const;
const CLAUSE_SPLIT_REGEX =
  /(?=(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA|UND[ÉE]CIMA|DUOD[ÉE]CIMA|AUT[ÉE]NTICA):)/g;
const CLAUSE_LABEL_REGEX =
  /(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA|UND[ÉE]CIMA|DUOD[ÉE]CIMA|AUT[ÉE]NTICA):/i;

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
  return new Map((insertions ?? []).map((item) => [item.anchorId, item.text]));
}

function createPreviewSlot(doc: Document, anchorId: string, text: string) {
  const slot = doc.createElement('div');
  slot.setAttribute('contenteditable', 'true');
  slot.setAttribute('data-insertion-anchor', anchorId);
  slot.setAttribute('data-placeholder', 'Escriba aquí...');
  slot.className = 'preview-inline-slot';
  slot.innerHTML = text ? escapeHtml(text).replace(/\n/g, '<br />') : '';
  return slot;
}

function createExportInsertionNodes(doc: Document, text: string) {
  const fragment = doc.createDocumentFragment();
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  paragraphs.forEach((paragraph) => {
    const node = doc.createElement('p');
    node.textContent = paragraph;
    fragment.appendChild(node);
  });

  return fragment;
}

function shouldCreateAnchor(block: HTMLElement) {
  const text = (block.textContent ?? '').trim();
  if (!text) {
    return false;
  }

  if (text.length >= 60) {
    return true;
  }

  return CLAUSE_LABEL_REGEX.test(text);
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
    const text = insertionMap.get(anchorId)?.trim() ?? '';

    if (mode === 'preview') {
      block.insertAdjacentElement('afterend', createPreviewSlot(doc, anchorId, text));
      return;
    }

    if (!text) {
      return;
    }

    block.after(createExportInsertionNodes(doc, text));
  });

  return root.innerHTML;
}
