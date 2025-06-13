// src/components/ProductCard.tsx - IMPROVED VERSION
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

  // Get the first available variant
  const firstVariant = product.variants.edges[0]?.node;
  const isAvailable =
    product.availableForSale && firstVariant?.availableForSale;

  // Get product images
  const mainImage =
    product.images.edges[0]?.node.url ||
    "https://via.placeholder.com/300x300?text=Product";
  const hoverImage = product.images.edges[1]?.node.url || mainImage;

  // Format price using Intl for proper currency formatting
  const formatPrice = (amount: string, currencyCode: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  // Get display price
  const getDisplayPrice = () => {
    if (!firstVariant) return "Price unavailable";

    const currentPrice = formatPrice(
      firstVariant.price.amount,
      firstVariant.price.currencyCode
    );
    const comparePrice = firstVariant.compareAtPrice
      ? formatPrice(
          firstVariant.compareAtPrice.amount,
          firstVariant.compareAtPrice.currencyCode
        )
      : null;

    return { currentPrice, comparePrice };
  };

  const { currentPrice, comparePrice } = getDisplayPrice();

  // Handle add to cart
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if card is wrapped in a link

    if (!firstVariant || !isAvailable) {
      console.warn("Product variant not available:", product.title);
      return;
    }

    setIsAddingToCart(true);

    try {
      await addToCart(firstVariant.id, 1);

      // Optional: Show success feedback
      console.log("✅ Added to cart:", product.title);
    } catch (error) {
      console.error("Failed to add to cart:", error);

      // Optional: Show error feedback to user
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add to cart";
      alert(`Error: ${errorMessage}`);
    } finally {
      // Reset button state after a delay for UX feedback
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 1000);
    }
  };

  // Generate product URL
  const productUrl = `/products/${product.handle}`;

  // Create a clean product title (you may want to customize this based on your needs)
  const displayTitle = product.title;

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
              alt={product.title}
              className={styles.productImage}
              loading="lazy"
              onError={(e) => {
                // Fallback image if main image fails to load
                e.currentTarget.src =
                  "https://via.placeholder.com/300x300?text=Product";
              }}
            />
          </a>

          {/* Out of Stock Badge */}
          {!isAvailable && (
            <div className={styles.outOfStockBadge}>Out of Stock</div>
          )}

          {/* Sale Badge */}
          {comparePrice && <div className={styles.saleBadge}>Sale</div>}
        </div>

        {/* Product Content */}
        <div className={styles.contentContainer}>
          {/* Product Title */}
          <div className={styles.titleContainer}>
            <h3 className={styles.cardHeading}>
              <a href={productUrl} className={styles.productLink}>
                {displayTitle}
              </a>
            </h3>
          </div>

          {/* Vendor/Brand */}
          {product.vendor && (
            <div className={styles.vendor}>by {product.vendor}</div>
          )}

          {/* Price Container */}
          <div className={styles.priceContainer}>
            {comparePrice && (
              <span className={styles.comparePrice}>{comparePrice}</span>
            )}
            <span className={styles.currentPrice}>{currentPrice}</span>
          </div>

          {/* Product Tags (optional) */}
          {product.tags.length > 0 && (
            <div className={styles.tagsContainer}>
              {product.tags.slice(0, 2).map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Variant Options Info (optional) */}
          {product.variants.edges.length > 1 && (
            <div className={styles.variantInfo}>
              {product.variants.edges.length} options available
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
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
                : `Add ${product.title} to cart`
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
