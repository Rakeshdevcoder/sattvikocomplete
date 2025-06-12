// src/pages/ProductDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useShopifyCart } from "../context/ShopifyCartContext";
import { useShopifyProduct } from "../hooks/useShopifyProducts";
import { FiLoader } from "react-icons/fi";
import styles from "../styles/productdetail.module.css";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { product, loading, error } = useShopifyProduct(id || "");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useShopifyCart();

  // Set default image and variant when product loads
  useEffect(() => {
    if (product) {
      // Set the first image as selected by default
      if (product.images.edges.length > 0) {
        setSelectedImage(product.images.edges[0].node.url);
      }

      // Set the first available variant as selected by default
      if (product.variants.edges.length > 0) {
        setSelectedVariant(product.variants.edges[0].node);
      }
    }
  }, [product]);

  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // Handle add to cart for Shopify
  const handleAddToCart = async () => {
    if (!selectedVariant) {
      alert("Please select a product variant");
      return;
    }

    if (!selectedVariant.availableForSale) {
      alert("This product variant is currently out of stock");
      return;
    }

    setIsAddingToCart(true);

    try {
      await addToCart(selectedVariant.id, quantity);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("Failed to add product to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatPrice = (amount: string, currencyCode: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <FiLoader
          style={{ animation: "spin 1s linear infinite", marginRight: "10px" }}
        />
        Loading product details...
      </div>
    );
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
                src={selectedImage || product.images.edges[0]?.node.url}
                alt={product.title}
                className={styles.mainImage}
              />
            </div>

            <div className={styles.thumbnailsWrapper}>
              <div className={styles.thumbnailContainer}>
                {product.images.edges.map((edge, index) => (
                  <div
                    key={edge.node.id}
                    className={`${styles.thumbnail} ${
                      selectedImage === edge.node.url
                        ? styles.activeThumbnail
                        : ""
                    }`}
                    onClick={() => setSelectedImage(edge.node.url)}
                  >
                    <img
                      src={edge.node.url}
                      alt={
                        edge.node.altText ||
                        `${product.title} view ${index + 1}`
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Product Information */}
          <div className={styles.productInfo}>
            <h1 className={styles.productTitle}>{product.title}</h1>

            <div className={styles.productPrice}>
              {selectedVariant ? (
                <>
                  {selectedVariant.compareAtPrice && (
                    <span className={styles.comparePrice}>
                      {formatPrice(selectedVariant.compareAtPrice.amount)}
                    </span>
                  )}
                  <span className={styles.currentPrice}>
                    {formatPrice(selectedVariant.price.amount)}
                  </span>
                </>
              ) : (
                <span className={styles.currentPrice}>
                  {formatPrice(product.priceRange.minVariantPrice.amount)}
                </span>
              )}
            </div>

            {/* Vendor and Product Type */}
            <div className={styles.productMeta}>
              <span className={styles.vendor}>by {product.vendor}</span>
              <span className={styles.productType}>{product.productType}</span>
            </div>

            {/* Product Description */}
            {product.description && (
              <div className={styles.productDescription}>
                <p>{product.description}</p>
              </div>
            )}

            {/* Variant Selection */}
            {product.variants.edges.length > 1 && (
              <div className={styles.variantSelection}>
                <h4>Options:</h4>
                <div className={styles.variantOptions}>
                  {product.variants.edges.map(({ node: variant }) => (
                    <button
                      key={variant.id}
                      className={`${styles.variantOption} ${
                        selectedVariant?.id === variant.id
                          ? styles.selectedVariant
                          : ""
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.availableForSale}
                    >
                      {variant.title}
                      {!variant.availableForSale && (
                        <span className={styles.outOfStock}>
                          {" "}
                          (Out of Stock)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className={styles.productTags}>
                {product.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Quantity Selection */}
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

            {/* Add to Cart Button */}
            <button
              className={styles.addToCartButton}
              onClick={handleAddToCart}
              disabled={
                isAddingToCart ||
                !selectedVariant?.availableForSale ||
                !product.availableForSale
              }
              style={{
                opacity:
                  !selectedVariant?.availableForSale ||
                  !product.availableForSale ||
                  isAddingToCart
                    ? 0.6
                    : 1,
                cursor:
                  !selectedVariant?.availableForSale ||
                  !product.availableForSale ||
                  isAddingToCart
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isAddingToCart ? (
                <>
                  <FiLoader
                    style={{
                      animation: "spin 1s linear infinite",
                      marginRight: "8px",
                    }}
                  />
                  Adding to cart...
                </>
              ) : !product.availableForSale ||
                !selectedVariant?.availableForSale ? (
                "Out of Stock"
              ) : (
                "Add to cart"
              )}
            </button>

            {/* Stock Status */}
            {selectedVariant && (
              <div className={styles.stockStatus}>
                {selectedVariant.availableForSale ? (
                  selectedVariant.quantityAvailable > 0 ? (
                    <span className={styles.inStock}>
                      ✓ {selectedVariant.quantityAvailable} in stock
                    </span>
                  ) : (
                    <span className={styles.limitedStock}>✓ Available</span>
                  )
                ) : (
                  <span className={styles.outOfStock}>✗ Out of stock</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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

export default ProductDetail;
