// src/pages/BundlePage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../styles/bundle.module.css";
import { useCart } from "../context/CartContext";

interface Product {
  id: string;
  title: string;
  price: string;
  images: {
    main: string;
    hover?: string;
  };
  weight: string;
}

const BundlePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  const BUNDLE_LIMIT = 7;
  const BUNDLE_PRICE = 499;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products or specific bundle-eligible products
        const response = await axios.get("/api/products?bundle=true");

        if (response.data && Array.isArray(response.data)) {
          setProducts(
            response.data.map((product: any) => ({
              id: product.id || product._id,
              title: product.title,
              price: product.price.toString(),
              images: {
                main: product.images?.[0] || "/images/product-placeholder.png",
                hover: product.images?.[1] || product.images?.[0],
              },
              weight: product.weight || "40 GM",
            }))
          );
        } else if (response.data && response.data.products) {
          setProducts(
            response.data.products.map((product: any) => ({
              id: product.id || product._id,
              title: product.title,
              price: product.price.toString(),
              images: {
                main: product.images?.[0] || "/images/product-placeholder.png",
                hover: product.images?.[1] || product.images?.[0],
              },
              weight: product.weight || "40 GM",
            }))
          );
        }

        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch bundle products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductSelect = (product: Product) => {
    // Check if product is already selected
    const isSelected = selectedProducts.some((p) => p.id === product.id);

    if (isSelected) {
      // Remove product from selection
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      // Add product to selection if under limit
      if (selectedProducts.length < BUNDLE_LIMIT) {
        setSelectedProducts((prev) => [...prev, product]);
      }
    }
  };

  const isProductSelected = (id: string) => {
    return selectedProducts.some((p) => p.id === id);
  };

  const handleAddBundleToCart = () => {
    if (selectedProducts.length !== BUNDLE_LIMIT) {
      alert(`Please select exactly ${BUNDLE_LIMIT} products for the bundle.`);
      return;
    }

    // Add each product individually but mark them as part of a bundle
    const bundleId = `bundle-${Date.now()}`;

    // Add each product individually
    selectedProducts.forEach((product) => {
      const bundleProduct = {
        id: product.id,
        title: product.title,
        price: (BUNDLE_PRICE / BUNDLE_LIMIT).toString(), // Divide bundle price equally
        images: product.images,
        weight: product.weight,
        isBundleItem: true,
        bundleId: bundleId, // Add reference to the bundle
        originalPrice: product.price, // Store original price for reference
      };

      addToCart(bundleProduct);
    });

    // Clear selections after adding to cart
    setSelectedProducts([]);

    // Show success message
    alert("Bundle items added to cart successfully!");
  };

  if (loading) {
    return <div className={styles.loading}>Loading bundle products...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const remainingItems = BUNDLE_LIMIT - selectedProducts.length;

  return (
    <div className={styles.bundlePage}>
      <div className={styles.bundleHeader}>
        <h1 className={styles.bundleTitle}>Get a discount!</h1>
        <p className={styles.bundleDescription}>
          Buy these products together and get a discount!
        </p>
      </div>

      <div className={styles.productGrid}>
        {products.map((product) => (
          <div
            key={product.id}
            className={`${styles.productCard} ${
              isProductSelected(product.id) ? styles.selected : ""
            }`}
            onClick={() => handleProductSelect(product)}
          >
            <div className={styles.productImageContainer}>
              <img
                src={product.images.main}
                alt={product.title}
                className={styles.productImage}
              />
            </div>
            <div className={styles.productInfo}>
              <h3 className={styles.productTitle}>{product.title}</h3>
              <div className={styles.productWeight}>{product.weight}</div>
              <p className={styles.productPrice}>₹{product.price}</p>
            </div>
            <button
              className={`${styles.addToBundleButton} ${
                isProductSelected(product.id) ? styles.addedToBundleButton : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleProductSelect(product);
              }}
            >
              {isProductSelected(product.id)
                ? "Remove from bundle"
                : "Add to bundle"}
            </button>
          </div>
        ))}
      </div>

      {/* Floating bundle notification */}
      {selectedProducts.length > 0 && (
        <div className={styles.bundleNotification}>
          <div className={styles.bundlePreview}>
            {selectedProducts.map((product) => (
              <div key={product.id} className={styles.bundlePreviewItem}>
                <img
                  src={product.images.main}
                  alt={product.title}
                  className={styles.bundlePreviewImage}
                />
              </div>
            ))}
          </div>
          <div className={styles.bundleNotificationBar}>
            <div className={styles.bundleNotificationText}>
              Your bundle needs {remainingItems} more item
              {remainingItems !== 1 ? "s" : ""}.
            </div>
            {remainingItems === 0 && (
              <button
                className={styles.completeBundleButton}
                onClick={handleAddBundleToCart}
              >
                Complete Bundle - ₹{BUNDLE_PRICE}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BundlePage;
