'use client';

import { usePDFSlick } from '@pdfslick/react';
import '@pdfslick/react/dist/pdf_viewer.css';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFPreviewProps {
  pdfUrl: string;
}

export default function PDFPreview({ pdfUrl }: PDFPreviewProps) {
  const { viewerRef, usePDFSlickStore, PDFSlickViewer } = usePDFSlick(pdfUrl, {
    scaleValue: 'page-fit',
  });

  const pdfSlick = usePDFSlickStore((s) => s.pdfSlick);
  const scale = usePDFSlickStore((s) => s.scale);
  const numPages = usePDFSlickStore((s) => s.numPages);
  const pageNumber = usePDFSlickStore((s) => s.pageNumber);

  const handleZoomIn = () => {
    pdfSlick?.increaseScale();
  };

  const handleZoomOut = () => {
    pdfSlick?.decreaseScale();
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) {
      pdfSlick?.gotoPage(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < numPages) {
      pdfSlick?.gotoPage(pageNumber + 1);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-soft">
      {/* Barra de herramientas */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-2 text-sm text-slate-600 select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Vista Previa del Contrato</span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={handlePrevPage}
              className="rounded p-1 hover:bg-slate-200 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs">Pág. {pageNumber} de {numPages}</span>
            <button
              type="button"
              disabled={pageNumber >= numPages}
              onClick={handleNextPage}
              className="rounded p-1 hover:bg-slate-200 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleZoomOut} className="rounded p-1 hover:bg-slate-200">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={handleZoomIn} className="rounded p-1 hover:bg-slate-200">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Área del documento */}
      <div className="relative h-[650px] bg-slate-100 overflow-auto">
        <div className="pdfSlick absolute inset-0">
          <PDFSlickViewer {...{ viewerRef, usePDFSlickStore }} />
        </div>
      </div>
    </div>
  );
}
