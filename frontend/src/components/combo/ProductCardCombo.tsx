// ProductCardCombo.tsx with navigation to product detail
import React, { useState } from "react";
import styles from "../../styles/productcard.module.css";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom"; // CHANGE: Added useNavigate for programmatic navigation

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
  };
}

const ProductCardCombo: React.FC<ProductProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate(); // CHANGE: Added navigate hook

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

  // CHANGE: Added handleCardClick function for card click navigation
  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    // CHANGE: Added event parameter and stopPropagation to prevent navigation when clicking the button
    e.stopPropagation();
    setIsAddingToCart(true);

    // Important: Format the product object to match exactly what CartContext expects
    const cartProduct = {
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images.main, // CHANGE: Simplified to match CartContext expectations
      weight: product.weight,
      quantity: 1, // CHANGE: Added explicit quantity
    };

    addToCart(cartProduct);

    // Reset button state after a short delay
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000);
  };

  return (
    <div className={styles.cardWrapper}>
      <div
        className={styles.card}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick} // CHANGE: Added onClick to make entire card clickable
        style={{ cursor: "pointer" }} // CHANGE: Added cursor style to indicate clickable
      >
        {/* CHANGE: Removed Link wrapper since entire card is now clickable */}
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
        </div>

        <div className={styles.contentContainer}>
          <div className={styles.titleContainer}>
            <h3 className={styles.cardHeading}>
              {/* CHANGE: Removed anchor tag since entire card is clickable */}
              {formattedTitle}
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
            onClick={handleAddToCart} // CHANGE: Now passes the event to stop propagation
            disabled={isAddingToCart}
          >
            {isAddingToCart ? "Added to cart" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardCombo;
