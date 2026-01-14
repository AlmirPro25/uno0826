/**
 * 🛒 PRODUCT GRID COMPONENT
 * Exibe produtos em grade com imagem, preço e link
 */

import React from 'react';
import { Product, formatPrice, formatInstallments } from '../services/productSearchService';

interface ProductGridProps {
  products: Product[];
  query: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, query }) => {
  if (products.length === 0) {
    return (
      <div style={styles.empty}>
        <p>😕 Nenhum produto encontrado para "{query}"</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🛒 {products.length} produtos encontrados</h3>
        <p style={styles.subtitle}>Clique em "Ver Produto" para comprar</p>
      </div>

      <div style={styles.grid}>
        {products.map((product, index) => (
          <ProductCard key={product.id || index} product={product} rank={index + 1} />
        ))}
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  rank: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, rank }) => {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discount = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <div style={styles.card}>
      {/* Badge de ranking */}
      {rank <= 3 && (
        <div style={{ ...styles.badge, ...styles[`badge${rank}` as keyof typeof styles] }}>
          #{rank}
        </div>
      )}

      {/* Badge de desconto */}
      {hasDiscount && (
        <div style={styles.discountBadge}>
          -{discount}%
        </div>
      )}

      {/* Imagem */}
      <div style={styles.imageContainer}>
        <img
          src={product.image || 'https://via.placeholder.com/300x300?text=Sem+Imagem'}
          alt={product.title}
          style={styles.image}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Erro';
          }}
        />
      </div>

      {/* Informações */}
      <div style={styles.info}>
        <h4 style={styles.productTitle} title={product.title}>
          {product.title}
        </h4>

        {/* Preço */}
        <div style={styles.priceContainer}>
          {hasDiscount && (
            <span style={styles.originalPrice}>
              {formatPrice(product.originalPrice!, product.currency)}
            </span>
          )}
          <span style={styles.price}>
            {formatPrice(product.price, product.currency)}
          </span>
        </div>

        {/* Parcelamento */}
        {product.installments && (
          <p style={styles.installments}>
            {formatInstallments(product.installments)}
          </p>
        )}

        {/* Frete */}
        {product.shipping.free && (
          <div style={styles.freeShipping}>
            ✅ Frete Grátis
          </div>
        )}

        {/* Vendedor */}
        <p style={styles.seller}>
          Vendedor: {product.seller.name}
        </p>

        {/* Botão */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.button}
          onClick={() => {
            console.log('🛒 Produto clicado:', product.title);
          }}
        >
          Ver Produto →
        </a>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    marginTop: '16px',
  } as React.CSSProperties,

  header: {
    marginBottom: '16px',
  } as React.CSSProperties,

  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,

  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  } as React.CSSProperties,

  card: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,

  badge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    color: 'white',
    zIndex: 1,
  } as React.CSSProperties,

  badge1: {
    backgroundColor: '#FFD700',
    color: '#000',
  } as React.CSSProperties,

  badge2: {
    backgroundColor: '#C0C0C0',
    color: '#000',
  } as React.CSSProperties,

  badge3: {
    backgroundColor: '#CD7F32',
    color: '#fff',
  } as React.CSSProperties,

  discountBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: '#e74c3c',
    color: 'white',
    zIndex: 1,
  } as React.CSSProperties,

  imageContainer: {
    width: '100%',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '12px',
  } as React.CSSProperties,

  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  } as React.CSSProperties,

  info: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  } as React.CSSProperties,

  productTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a1a',
    lineHeight: '1.4',
    height: '40px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  } as React.CSSProperties,

  priceContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px',
  } as React.CSSProperties,

  originalPrice: {
    fontSize: '12px',
    color: '#999',
    textDecoration: 'line-through',
  } as React.CSSProperties,

  price: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#2ecc71',
  } as React.CSSProperties,

  installments: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    color: '#666',
  } as React.CSSProperties,

  freeShipping: {
    padding: '4px 8px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '8px',
    textAlign: 'center',
  } as React.CSSProperties,

  seller: {
    margin: '0 0 12px 0',
    fontSize: '11px',
    color: '#999',
  } as React.CSSProperties,

  button: {
    display: 'block',
    width: '100%',
    padding: '10px',
    backgroundColor: '#3498db',
    color: 'white',
    textAlign: 'center',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'background-color 0.2s',
    marginTop: 'auto',
  } as React.CSSProperties,

  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  } as React.CSSProperties,
};

export default ProductGrid;
