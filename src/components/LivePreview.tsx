import { Expand, Minimize2, PencilLine, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { DocumentPreviewInsertion, CounterGuaranteeData, ContractType } from '../types';
import { compileTemplate } from '../utils/templateEngine';

interface LivePreviewProps {
  canEditPreviewInsertions?: boolean;
  data: CounterGuaranteeData;
  onPreviewInsertionsChange?: (value: DocumentPreviewInsertion[]) => void;
  type: ContractType;
  templateContent?: string;
  loading?: boolean;
}

const PREVIEW_PAGE_HEIGHT = 1128;
const PREVIEW_PAGE_GAP = 72;
const PREVIEW_PAGE_CONTENT_HEIGHT = PREVIEW_PAGE_HEIGHT - 96;

export default function LivePreview({
  canEditPreviewInsertions = false,
  data,
  onPreviewInsertionsChange,
  type,
  templateContent,
  loading = false,
}: LivePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowInsertionSlots = canEditPreviewInsertions || Boolean((data.previewInsertions ?? []).length);
  const compiledHtml = templateContent
    ? compileTemplate(templateContent, data, { mode: 'preview', includeInsertionSlots: shouldShowInsertionSlots })
    : '';

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-400">Cargando vista previa...</div>;
  }

  if (!templateContent) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center text-gray-400">
        <p>No hay una plantilla definida para este tipo de contrato.</p>
        <p className="text-sm">Vaya a la seccion de Plantillas para crear una.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Vista previa editable
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Lo amarillo viene de variables. Haga clic sobre cualquier parrafo para ajustar el texto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              <PencilLine size={14} />
              Edicion directa dentro del documento
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
              onClick={() => setIsExpanded(true)}
              type="button"
            >
              <Expand size={16} />
              Expandir
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <PreviewCanvas
            canEditPreviewInsertions={canEditPreviewInsertions}
            compiledHtml={compiledHtml}
            onPreviewInsertionsChange={onPreviewInsertionsChange}
          />
        </div>
      </div>

      {isExpanded ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 p-4">
          <div
            aria-label="Vista previa expandida"
            aria-modal="true"
            className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-2xl"
            role="dialog"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50 px-5 py-4">
              <div>
                <h3 className="text-base font-medium text-stone-900">Vista previa expandida</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Edite directamente dentro del documento y use el resaltado para ubicar rapido las variables.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-100"
                  onClick={() => setIsExpanded(false)}
                  type="button"
                >
                  <Minimize2 size={16} />
                  Contraer
                </button>
                <button
                  aria-label="Cerrar vista previa expandida"
                  className="rounded-xl border border-stone-200 bg-white p-2 text-stone-600 transition hover:bg-stone-100"
                  onClick={() => setIsExpanded(false)}
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-stone-100 p-5">
              <PreviewCanvas
                canEditPreviewInsertions={canEditPreviewInsertions}
                compiledHtml={compiledHtml}
                onPreviewInsertionsChange={onPreviewInsertionsChange}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PreviewCanvas({
  canEditPreviewInsertions,
  compiledHtml,
  onPreviewInsertionsChange,
}: {
  canEditPreviewInsertions: boolean;
  compiledHtml: string;
  onPreviewInsertionsChange?: (value: DocumentPreviewInsertion[]) => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<string[][]>([[]]);

  useEffect(() => {
    if (canEditPreviewInsertions) {
      return;
    }

    const node = contentRef.current;
    if (!node) {
      return;
    }

    const editableBlocks = Array.from(node.querySelectorAll<HTMLElement>('[data-editable-block="true"]'));
    editableBlocks.forEach((block) => {
      block.contentEditable = canEditPreviewInsertions ? 'true' : 'false';
      block.tabIndex = canEditPreviewInsertions ? 0 : -1;
    });
  }, [canEditPreviewInsertions, pages]);

  useEffect(() => {
    const node = measureRef.current;
    if (!node) {
      return;
    }

    const measure = () => {
      const topLevelBlocks = Array.from(node.children) as HTMLElement[];

      if (!topLevelBlocks.length) {
        setPages([[]]);
        return;
      }

      const nextPages: string[][] = [[]];
      let currentHeight = 0;

      topLevelBlocks.forEach((block) => {
        const blockHeight = Math.max(block.offsetHeight, 24);
        const currentPage = nextPages[nextPages.length - 1];

        if (currentPage.length > 0 && currentHeight + blockHeight > PREVIEW_PAGE_CONTENT_HEIGHT) {
          nextPages.push([]);
          currentHeight = 0;
        }

        nextPages[nextPages.length - 1].push(block.outerHTML);
        currentHeight += blockHeight;
      });

      setPages(nextPages);
    };

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);

    return () => observer.disconnect();
  }, [compiledHtml]);

  const emitInsertions = () => {
    if (!contentRef.current || !onPreviewInsertionsChange) {
      return;
    }

    const nextInsertions: DocumentPreviewInsertion[] = [];

    Array.from(contentRef.current.querySelectorAll<HTMLElement>('[data-editable-block="true"]')).forEach((block) => {
      const anchorId = block.dataset.insertionAnchor ?? '';
      const text = normalizeEditableText(block);
      const originalText = (block.dataset.originalText ?? '').trim();

      if (!anchorId || text === originalText) {
        return;
      }

      nextInsertions.push({
        anchorId,
        ...(text.length === 0 ? { preserveEmpty: true } : {}),
        text,
      });
    });

    onPreviewInsertionsChange(nextInsertions);
  };

  const handleDocumentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canEditPreviewInsertions) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const editableBlock = target?.closest<HTMLElement>('[data-editable-block="true"]');
    if (!editableBlock) {
      return;
    }

    focusEditableBlock(editableBlock);
  };

  const handleDocumentMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canEditPreviewInsertions) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const editableBlock = target?.closest<HTMLElement>('[data-editable-block="true"]');
    if (!editableBlock) {
      return;
    }

    event.preventDefault();
    focusEditableBlock(editableBlock);
  };

  return (
    <div className="relative mx-auto w-full max-w-[800px]">
      <div
        className="flex flex-col"
        onBlurCapture={emitInsertions}
        onClickCapture={handleDocumentClick}
        onMouseDownCapture={handleDocumentMouseDown}
        ref={contentRef}
        style={{ gap: `${PREVIEW_PAGE_GAP}px` }}
      >
        {pages.map((pageBlocks, index) => (
          <div className="relative" key={`page-${index + 1}`}>
            <article
              className="relative min-h-[1128px] rounded-[28px] border border-stone-200/90 bg-white shadow-[0_22px_55px_-28px_rgba(15,23,42,0.38)]"
              style={{ minHeight: `${PREVIEW_PAGE_HEIGHT}px` }}
            >
              <div className="pointer-events-none absolute right-6 top-5 z-10 rounded-full bg-stone-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white">
                Pagina {index + 1}
              </div>

              <div
                className="preview-document relative z-[1] px-12 py-12 text-sm leading-relaxed text-gray-900"
                dangerouslySetInnerHTML={{ __html: pageBlocks.join('') }}
                style={{ fontFamily: '"Times New Roman", serif' }}
              />
            </article>

            {index < pages.length - 1 ? (
              <div className="pointer-events-none absolute inset-x-10 -bottom-9 z-10 flex items-center gap-4">
                <div className="h-px flex-1 bg-stone-300" />
                <span className="rounded-full border border-stone-300 bg-stone-100 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-600 shadow-sm">
                  Siguiente hoja
                </span>
                <div className="h-px flex-1 bg-stone-300" />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute -left-[99999px] top-0 w-full max-w-[800px] opacity-0">
        <div
          className="preview-document px-12 py-12 text-sm leading-relaxed text-gray-900"
          dangerouslySetInnerHTML={{ __html: compiledHtml }}
          ref={measureRef}
          style={{ fontFamily: '"Times New Roman", serif' }}
        />
      </div>
    </div>
  );
}

function normalizeEditableText(block: HTMLElement) {
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

function focusEditableBlock(block: HTMLElement) {
  block.focus();

  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  if (selection.rangeCount > 0 && block.contains(selection.anchorNode)) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(block);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}
