"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface LatexRendererProps {
  text: string;
  className?: string;
}

/**
 * Safely parses and renders text containing LaTeX math equations.
 * Supports:
 * - Display Math: $$...$$ and \[...\]
 * - Inline Math: $...$ and \(...\)
 */
export default function LatexRenderer({ text, className = "" }: LatexRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!text) return "";

    // Regex to match $$...$$, \[...\], $...$, \(...\)
    const regex = /(\$\$(?:[\s\S]*?)\$\$|\\\[(?:[\s\S]*?)\\\]|\$(?:[^\$\n]+?)\$|\\\((?:[\s\S]*?)\\\))/g;
    const parts = text.split(regex);

    return parts
      .map((part) => {
        if (!part) return "";

        // Display math ($$...$$ or \[...\])
        if (
          (part.startsWith("$$") && part.endsWith("$$") && part.length >= 4) ||
          (part.startsWith("\\[") && part.endsWith("\\]") && part.length >= 4)
        ) {
          const content = part.startsWith("$$")
            ? part.slice(2, -2)
            : part.slice(2, -2);
          try {
            return katex.renderToString(content.trim(), {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return `<span class="katex-error">${escapeHtml(part)}</span>`;
          }
        }

        // Inline math ($...$ or \(...\))
        if (
          (part.startsWith("$") && part.endsWith("$") && part.length >= 2) ||
          (part.startsWith("\\(") && part.endsWith("\\)") && part.length >= 4)
        ) {
          const content = part.startsWith("$")
            ? part.slice(1, -1)
            : part.slice(2, -2);
          try {
            return katex.renderToString(content.trim(), {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            return `<span class="katex-error">${escapeHtml(part)}</span>`;
          }
        }

        // Plain text with linebreaks converted
        return escapeHtml(part).replace(/\n/g, "<br/>");
      })
      .join("");
  }, [text]);

  return (
    <div
      className={`leading-relaxed break-words text-gray-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
