// ProductCardVegan.tsx with proper feature support
import React, { useState } from "react";
import styles from "../../styles/productcard.module.css";
import { useCart } from "../../context/CartContext";

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
    isGlutenFree?: boolean;
    isHighFibre?: boolean;
    isGutHealth?: boolean;
    isVegan?: boolean;
    isHighProtein?: boolean;
    weight: string;
  };
}

const ProductCardFibre: React.FC<ProductProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();

  // Format the product title to match the desired display with appropriate features
  const formatTitle = () => {
    let title = product.title;
    let additionalInfo = "";

    // Build features string
    const features = [];
    if (product.isVegan) features.push("Vegan");
    if (product.isGlutenFree) features.push("Gluten-Free");
    if (product.isHighFibre) features.push("High-Fibre");
    if (product.isGutHealth) features.push("Gut-Health");
    if (product.isHighProtein) features.push("High-Protein");

    // Add features to title if any exist
    if (features.length > 0) {
      additionalInfo = ` | ${features.join(", ")}`;
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
                i < Math.round(product.rating!)
                  ? styles.starFilled
                  : styles.starEmpty
              }
            >
              ★
            </span>
          ))}
        </div>
        {product.reviewCount && (
          <span className={styles.reviewCount}>
            {product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  };

  // Handle add to cart
  const handleAddToCart = () => {
    setIsAddingToCart(true);

    // Important: Format the product object to match exactly what CartContext expects
    const cartProduct = {
      id: product.id,
      title: product.title,
      price: product.price,
      images: {
        main: product.images.main,
      },
      weight: product.weight,
      // Optionally pass the feature flags if your cart needs them
      isVegan: product.isVegan,
      isGlutenFree: product.isGlutenFree,
      isHighFibre: product.isHighFibre,
      isGutHealth: product.isGutHealth,
      isHighProtein: product.isHighProtein,
    };

    addToCart(cartProduct);

    // Reset button state after a short delay
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000);
  };

  // Render feature badges if needed
  const renderFeatureBadges = () => {
    if (!product.isVegan && !product.isGlutenFree && !product.isHighProtein) {
      return null;
    }

    return (
      <div className={styles.featureBadges}>
        {product.isVegan && <span className={styles.badge}>Vegan</span>}
        {product.isGlutenFree && (
          <span className={styles.badge}>Gluten-Free</span>
        )}
        {product.isHighProtein && (
          <span className={styles.badge}>High Protein</span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.cardWrapper}>
      <div
        className={styles.card}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a href={`/products/${product.id}`} className={styles.imageLink}>
          <div className={styles.imageContainer}>
            <img
              src={
                isHovered && product.images.hover
                  ? product.images.hover
                  : product.images.main
              }
              alt={formattedTitle}
              className={styles.productImage}
              loading="lazy"
            />
            {renderFeatureBadges()}
          </div>
        </a>

        <div className={styles.contentContainer}>
          <div className={styles.titleContainer}>
            <h3 className={styles.cardHeading}>
              <a
                href={`/products/${product.id}`}
                className={styles.productLink}
              >
                {formattedTitle}
              </a>
            </h3>
          </div>

          {product.rating && product.rating > 0 && (
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
            disabled={isAddingToCart}
          >
            {isAddingToCart ? "Added to cart" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardFibre;
