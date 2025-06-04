// src/pages/BundlePage.tsx
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import styles from "../styles/bundle.module.css";
import { useCart } from "../context/CartContext";
import { BundleContext } from "../components/HeaderComponent";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get cart context for adding to cart
  const { addToCart } = useCart();

  // Get the bundle context instead of using local state
  const bundleContext = useContext(BundleContext);
  const selectedProducts = bundleContext.selectedProducts;
  const setSelectedProducts = bundleContext.setSelectedProducts;
  const remainingItems = bundleContext.remainingItems;

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
    const isSelected = selectedProducts.some((p: any) => p.id === product.id);

    if (isSelected) {
      // Remove product from selection
      setSelectedProducts(
        selectedProducts.filter((p: any) => p.id !== product.id)
      );
    } else {
      // Add product to selection if under limit
      if (selectedProducts.length < BUNDLE_LIMIT) {
        setSelectedProducts([...selectedProducts, product]);
      }
    }
  };

  const isProductSelected = (id: string) => {
    return selectedProducts.some((p: any) => p.id === id);
  };

  const handleAddBundleToCart = () => {
    if (selectedProducts.length !== BUNDLE_LIMIT) {
      alert(`Please select exactly ${BUNDLE_LIMIT} products for the bundle.`);
      return;
    }

    // Add each product individually but mark them as part of a bundle
    const bundleId = `bundle-${Date.now()}`;

    // Add each product individually
    selectedProducts.forEach((product: any) => {
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

  return (
    <div className={styles.bundlePage}>
      <div className={styles.bundleHeader}>
        <h1 className={styles.bundleTitle}>Complete Bundle - ₹499</h1>
        <p className={styles.bundleDescription}>
          Select any 7 products to create your discounted bundle!
        </p>

        {/* Display selection summary */}
        {selectedProducts.length > 0 && (
          <div className={styles.selectionSummary}>
            <p>
              You've selected {selectedProducts.length} item
              {selectedProducts.length !== 1 ? "s" : ""}
              {remainingItems > 0
                ? ` (need ${remainingItems} more)`
                : " - your bundle is complete!"}
            </p>
          </div>
        )}
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

      {/* Complete Bundle button at bottom of page when all items selected */}
      {selectedProducts.length === BUNDLE_LIMIT && (
        <div className={styles.completeBundleContainer}>
          <button
            className={styles.completeBundleButton}
            onClick={handleAddBundleToCart}
          >
            Complete Bundle - ₹{BUNDLE_PRICE}
          </button>
        </div>
      )}
    </div>
  );
};

export default BundlePage;
