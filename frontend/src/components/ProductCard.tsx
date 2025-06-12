import React, { useState } from "react";
import styles from "../styles/productcard.module.css";
import { useShopifyCart } from "../context/ShopifyCartContext";

interface ProductProps {
  product: {
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
    // Add Shopify variant info for proper cart integration
    shopifyVariantId?: string;
    handle?: string;
  };
}

const ProductCard: React.FC<ProductProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useShopifyCart();

  // Format the product title to match the desired display
  const formatTitle = () => {
    let title = product.title;
    let additionalInfo = "";

    if (product.hasProbiotics) {
      additionalInfo = " | With Probiotics";
    } else if (product.hasAntioxidants) {
      additionalInfo = " | With Anti Oxidants";
    }

    return `${title} ${product.weight}${additionalInfo}`;
  };

  const formattedTitle = formatTitle();

  // Function to render star ratings
  const renderStars = () => {
    if (!product.rating) return null;

    return (
      <div className={styles.rating}>
        <div className={styles.stars}>
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={
                i < product.rating! ? styles.starFilled : styles.starEmpty
              }
            >
              ★
            </span>
          ))}
        </div>
        {product.reviewCount && (
          <p className={styles.reviewCount}>({product.reviewCount})</p>
        )}
      </div>
    );
  };

  // Handle add to cart for Shopify
  const handleAddToCart = async () => {
    if (!product.shopifyVariantId) {
      console.error("No Shopify variant ID found for product:", product.id);
      alert("Unable to add product to cart. Please try again.");
      return;
    }

    setIsAddingToCart(true);

    try {
      await addToCart(product.shopifyVariantId, 1);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("Failed to add product to cart. Please try again.");
    } finally {
      // Reset button state after a short delay
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 1000);
    }
  };

  return (
    <div className={styles.cardWrapper}>
      <div
        className={styles.card}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.imageContainer}>
          <img
            src={isHovered ? product.images.hover : product.images.main}
            alt={formattedTitle}
            className={styles.productImage}
            loading="lazy"
          />
        </div>

        <div className={styles.contentContainer}>
          <div className={styles.titleContainer}>
            <h3 className={styles.cardHeading}>
              <a
                href={
                  product.handle
                    ? `/products/${product.handle}`
                    : `/products/${product.id}`
                }
                className={styles.productLink}
              >
                {formattedTitle}
              </a>
            </h3>
          </div>

          {product.rating && (
            <div className={styles.ratingContainer}>{renderStars()}</div>
          )}

          <div className={styles.price}>
            <span className={styles.priceRegular}>Rs. {product.price}</span>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={`${styles.addToCartButton} ${
              isAddingToCart ? styles.addedToCart : ""
            }`}
            onClick={handleAddToCart}
            disabled={isAddingToCart || !product.shopifyVariantId}
          >
            <span>
              {isAddingToCart
                ? "Added to cart"
                : !product.shopifyVariantId
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
