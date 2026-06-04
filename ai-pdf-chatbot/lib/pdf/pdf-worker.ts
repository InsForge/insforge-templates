'use client';

import { pdfjs } from 'react-pdf';

// pdfjs ships a separate worker bundle that must be loaded outside the
// main JS bundle. react-pdf's documented pattern is to set workerSrc at
// module load time (an import side effect), not inside a component
// effect callback, so the worker is ready before the first <Document>
// render. The unpkg CDN is the lowest-friction default for a template;
// self-host this if you want offline support or strict CSP: copy
// `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` into `public/` and
// point workerSrc at `/pdf.worker.min.mjs` instead.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Kept as a backwards-compatible no-op so callers can still express
// "I depend on the pdf worker being configured" via an explicit call.
export function ensurePdfWorker(): void {}
