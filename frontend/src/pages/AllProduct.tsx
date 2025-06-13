// frontend/src/pages/AllProduct.tsx
import React, { useState, useEffect } from "react";
import { shopifyApi, type ShopifyProduct } from "../api/shopifyApi";
import ProductCard from "../components/ProductCard";
import listStyles from "../styles/makhanas/productlist.module.css";

export interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  rating?: number;
  reviewCount?: number;
  images: {
    main: string;
    hover: string;
  };
  hasAntioxidants?: boolean;
  hasProbiotics?: boolean;
  weight: string;
  shopifyVariantId?: string;
  handle?: string;
}

const AllProduct = () => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>();

  const mapShopifyToProductCard = (
    shopifyProduct: ShopifyProduct
  ): ProductCardProps => {
    const firstVariant = shopifyProduct.variants.edges[0]?.node;
    const mainImage =
      shopifyProduct.images.edges[0]?.node.url ||
      "/images/product-placeholder.png";
    const hoverImage = shopifyProduct.images.edges[1]?.node.url || mainImage;

    // Extract features from tags
    const tags = shopifyProduct.tags.map((tag) => tag.toLowerCase());

    return {
      id: shopifyProduct.id,
      title: shopifyProduct.title,
      price:
        firstVariant?.price.amount ||
        shopifyProduct.priceRange.minVariantPrice.amount,
      rating: undefined, // Shopify doesn't provide ratings by default
      reviewCount: undefined,
      images: {
        main: mainImage,
        hover: hoverImage,
      },
      hasAntioxidants:
        tags.includes("antioxidants") || tags.includes("anti-oxidants"),
      hasProbiotics: tags.includes("probiotics"),
      weight: "40 GM", // Default weight, you can extract from product title or metafields
      shopifyVariantId: firstVariant?.id,
      handle: shopifyProduct.handle,
    };
  };

  const fetchProducts = async (after?: string) => {
    try {
      setLoading(true);
      console.log("Fetching products from Shopify...");

      const response = await shopifyApi.getProducts(20, after);

      const mappedProducts = response.products.map(mapShopifyToProductCard);

      if (after) {
        // Loading more products
        setProducts((prev) => [...prev, ...mappedProducts]);
      } else {
        // Initial load
        setProducts(mappedProducts);
      }

      setHasNextPage(response.pageInfo.hasNextPage);
      setEndCursor(response.pageInfo.endCursor);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching Shopify products:", err);
      setError(`Failed to load products: ${err.message}`);
      if (!after) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const loadMoreProducts = () => {
    if (hasNextPage && endCursor && !loading) {
      fetchProducts(endCursor);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        <div className={listStyles.loading}>
          Loading products from Shopify...
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        <div className={listStyles.error}>{error}</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        <div className={listStyles.noProducts}>
          No products found in your Shopify store.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
      <div className={listStyles.productGrid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasNextPage && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={loadMoreProducts}
            disabled={loading}
            style={{
              padding: "12px 30px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Loading..." : "Load More Products"}
          </button>
        </div>
      )}

      {error && products.length > 0 && (
        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            color: "#dc3545",
            padding: "10px",
            backgroundColor: "#f8d7da",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default AllProduct;
