// src/pages/BundlePage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../styles/bundle.module.css";

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
      </div>

      <div className={styles.productGrid}>
        {products.map((product) => (
          <div key={product.id} className={styles.productCard}>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default BundlePage;
