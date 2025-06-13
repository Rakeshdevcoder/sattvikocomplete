// frontend/src/pages/AllProduct.tsx
import React, { useState, useEffect } from "react";
import { shopifyApi, type ShopifyProduct } from "../api/shopifyApi";
import ProductCard from "../components/ProductCard";
import listStyles from "../styles/makhanas/productlist.module.css";

const AllProduct = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>();

  const fetchProducts = async (after?: string) => {
    try {
      setLoading(true);
      console.log("Fetching products from Shopify...");

      const response = await shopifyApi.getProducts(20, after);

      if (after) {
        // Loading more products
        setProducts((prev) => [...prev, ...response.products]);
      } else {
        // Initial load
        setProducts(response.products);
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
