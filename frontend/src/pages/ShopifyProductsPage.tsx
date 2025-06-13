// src/pages/ShopifyProductsPage.tsx
import React, { useState } from "react";
import { useShopifyProducts } from "../hooks/useShopifyProducts";
import { useShopifyCart } from "../context/ShopifyCartContext";
import type { ShopifyProduct } from "../api/shopifyApi";
import {
  FiShoppingCart,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

const ShopifyProductsPage: React.FC = () => {
  const { products, loading, error, hasNextPage, loadMore, refetch } =
    useShopifyProducts(12);
  const { addToCart, loading: cartLoading } = useShopifyCart();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  // Enhanced price formatting with better error handling
  const formatPrice = (
    amount: string | number,
    currencyCode: string = "INR"
  ): string => {
    try {
      const numericAmount =
        typeof amount === "string" ? parseFloat(amount) : amount;

      if (isNaN(numericAmount) || numericAmount < 0) {
        console.warn("⚠️ Invalid price amount:", amount);
        return "Price unavailable";
      }

      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch (error) {
      console.error("❌ Error formatting price:", error);
      return "Price unavailable";
    }
  };

  // Enhanced image URL extraction
  const getImageUrl = (product: ShopifyProduct): string => {
    const imageUrl = product.images?.edges?.[0]?.node?.url;

    if (imageUrl && imageUrl.startsWith("http")) {
      return imageUrl;
    }

    console.warn("⚠️ No valid image found for product:", product.title);
    return "/api/placeholder/300/300";
  };

  // Enhanced product validation
  const getProductInfo = (product: ShopifyProduct) => {
    const firstVariant = product.variants?.edges?.[0]?.node;

    // Enhanced availability check
    const productAvailable = product.availableForSale ?? false;
    const variantAvailable = firstVariant?.availableForSale ?? false;
    const hasVariantId = !!firstVariant?.id;
    const isAvailable = productAvailable && variantAvailable && hasVariantId;

    // Enhanced price extraction
    let currentPrice = "Price unavailable";
    let comparePrice: string | null = null;

    if (firstVariant?.price?.amount) {
      currentPrice = formatPrice(
        firstVariant.price.amount,
        firstVariant.price.currencyCode || "INR"
      );

      if (firstVariant.compareAtPrice?.amount) {
        comparePrice = formatPrice(
          firstVariant.compareAtPrice.amount,
          firstVariant.compareAtPrice.currencyCode || "INR"
        );
      }
    }

    console.log("🔍 Product Info Debug:", {
      title: product.title,
      isAvailable,
      productAvailable,
      variantAvailable,
      hasVariantId,
      currentPrice,
      comparePrice,
      variantId: firstVariant?.id,
    });

    return {
      firstVariant,
      isAvailable,
      currentPrice,
      comparePrice,
    };
  };

  const handleAddToCart = async (product: ShopifyProduct) => {
    const { firstVariant, isAvailable } = getProductInfo(product);

    if (!firstVariant?.id) {
      console.error("❌ No variant ID available for:", product.title);
      alert("Product variant not available");
      return;
    }

    if (!isAvailable) {
      console.warn("⚠️ Product not available:", product.title);
      alert("This product is currently out of stock");
      return;
    }

    setAddingProductId(product.id);

    try {
      console.log("🛒 Adding to cart:", {
        productTitle: product.title,
        variantId: firstVariant.id,
        quantity: 1,
      });

      await addToCart(firstVariant.id, 1);
      console.log("✅ Successfully added to cart:", product.title);
    } catch (err) {
      console.error("❌ Failed to add to cart:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add product to cart";
      alert(`Error: ${errorMessage}`);
    } finally {
      setAddingProductId(null);
    }
  };

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          fontSize: "18px",
          gap: "20px",
        }}
      >
        <FiLoader
          style={{ animation: "spin 1s linear infinite", fontSize: "32px" }}
        />
        <div>Loading products...</div>
        <div style={{ fontSize: "14px", color: "#666" }}>
          This may take a few moments
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          color: "#dc3545",
          fontSize: "18px",
          gap: "20px",
        }}
      >
        <FiAlertCircle style={{ fontSize: "48px" }} />
        <div>Error loading products</div>
        <div
          style={{ fontSize: "14px", textAlign: "center", maxWidth: "400px" }}
        >
          {error}
        </div>
        <button
          onClick={refetch}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiRefreshCw />
          Try Again
        </button>
      </div>
    );
  }

  // No products state
  if (!loading && products.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          fontSize: "18px",
          gap: "20px",
        }}
      >
        <div>No products found</div>
        <div
          style={{
            fontSize: "14px",
            color: "#666",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          It looks like there are no products available in your Shopify store,
          or they haven't been published to the storefront API yet.
        </div>
        <button
          onClick={refetch}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiRefreshCw />
          Refresh
        </button>
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

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          <strong>Debug Info:</strong> {products.length} products loaded
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "30px",
          marginBottom: "40px",
        }}
      >
        {products.map((product) => {
          const { firstVariant, isAvailable, currentPrice, comparePrice } =
            getProductInfo(product);
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
                  onError={(e) => {
                    console.warn("⚠️ Image failed to load for:", product.title);
                    e.currentTarget.src = "/api/placeholder/300/300";
                  }}
                />

                {/* Enhanced stock badge */}
                {!isAvailable && (
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
                    {!product.availableForSale
                      ? "UNAVAILABLE"
                      : !firstVariant?.availableForSale
                      ? "OUT OF STOCK"
                      : "NOT AVAILABLE"}
                  </div>
                )}

                {/* Sale badge */}
                {comparePrice && isAvailable && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      background: "#28a745",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    SALE
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
                  {comparePrice && (
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        textDecoration: "line-through",
                        marginRight: "8px",
                      }}
                    >
                      {comparePrice}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color:
                        currentPrice === "Price unavailable"
                          ? "#dc3545"
                          : "#007bff",
                    }}
                  >
                    {currentPrice}
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

                {/* Debug info in development */}
                {process.env.NODE_ENV === "development" && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#666",
                      marginBottom: "10px",
                      padding: "5px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "3px",
                    }}
                  >
                    ID: {product.id?.split("/").pop()}
                    <br />
                    Available: {isAvailable ? "Yes" : "No"}
                    <br />
                    Variants: {product.variants?.edges?.length || 0}
                  </div>
                )}

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!isAvailable || isAdding || cartLoading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: isAvailable ? "#007bff" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor:
                      isAvailable && !isAdding ? "pointer" : "not-allowed",
                    transition: "background-color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: isAdding || cartLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (isAvailable && !isAdding) {
                      e.currentTarget.style.backgroundColor = "#0056b3";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isAvailable && !isAdding) {
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
                  ) : !isAvailable ? (
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
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: "0 auto",
            }}
          >
            {loading ? (
              <>
                <FiLoader style={{ animation: "spin 1s linear infinite" }} />
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
