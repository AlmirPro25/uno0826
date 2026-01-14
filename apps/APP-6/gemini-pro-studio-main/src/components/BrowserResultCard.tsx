/**
 * 🌐 BROWSER RESULT CARD
 * Componente para exibir resultados de navegação no Canvas
 */

import React, { useState } from 'react';
import { PageContent, SearchResult } from '../services/browserService';

interface BrowserResultCardProps {
  type: 'webpage' | 'search-results';
  data: {
    url?: string;
    title?: string;
    screenshot?: string;
    content?: PageContent;
    searchResults?: SearchResult[];
    query?: string;
    liveUrl?: string; // URL para iframe
    generatedUrls?: any[]; // URLs geradas pelo Gemini
    analysis?: {
      summary?: string;
      products?: Array<{
        name: string;
        price?: string;
        description?: string;
        image?: string;
      }>;
      highlights?: string[];
      recommendation?: string;
    };
  };
}

export const BrowserResultCard: React.FC<BrowserResultCardProps> = ({ type, data }) => {
  const [showFullText, setShowFullText] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'preview' | 'text' | 'links' | 'images' | 'products'>('preview');
  const [iframeError, setIframeError] = useState(false);
  
  // Sites que geralmente bloqueiam iframe
  const blockedSites = ['google.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'youtube.com'];
  const url = data.liveUrl || data.url || '';
  const isLikelyBlocked = blockedSites.some(site => url.includes(site));
  
  // Verificar se tem produtos
  const hasProducts = data.analysis?.products && data.analysis.products.length > 0;

  if (type === 'search-results') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>🔍 Resultados: "{data.query}"</h3>
          <span style={styles.badge}>{data.searchResults?.length || 0} resultados</span>
        </div>

        <div style={styles.searchResults}>
          {data.searchResults?.map((result, index) => (
            <div key={index} style={styles.searchResult}>
              <div style={styles.searchResultNumber}>#{index + 1}</div>
              <div style={styles.searchResultContent}>
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.searchResultTitle}
                >
                  {result.title}
                </a>
                <p style={styles.searchResultUrl}>{result.url}</p>
                <p style={styles.searchResultSnippet}>{result.snippet}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Webpage view
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>{data.title || 'Página'}</h3>
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.url}
          >
            {data.url}
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={selectedTab === 'preview' ? styles.tabActive : styles.tab}
          onClick={() => setSelectedTab('preview')}
        >
          📸 Screenshot
        </button>
        {hasProducts && (
          <button
            style={selectedTab === 'products' ? styles.tabActive : styles.tab}
            onClick={() => setSelectedTab('products')}
          >
            🛍️ Produtos ({data.analysis?.products?.length || 0})
          </button>
        )}
        <button
          style={selectedTab === 'text' ? styles.tabActive : styles.tab}
          onClick={() => setSelectedTab('text')}
        >
          📝 Texto
        </button>
        <button
          style={selectedTab === 'links' ? styles.tabActive : styles.tab}
          onClick={() => setSelectedTab('links')}
        >
          🔗 Links ({data.content?.links.length || 0})
        </button>
        <button
          style={selectedTab === 'images' ? styles.tabActive : styles.tab}
          onClick={() => setSelectedTab('images')}
        >
          🖼️ Imagens ({data.content?.images.length || 0})
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {selectedTab === 'preview' && data.screenshot && (
          <div style={styles.screenshotContainer}>
            <div style={styles.screenshotToolbar}>
              <span style={styles.screenshotInfo}>
                📸 Captura via Playwright • {data.liveUrl || data.url}
              </span>
              <a 
                href={data.liveUrl || data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.openButton}
              >
                ↗️ Abrir em nova aba
              </a>
            </div>
            <div style={styles.screenshotWrapper}>
              <img 
                src={`data:image/jpeg;base64,${data.screenshot}`}
                alt="Screenshot da página"
                style={styles.screenshot}
              />
            </div>
            <div style={styles.screenshotFooter}>
              💡 <strong>Dica:</strong> Esta é uma captura real da página via Playwright. 
              Para interagir, clique em "Abrir em nova aba".
            </div>
          </div>
        )}

        {selectedTab === 'text' && data.content && (
          <div style={styles.textContainer}>
            <p style={styles.text}>
              {showFullText 
                ? data.content.text 
                : data.content.text.slice(0, 1000) + '...'}
            </p>
            {data.content.text.length > 1000 && (
              <button
                style={styles.showMoreButton}
                onClick={() => setShowFullText(!showFullText)}
              >
                {showFullText ? 'Mostrar menos' : 'Mostrar mais'}
              </button>
            )}
          </div>
        )}

        {selectedTab === 'links' && data.content && (
          <div style={styles.linksContainer}>
            {data.content.links.map((link, index) => (
              <div key={index} style={styles.linkItem}>
                <a 
                  href={link.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.linkText}
                >
                  {link.text || link.href}
                </a>
                <span style={styles.linkUrl}>{link.href}</span>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'products' && data.analysis?.products && (
          <div style={styles.productsContainer}>
            {data.analysis.summary && (
              <div style={styles.analysisSummary}>
                <h4 style={styles.summaryTitle}>🧠 Análise Inteligente</h4>
                <p style={styles.summaryText}>{data.analysis.summary}</p>
              </div>
            )}
            
            <div style={styles.productsGrid}>
              {data.analysis.products.map((product, index) => (
                <div key={index} style={styles.productCard}>
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      style={styles.productImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div style={styles.productInfo}>
                    <h5 style={styles.productName}>{product.name}</h5>
                    {product.price && (
                      <p style={styles.productPrice}>{product.price}</p>
                    )}
                    {product.description && (
                      <p style={styles.productDescription}>{product.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {data.analysis.highlights && data.analysis.highlights.length > 0 && (
              <div style={styles.highlights}>
                <h4 style={styles.highlightsTitle}>✨ Destaques</h4>
                <ul style={styles.highlightsList}>
                  {data.analysis.highlights.map((highlight, index) => (
                    <li key={index} style={styles.highlightItem}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.analysis.recommendation && (
              <div style={styles.recommendation}>
                <strong>💡 Recomendação:</strong> {data.analysis.recommendation}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'images' && data.content && (
          <div style={styles.imagesGrid}>
            {data.content.images.map((image, index) => (
              <div key={index} style={styles.imageItem}>
                <img 
                  src={image.src} 
                  alt={image.alt || 'Imagem'}
                  style={styles.image}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {image.alt && <p style={styles.imageAlt}>{image.alt}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '16px',
    border: '1px solid #333',
  } as React.CSSProperties,

  header: {
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as React.CSSProperties,

  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#fff',
  } as React.CSSProperties,

  url: {
    fontSize: '14px',
    color: '#888',
    textDecoration: 'none',
  } as React.CSSProperties,

  badge: {
    padding: '4px 12px',
    backgroundColor: '#3498db',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  } as React.CSSProperties,

  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '1px solid #333',
    paddingBottom: '8px',
  } as React.CSSProperties,

  tab: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    transition: 'all 0.2s',
  } as React.CSSProperties,

  tabActive: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '6px',
  } as React.CSSProperties,

  content: {
    minHeight: '200px',
  } as React.CSSProperties,

  iframeContainer: {
    width: '100%',
    height: '800px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    border: '1px solid #333',
    overflow: 'hidden',
    backgroundColor: '#fff',
  } as React.CSSProperties,

  iframeToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#2a2a2a',
    borderBottom: '1px solid #333',
  } as React.CSSProperties,

  iframeUrl: {
    fontSize: '12px',
    color: '#888',
    fontFamily: 'monospace',
  } as React.CSSProperties,

  openButton: {
    padding: '4px 12px',
    backgroundColor: '#3498db',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'all 0.2s',
  } as React.CSSProperties,

  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#fff',
  } as React.CSSProperties,

  iframeContent: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#fff',
  } as React.CSSProperties,

  screenshotFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,

  warningBanner: {
    padding: '12px 16px',
    backgroundColor: '#f39c12',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e67e22',
  } as React.CSSProperties,

  noPreview: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    padding: '40px',
    textAlign: 'center',
  } as React.CSSProperties,

  screenshotContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    border: '1px solid #333',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  } as React.CSSProperties,

  screenshotToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#2a2a2a',
    borderBottom: '1px solid #333',
  } as React.CSSProperties,

  screenshotInfo: {
    fontSize: '13px',
    color: '#888',
    fontFamily: 'monospace',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: '16px',
  } as React.CSSProperties,

  screenshotWrapper: {
    width: '100%',
    maxHeight: '800px',
    overflow: 'auto',
    backgroundColor: '#000',
  } as React.CSSProperties,

  screenshot: {
    width: '100%',
    height: 'auto',
    display: 'block',
  } as React.CSSProperties,

  screenshotFooter: {
    padding: '12px 16px',
    backgroundColor: '#2a2a2a',
    borderTop: '1px solid #333',
    fontSize: '13px',
    color: '#888',
  } as React.CSSProperties,

  textContainer: {
    padding: '16px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
  } as React.CSSProperties,

  text: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#ddd',
    whiteSpace: 'pre-wrap',
  } as React.CSSProperties,

  showMoreButton: {
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  } as React.CSSProperties,

  linksContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  } as React.CSSProperties,

  linkItem: {
    padding: '12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    borderLeft: '3px solid #3498db',
  } as React.CSSProperties,

  linkText: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#3498db',
    textDecoration: 'none',
    marginBottom: '4px',
  } as React.CSSProperties,

  linkUrl: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    wordBreak: 'break-all',
  } as React.CSSProperties,

  imagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  } as React.CSSProperties,

  imageItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    overflow: 'hidden',
  } as React.CSSProperties,

  image: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
  } as React.CSSProperties,

  imageAlt: {
    padding: '8px',
    fontSize: '12px',
    color: '#888',
    margin: 0,
  } as React.CSSProperties,

  searchResults: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  } as React.CSSProperties,

  searchResult: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    transition: 'transform 0.2s',
    cursor: 'pointer',
  } as React.CSSProperties,

  searchResultNumber: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    color: '#fff',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: 600,
    flexShrink: 0,
  } as React.CSSProperties,

  searchResultContent: {
    flex: 1,
  } as React.CSSProperties,

  searchResultTitle: {
    display: 'block',
    fontSize: '16px',
    fontWeight: 600,
    color: '#3498db',
    textDecoration: 'none',
    marginBottom: '4px',
  } as React.CSSProperties,

  searchResultUrl: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    color: '#2ecc71',
  } as React.CSSProperties,

  searchResultSnippet: {
    margin: 0,
    fontSize: '14px',
    color: '#ddd',
    lineHeight: '1.5',
  } as React.CSSProperties,

  productsContainer: {
    padding: '16px',
  } as React.CSSProperties,

  analysisSummary: {
    padding: '16px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #3498db',
  } as React.CSSProperties,

  summaryTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#3498db',
  } as React.CSSProperties,

  summaryText: {
    margin: 0,
    fontSize: '14px',
    color: '#ccc',
    lineHeight: '1.6',
  } as React.CSSProperties,

  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  } as React.CSSProperties,

  productCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #333',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  } as React.CSSProperties,

  productImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    backgroundColor: '#1a1a1a',
  } as React.CSSProperties,

  productInfo: {
    padding: '12px',
  } as React.CSSProperties,

  productName: {
    margin: '0 0 8px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    lineHeight: '1.4',
  } as React.CSSProperties,

  productPrice: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 700,
    color: '#27ae60',
  } as React.CSSProperties,

  productDescription: {
    margin: 0,
    fontSize: '13px',
    color: '#888',
    lineHeight: '1.5',
  } as React.CSSProperties,

  highlights: {
    padding: '16px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #f39c12',
  } as React.CSSProperties,

  highlightsTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#f39c12',
  } as React.CSSProperties,

  highlightsList: {
    margin: 0,
    paddingLeft: '20px',
  } as React.CSSProperties,

  highlightItem: {
    fontSize: '14px',
    color: '#ccc',
    marginBottom: '8px',
    lineHeight: '1.5',
  } as React.CSSProperties,

  recommendation: {
    padding: '16px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#ccc',
    border: '1px solid #9b59b6',
  } as React.CSSProperties,
};

export default BrowserResultCard;
