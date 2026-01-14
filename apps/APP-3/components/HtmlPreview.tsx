

import React, { useEffect, useMemo } from 'react';
import { expandImageUrls } from '../services/ImageUrlExpander';
import { expandVideoUrls } from '../services/VideoUrlExpander';

interface HtmlPreviewProps {
  htmlContent: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export const HtmlPreview: React.FC<HtmlPreviewProps> = ({ htmlContent, iframeRef }) => {
  // iframeKey removed to prevent full re-mount on every minor htmlContent change.
  // The update will be handled by React re-rendering with a new srcDoc value.

  const scriptToInject = `
    document.addEventListener('DOMContentLoaded', () => {
      let currentHighlightedElement = null;
      let highlightTimeout = null;

      // --- Console Interception ---
      const originalConsole = { ...window.console };
      const formatArg = (arg) => {
        if (arg instanceof Error) {
          return arg.stack || arg.message;
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return '[Unserializable Object]';
          }
        }
        return String(arg);
      };
      const postConsoleMessage = (level, args) => {
        const message = Array.from(args).map(formatArg).join(' ');
        window.parent.postMessage({
          source: 'ai-web-weaver-preview',
          type: 'console',
          level: level,
          message: message,
          timestamp: new Date().toISOString(),
        }, '*');
        originalConsole[level]?.(...args); // Also log to the actual browser console
      };
      
      window.console.log = (...args) => postConsoleMessage('log', args);
      window.console.warn = (...args) => postConsoleMessage('warn', args);
      window.console.error = (...args) => postConsoleMessage('error', args);
      window.console.info = (...args) => postConsoleMessage('info', args);
      window.console.debug = (...args) => postConsoleMessage('debug', args);

      window.onerror = (message, source, lineno, colno, error) => {
        let fullMessage = message;
        if (error && error.stack) {
            fullMessage = error.stack;
        } else if (source) {
            fullMessage = \`\${message} at \${source}:\${lineno}:\${colno}\`;
        }
        window.parent.postMessage({
          source: 'ai-web-weaver-preview',
          type: 'console',
          level: 'error',
          message: \`Uncaught Exception: \${fullMessage}\`,
          timestamp: new Date().toISOString(),
        }, '*');
        // Return false to allow the default error handling to continue (e.g., logging to browser console)
        return false;
      };


      // --- Element Highlighting & Interaction ---
      const highlightElement = (element, temporary = false) => {
        if (currentHighlightedElement && currentHighlightedElement !== element) {
          currentHighlightedElement.style.outline = '';
          currentHighlightedElement.style.boxShadow = '';
        }
        if (element) {
          element.style.outline = '2px solid #0EA5E9'; // sky-500
          element.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.4)'; // sky-500 with opacity
          currentHighlightedElement = element;

          if (temporary) {
            if (highlightTimeout) clearTimeout(highlightTimeout);
            highlightTimeout = setTimeout(() => {
              if (element === currentHighlightedElement) {
                 element.style.outline = '';
                 element.style.boxShadow = '';
                 currentHighlightedElement = null;
              }
            }, 2000);
          }
        }
      };

      document.body.addEventListener('click', (event) => {
        const targetElement = event.target.closest('[data-aid]');
        if (targetElement) {
          const dataAid = targetElement.getAttribute('data-aid');
          const tagName = targetElement.tagName;
          const outerHTML = targetElement.outerHTML; // Get outerHTML of the clicked element
          const clickX = event.clientX;
          const clickY = event.clientY;

          const iframeElementForRect = event.target.ownerDocument.defaultView.frameElement;
          const iframeBoundingRect = iframeElementForRect ? iframeElementForRect.getBoundingClientRect() : null;

          if (dataAid && tagName && window.parent) {
            window.parent.postMessage({
              source: 'ai-web-weaver-preview',
              type: 'elementClicked',
              dataAid: dataAid,
              tagName: tagName,
              outerHTML: outerHTML, // Send outerHTML
              clickX: clickX,
              clickY: clickY,
              iframeBoundingRect: iframeBoundingRect ? {
                top: iframeBoundingRect.top,
                left: iframeBoundingRect.left,
                width: iframeBoundingRect.width,
                height: iframeBoundingRect.height
              } : null
            }, '*');
            highlightElement(targetElement, true);
          }
        }
      });

      document.body.addEventListener('mouseover', (event) => {
        const targetElement = event.target.closest('[data-aid]');
        if (targetElement && targetElement !== currentHighlightedElement) {
           targetElement.style.outline = '2px dotted #38BDF8'; // sky-400
        }
      });

      document.body.addEventListener('mouseout', (event) => {
        const targetElement = event.target.closest('[data-aid]');
        if (targetElement && targetElement !== currentHighlightedElement) {
           targetElement.style.outline = '';
        }
      });

      window.addEventListener('message', (event) => {
        const messageData = event.data;
        if (messageData.source === 'ai-web-weaver-editor' && messageData.type === 'highlightElement' && messageData.dataAid) {
          const elementToHighlight = document.querySelector(\`[data-aid="\${messageData.dataAid}"]\`);
          if (elementToHighlight) {
            highlightElement(elementToHighlight, true);
            elementToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
        }
      });
    });
  `;

  // Expandir URLs comprimidas para o preview funcionar
  const expandedHtmlContent = useMemo(() => {
    // Primeiro expandir URLs de imagem, depois URLs de vídeo
    const withExpandedImages = expandImageUrls(htmlContent);
    return expandVideoUrls(withExpandedImages);
  }, [htmlContent]);

  // srcDocContent will be recomputed if htmlContent or scriptToInject changes.
  // scriptToInject is stable. So, effectively, on htmlContent change.
  const srcDocContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="text/javascript">${scriptToInject}</script>
        <style>
          body {
            min-height: 100vh; margin: 0;
            background-color: var(--ai-preview-default-bg, #FFFFFF);
          }
          [data-aid] { cursor: pointer; }
        </style>
      </head>
      <body>
        ${expandedHtmlContent}
      </body>
    </html>
  `;

  return (
    <div className="w-full h-full bg-[var(--ai-preview-default-bg)] overflow-auto">
      <iframe
        // key prop removed
        ref={iframeRef}
        srcDoc={srcDocContent}
        title="Live HTML Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-popups allow-forms allow-modals"
        aria-label="Live HTML Preview Area"
      />
    </div>
  );
};