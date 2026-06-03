'use client';

import { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const transformer = new Transformer();

// SVG-based mindmap renderer. markmap-view mounts directly onto an SVG
// element and runs its own zoom/pan via d3, so the parent just provides
// a sized container.
export function MindmapView({ markdown }: { markdown: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const { root } = transformer.transform(markdown);
    if (!mmRef.current) {
      mmRef.current = Markmap.create(svgRef.current, undefined, root);
    } else {
      mmRef.current.setData(root);
      mmRef.current.fit();
    }
  }, [markdown]);

  // Re-fit on container resize so the mindmap stays centered when the
  // tab panel resizes (window resize, sidebar collapse, etc.).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() => {
      mmRef.current?.fit();
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={svgRef}
      className="block h-[60vh] w-full rounded-2xl border border-border bg-card/40"
    />
  );
}
