// src/pages/ProductDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import styles from "../styles/productdetail.module.css";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);

        // Set the first image as selected by default
        if (response.data.images && response.data.images.length > 0) {
          setSelectedImage(response.data.images[0]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch product details:", err);
        setError("Failed to load product details. Please try again.");
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };
  // src/pages/ProductDetail.tsx
  // Only showing the relevant part that needs fixing

  const handleAddToCart = () => {
    if (product) {
      // Important update: ensure we're passing the correct image format and quantity
      const cartItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        // ⚠️ This is the key fix - pass the selected quantity
        quantity: quantity, // Make sure this quantity is being used when adding to cart
        image: selectedImage || product.images?.[0],
        weight: product.weight || "40 GM",
      };

      addToCart(cartItem);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading product details...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!product) {
    return <div className={styles.error}>Product not found.</div>;
  }

  // Function to render star ratings
  const renderStars = (rating: number = 5) => {
    return (
      <div className={styles.starsContainer}>
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={i < rating ? styles.starFilled : styles.starEmpty}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.productDetail}>
      <div className={styles.container}>
        <div className={styles.productGrid}>
          {/* Left side - Product Images */}
          <div className={styles.productImagesWrapper}>
            <div className={styles.mainImageContainer}>
              <img
                src={selectedImage || product.images?.[0]}
                alt={product.title}
                className={styles.mainImage}
              />
            </div>

            <div className={styles.thumbnailsWrapper}>
              <button className={styles.carouselButton}>‹</button>
              <div className={styles.thumbnailContainer}>
                {product.images?.map((image: string, index: number) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${
                      selectedImage === image ? styles.activeThumbnail : ""
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${product.title} view ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
              <button className={styles.carouselButton}>›</button>
            </div>
          </div>

          {/* Right side - Product Information */}
          <div className={styles.productInfo}>
            <h1 className={styles.productTitle}>
              {product.title} {product.weight || "40 GM"}{" "}
              {product.hasProbiotics ? "| With Probiotics" : ""}
            </h1>

            <div className={styles.productPrice}>
              <span>Rs. {product.price}</span>
            </div>

            {/* Ratings */}
            <div className={styles.ratingsContainer}>
              {renderStars(product.stars)}
              <span className={styles.reviewCount}>
                {product.reviewCount || 1} review
              </span>
            </div>

            {/* Product Features */}
            <div className={styles.productFeatures}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <span>Vegan</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </div>
                <span>Gluten Free</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
                <span>Sustainable</span>
              </div>
            </div>

            <div className={styles.quantitySection}>
              <div className={styles.quantityLabel}>
                Quantity ({quantity} in cart)
              </div>
              <div className={styles.quantityControls}>
                <button
                  className={styles.quantityButton}
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="text"
                  value={quantity}
                  readOnly
                  className={styles.quantityInput}
                />
                <button
                  className={styles.quantityButton}
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className={styles.addToCartButton}
              onClick={handleAddToCart}
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
