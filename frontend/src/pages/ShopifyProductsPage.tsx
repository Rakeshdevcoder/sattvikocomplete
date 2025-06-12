// src/pages/ShopifyProductsPage.tsx
import React, { useState } from "react";
import {
  useShopifyProducts,
  useShopifyCollectionProducts,
} from "../hooks/useShopifyProducts";
import { useShopifyCart } from "../context/ShopifyCartContext";
import type { ShopifyProduct } from "../api/shopifyApi";
import { FiShoppingCart, FiLoader } from "react-icons/fi";

const ShopifyProductsPage: React.FC = () => {
  const { products, loading, error, hasNextPage, loadMore } =
    useShopifyProducts(12);
  const { addToCart, loading: cartLoading } = useShopifyCart();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const formatPrice = (amount: string, currencyCode: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
    }).format(parseFloat(amount));
  };

  const getImageUrl = (product: ShopifyProduct): string => {
    return (
      product.images.edges[0]?.node.url ||
      "https://via.placeholder.com/300x300?text=Product"
    );
  };

  const handleAddToCart = async (product: ShopifyProduct) => {
    const firstVariant = product.variants.edges[0]?.node;
    if (!firstVariant) {
      alert("Product variant not available");
      return;
    }

    setAddingProductId(product.id);
    try {
      await addToCart(firstVariant.id, 1);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      alert("Failed to add product to cart");
    } finally {
      setAddingProductId(null);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          fontSize: "18px",
        }}
      >
        <FiLoader
          style={{ animation: "spin 1s linear infinite", marginRight: "10px" }}
        />
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          color: "#dc3545",
          fontSize: "18px",
        }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1
        style={{
          textAlign: "center",
          marginBottom: "40px",
          fontSize: "2.5rem",
        }}
      >
        Our Products
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "30px",
          marginBottom: "40px",
        }}
      >
        {products.map((product) => {
          const firstVariant = product.variants.edges[0]?.node;
          const isAdding = addingProductId === product.id;

          return (
            <div
              key={product.id}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                transition: "transform 0.2s, box-shadow 0.2s",
                background: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 16px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 6px rgba(0, 0, 0, 0.1)";
              }}
            >
              <div
                style={{
                  position: "relative",
                  paddingBottom: "75%",
                  overflow: "hidden",
                }}
              >
                <img
                  src={getImageUrl(product)}
                  alt={product.title}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {!product.availableForSale && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "#dc3545",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    SOLD OUT
                  </div>
                )}
              </div>

              <div style={{ padding: "20px" }}>
                <h3
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    lineHeight: "1.3",
                    height: "50px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {product.title}
                </h3>

                <div style={{ marginBottom: "15px" }}>
                  {firstVariant?.compareAtPrice && (
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        textDecoration: "line-through",
                        marginRight: "8px",
                      }}
                    >
                      {formatPrice(firstVariant.compareAtPrice.amount)}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#007bff",
                    }}
                  >
                    {firstVariant
                      ? formatPrice(firstVariant.price.amount)
                      : "Price unavailable"}
                  </span>
                </div>

                <p
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: "14px",
                    color: "#666",
                    lineHeight: "1.4",
                    height: "40px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {product.description || "No description available"}
                </p>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={
                    !product.availableForSale ||
                    !firstVariant?.availableForSale ||
                    isAdding ||
                    cartLoading
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    background:
                      product.availableForSale && firstVariant?.availableForSale
                        ? "#007bff"
                        : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor:
                      product.availableForSale &&
                      firstVariant?.availableForSale &&
                      !isAdding
                        ? "pointer"
                        : "not-allowed",
                    transition: "background-color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    if (
                      product.availableForSale &&
                      firstVariant?.availableForSale &&
                      !isAdding
                    ) {
                      e.currentTarget.style.backgroundColor = "#0056b3";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      product.availableForSale &&
                      firstVariant?.availableForSale &&
                      !isAdding
                    ) {
                      e.currentTarget.style.backgroundColor = "#007bff";
                    }
                  }}
                >
                  {isAdding ? (
                    <>
                      <FiLoader
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Adding...
                    </>
                  ) : !product.availableForSale ||
                    !firstVariant?.availableForSale ? (
                    "Out of Stock"
                  ) : (
                    <>
                      <FiShoppingCart />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasNextPage && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={loadMore}
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
            {loading ? (
              <>
                <FiLoader
                  style={{
                    animation: "spin 1s linear infinite",
                    marginRight: "8px",
                  }}
                />
                Loading...
              </>
            ) : (
              "Load More Products"
            )}
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ShopifyProductsPage;
