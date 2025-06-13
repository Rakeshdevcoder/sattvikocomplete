// src/components/ProductCard.tsx
import React, { useState } from "react";
import styles from "../styles/productcard.module.css";
import { useShopifyCart } from "../context/ShopifyCartContext";
import type { ShopifyProduct } from "../api/shopifyApi";

interface ProductCardProps {
  product: ShopifyProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useShopifyCart();

  // Enhanced debug logging
  console.log("🔍 ProductCard Debug - Full Product Data:", {
    id: product?.id,
    title: product?.title,
    availableForSale: product?.availableForSale,
    images: product?.images?.edges?.length || 0,
    variants: product?.variants?.edges?.length || 0,
    firstVariant: product?.variants?.edges?.[0]?.node,
    priceRange: product?.priceRange,
  });

  // Better placeholder image
  const PLACEHOLDER_IMAGE = "/api/placeholder/300/300";

  // Safely check if product exists
  if (!product) {
    console.warn("❌ ProductCard: No product data provided");
    return null;
  }

  // Get the first variant with enhanced safety checks
  const firstVariant = product.variants?.edges?.[0]?.node;

  // Enhanced availability check with detailed logging
  const productAvailable = product.availableForSale ?? false;
  const variantAvailable = firstVariant?.availableForSale ?? false;
  const hasVariantId = !!firstVariant?.id;
  const isAvailable = productAvailable && variantAvailable && hasVariantId;

  console.log("🔍 Availability Check:", {
    productTitle: product.title,
    productAvailable,
    variantAvailable,
    hasVariantId,
    finalAvailable: isAvailable,
    variantId: firstVariant?.id,
  });

  // Enhanced image handling
  const getProductImage = (index: number = 0): string => {
    const imageUrl = product.images?.edges?.[index]?.node?.url;
    if (imageUrl && imageUrl.startsWith("http")) {
      return imageUrl;
    }
    console.warn(`⚠️ Invalid or missing image for ${product.title}:`, imageUrl);
    return PLACEHOLDER_IMAGE;
  };

  const mainImage = getProductImage(0);
  const hoverImage =
    getProductImage(1) !== PLACEHOLDER_IMAGE ? getProductImage(1) : mainImage;

  console.log("🖼️ Image URLs:", {
    mainImage,
    hoverImage,
    totalImages: product.images?.edges?.length || 0,
  });

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
      console.error("❌ Error formatting price:", error, {
        amount,
        currencyCode,
      });
      return "Price unavailable";
    }
  };

  // Enhanced price extraction with multiple fallbacks
  const getPriceInfo = () => {
    // Try variant price first
    if (firstVariant?.price?.amount) {
      const currentPrice = formatPrice(
        firstVariant.price.amount,
        firstVariant.price.currencyCode || "INR"
      );

      const comparePrice = firstVariant.compareAtPrice?.amount
        ? formatPrice(
            firstVariant.compareAtPrice.amount,
            firstVariant.compareAtPrice.currencyCode || "INR"
          )
        : null;

      console.log("💰 Price from variant:", { currentPrice, comparePrice });
      return { currentPrice, comparePrice };
    }

    // Fallback to price range
    if (product.priceRange?.minVariantPrice?.amount) {
      const currentPrice = formatPrice(
        product.priceRange.minVariantPrice.amount,
        product.priceRange.minVariantPrice.currencyCode || "INR"
      );

      console.log("💰 Price from range:", { currentPrice });
      return { currentPrice, comparePrice: null };
    }

    console.warn("⚠️ No price found for product:", product.title);
    return { currentPrice: "Price unavailable", comparePrice: null };
  };

  const { currentPrice, comparePrice } = getPriceInfo();

  // Enhanced cart handling
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!firstVariant?.id) {
      console.error("❌ No variant ID available for:", product.title);
      alert("Product variant not available");
      return;
    }

    if (!isAvailable) {
      console.warn("⚠️ Product not available:", {
        productTitle: product.title,
        productAvailable,
        variantAvailable,
        hasVariantId,
      });
      alert("This product is currently out of stock");
      return;
    }

    setIsAddingToCart(true);

    try {
      console.log("🛒 Adding to cart:", {
        productTitle: product.title,
        variantId: firstVariant.id,
        quantity: 1,
      });

      await addToCart(firstVariant.id, 1);
      console.log("✅ Successfully added to cart:", product.title);
    } catch (error) {
      console.error("❌ Failed to add to cart:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add to cart";
      alert(`Error: ${errorMessage}`);
    } finally {
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 1000);
    }
  };

  // Enhanced image error handling
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn("⚠️ Image failed to load:", e.currentTarget.src);
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log("✅ Image loaded successfully:", e.currentTarget.src);
  };

  // Generate product URL
  const productUrl = `/products/${product.handle || product.id}`;

  return (
    <div className={styles.cardWrapper}>
      <div
        className={styles.card}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image */}
        <div className={styles.imageContainer}>
          <a href={productUrl} className={styles.imageLink}>
            <img
              src={isHovered ? hoverImage : mainImage}
              alt={product.title || "Product"}
              className={styles.productImage}
              loading="lazy"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </a>

          {/* Enhanced Stock Badge */}
          {!isAvailable && (
            <div className={styles.outOfStockBadge}>
              {!productAvailable
                ? "Unavailable"
                : !variantAvailable
                ? "Out of Stock"
                : "Not Available"}
            </div>
          )}

          {/* Sale Badge */}
          {comparePrice && isAvailable && (
            <div className={styles.saleBadge}>Sale</div>
          )}
        </div>

        {/* Product Content */}
        <div className={styles.contentContainer}>
          {/* Product Title */}
          <div className={styles.titleContainer}>
            <h3 className={styles.cardHeading}>
              <a href={productUrl} className={styles.productLink}>
                {product.title || "Untitled Product"}
              </a>
            </h3>
          </div>

          {/* Vendor/Brand */}
          {product.vendor && (
            <div className={styles.vendor}>by {product.vendor}</div>
          )}

          {/* Enhanced Price Container */}
          <div className={styles.priceContainer}>
            {comparePrice && (
              <span className={styles.comparePrice}>{comparePrice}</span>
            )}
            <span
              className={styles.currentPrice}
              style={{
                color:
                  currentPrice === "Price unavailable" ? "#dc3545" : undefined,
              }}
            >
              {currentPrice}
            </span>
          </div>

          {/* Product Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className={styles.tagsContainer}>
              {product.tags.slice(0, 2).map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Enhanced Variant Info */}
          {product.variants?.edges && product.variants.edges.length > 1 && (
            <div className={styles.variantInfo}>
              {product.variants.edges.length} options available
            </div>
          )}

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === "development" && (
            <div style={{ fontSize: "10px", color: "#666", marginTop: "5px" }}>
              ID: {product.id?.split("/").pop()}
              <br />
              Available: {isAvailable ? "Yes" : "No"}
              <br />
              Variants: {product.variants?.edges?.length || 0}
            </div>
          )}
        </div>

        {/* Enhanced Add to Cart Button */}
        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={`${styles.addToCartButton} ${
              isAddingToCart ? styles.addedToCart : ""
            } ${!isAvailable ? styles.disabled : ""}`}
            onClick={handleAddToCart}
            disabled={isAddingToCart || !isAvailable}
            aria-label={
              isAddingToCart
                ? "Adding to cart..."
                : !isAvailable
                ? "Product unavailable"
                : `Add ${product.title || "product"} to cart`
            }
          >
            <span>
              {isAddingToCart
                ? "Added to cart!"
                : !isAvailable
                ? "Unavailable"
                : "Add to cart"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
