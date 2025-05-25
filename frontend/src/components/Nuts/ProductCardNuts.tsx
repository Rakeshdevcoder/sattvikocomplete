// ProductCard.tsx with fixed addToCart functionality
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
    hasAntioxidants?: boolean;
    hasProbiotics?: boolean;
    weight: string;
  };
}

const ProductCardNuts: React.FC<ProductProps> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();

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

export default ProductCardNuts;
