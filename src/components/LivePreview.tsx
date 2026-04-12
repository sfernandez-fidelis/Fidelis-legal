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
        <p className="text-sm">Vaya a la sección de Plantillas para crear una.</p>
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
              Lo amarillo viene de variables o texto manual. En PDF y Word se exporta limpio, sin resaltado.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              <PencilLine size={14} />
              Escriba directamente entre cláusulas
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
                  Edite dentro del documento y use el resaltado para ubicar rápido variables e inserciones manuales.
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
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return;
    }

    const slots = Array.from(node.querySelectorAll<HTMLElement>('[data-insertion-anchor]'));
    slots.forEach((slot) => {
      slot.contentEditable = canEditPreviewInsertions ? 'true' : 'false';
      slot.tabIndex = canEditPreviewInsertions ? 0 : -1;
    });
  }, [canEditPreviewInsertions, compiledHtml]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return;
    }

    const measure = () => {
      const nextPageCount = Math.max(1, Math.ceil(node.scrollHeight / PREVIEW_PAGE_HEIGHT));
      setPageCount(nextPageCount);
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

    const nextInsertions = Array.from(contentRef.current.querySelectorAll<HTMLElement>('[data-insertion-anchor]'))
      .map((slot) => ({
        anchorId: slot.dataset.insertionAnchor ?? '',
        text: normalizeEditableText(slot),
      }))
      .filter((item) => item.anchorId && item.text);

    onPreviewInsertionsChange(nextInsertions);
  };

  return (
    <div className="mx-auto w-full max-w-[800px]">
      <div className="relative" style={{ minHeight: `${pageCount * PREVIEW_PAGE_HEIGHT}px` }}>
        {Array.from({ length: pageCount }, (_, index) => (
          <div
            className="pointer-events-none absolute left-3 right-3 rounded-[24px] border border-gray-200/80 bg-white shadow-md"
            key={`page-surface-${index + 1}`}
            style={{ height: `${PREVIEW_PAGE_HEIGHT}px`, top: `${index * PREVIEW_PAGE_HEIGHT}px` }}
          />
        ))}

        {Array.from({ length: pageCount }, (_, index) => (
          <div
            className="pointer-events-none absolute right-6 z-10 rounded-full bg-stone-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white"
            key={`page-badge-${index + 1}`}
            style={{ top: `${index * PREVIEW_PAGE_HEIGHT + 18}px` }}
          >
            Página {index + 1}
          </div>
        ))}

        {Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => (
          <div
            className="pointer-events-none absolute inset-x-6 z-10 flex items-center gap-3"
            key={`page-break-${index + 1}`}
            style={{ top: `${(index + 1) * PREVIEW_PAGE_HEIGHT}px`, transform: 'translateY(-50%)' }}
          >
            <div className="h-px flex-1 bg-amber-300/90" />
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700 shadow-sm">
              Salto de página
            </span>
            <div className="h-px flex-1 bg-amber-300/90" />
          </div>
        ))}

        <div
          className="relative z-[1] min-h-full px-12 py-12 text-sm leading-relaxed text-gray-900"
          onBlurCapture={emitInsertions}
          ref={contentRef}
          style={{ fontFamily: '"Times New Roman", serif', minHeight: `${pageCount * PREVIEW_PAGE_HEIGHT}px` }}
          dangerouslySetInnerHTML={{ __html: compiledHtml }}
        />
      </div>
    </div>
  );
}

function normalizeEditableText(slot: HTMLElement) {
  const cloned = slot.cloneNode(true) as HTMLElement;
  cloned.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
  return (cloned.textContent ?? '').replace(/\u00a0/g, ' ').trim();
}
