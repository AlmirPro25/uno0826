/**
 * 🎨 ENRICHED BROWSER RESULT
 * Exibe resultados de navegação com análise inteligente, imagens e links
 */

import React from 'react';

export interface EnrichedResult {
  url: string;
  title: string;
  summary: string;
  images: Array<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
  links: Array<{
    text: string;
    href: string;
  }>;
  screenshot?: string;
}

interface EnrichedBrowserResultProps {
  result: EnrichedResult;
  theme: 'light' | 'dark';
}

export const EnrichedBrowserResult: React.FC<EnrichedBrowserResultProps> = ({ result, theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className={`enriched-result ${isDark ? 'dark' : 'light'}`}>
      <style>{`
        .enriched-result {
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
          background: ${isDark ? '#1e1e1e' : '#ffffff'};
          border: 1px solid ${isDark ? '#333' : '#e0e0e0'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .enriched-result.dark {
          background: #1e1e1e;
          border-color: #333;
        }

        .enriched-result.light {
          background: #ffffff;
          border-color: #e0e0e0;
        }

        .result-header {
          margin-bottom: 16px;
        }

        .result-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
          color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
        }

        .result-url {
          font-size: 14px;
          color: ${isDark ? '#888' : '#666'};
          word-break: break-all;
        }

        .result-url a {
          color: ${isDark ? '#4a9eff' : '#0066cc'};
          text-decoration: none;
        }

        .result-url a:hover {
          text-decoration: underline;
        }

        .result-summary {
          margin: 16px 0;
          padding: 16px;
          background: ${isDark ? '#252525' : '#f5f5f5'};
          border-radius: 8px;
          line-height: 1.6;
          color: ${isDark ? '#d0d0d0' : '#333'};
        }

        .result-images {
          margin: 20px 0;
        }

        .images-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .image-card {
          border-radius: 8px;
          overflow: hidden;
          background: ${isDark ? '#252525' : '#f9f9f9'};
          border: 1px solid ${isDark ? '#333' : '#e0e0e0'};
          transition: transform 0.2s;
        }

        .image-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .image-card img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          display: block;
        }

        .image-caption {
          padding: 8px;
          font-size: 12px;
          color: ${isDark ? '#aaa' : '#666'};
          text-align: center;
        }

        .result-links {
          margin: 20px 0;
        }

        .links-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
        }

        .links-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .link-item {
          padding: 10px 12px;
          background: ${isDark ? '#252525' : '#f5f5f5'};
          border-radius: 6px;
          border: 1px solid ${isDark ? '#333' : '#e0e0e0'};
          transition: background 0.2s;
        }

        .link-item:hover {
          background: ${isDark ? '#2a2a2a' : '#ebebeb'};
        }

        .link-item a {
          color: ${isDark ? '#4a9eff' : '#0066cc'};
          text-decoration: none;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .link-item a:hover {
          text-decoration: underline;
        }

        .link-icon {
          font-size: 16px;
        }

        .result-screenshot {
          margin: 20px 0;
        }

        .screenshot-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
        }

        .screenshot-img {
          width: 100%;
          border-radius: 8px;
          border: 1px solid ${isDark ? '#333' : '#e0e0e0'};
          cursor: pointer;
          transition: transform 0.2s;
        }

        .screenshot-img:hover {
          transform: scale(1.02);
        }
      `}</style>

      {/* Header */}
      <div className="result-header">
        <h3 className="result-title">{result.title}</h3>
        <div className="result-url">
          🔗 <a href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a>
        </div>
      </div>

      {/* Summary */}
      {result.summary && (
        <div className="result-summary">
          <strong>📝 Resumo:</strong>
          <p style={{ marginTop: '8px' }}>{result.summary}</p>
        </div>
      )}

      {/* Images */}
      {result.images && result.images.length > 0 && (
        <div className="result-images">
          <div className="images-title">🖼️ Imagens Encontradas ({result.images.length})</div>
          <div className="images-grid">
            {result.images.slice(0, 6).map((img, index) => (
              <div key={index} className="image-card">
                <img 
                  src={img.src} 
                  alt={img.alt || `Imagem ${index + 1}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {img.caption && (
                  <div className="image-caption">{img.caption}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {result.links && result.links.length > 0 && (
        <div className="result-links">
          <div className="links-title">🔗 Links Relacionados ({result.links.length})</div>
          <div className="links-list">
            {result.links.slice(0, 5).map((link, index) => (
              <div key={index} className="link-item">
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  <span className="link-icon">→</span>
                  <span>{link.text}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screenshot */}
      {result.screenshot && (
        <div className="result-screenshot">
          <div className="screenshot-title">📸 Screenshot da Página</div>
          <img 
            src={`data:image/jpeg;base64,${result.screenshot}`}
            alt="Screenshot"
            className="screenshot-img"
            onClick={() => window.open(result.url, '_blank')}
          />
        </div>
      )}
    </div>
  );
};
