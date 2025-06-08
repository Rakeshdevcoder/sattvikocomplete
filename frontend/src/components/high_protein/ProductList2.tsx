// ProductList2.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "./ProductCardHighProtein";
import styles from "../../styles/makhanas/productlist.module.css";

// Use the proxied API URL
const API_BASE_URL = "/api";

interface Product {
  id: string;
  title: string;
  price: number;
  regularPrice: number;
  salesPrice: number;
  stars: number;
  reviewCount: number;
  images: string[];
  features: string[];
  weight: string;
  category: string;
}

export interface ProductCardProps {
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
}

interface ProductListProps {
  category?: string;
  features?: string[]; // Array of features
  feature?: string; // Single feature (for compatibility)
  limit?: number;
}

const ProductList2: React.FC<ProductListProps> = ({
  category,
  features = [],
  feature,
  limit = 8,
}) => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Maps raw API data into ProductCardProps and updates state
    function mapAndSetProducts(productsData: any[]) {
      if (!Array.isArray(productsData)) {
        console.error("productsData is not an array:", productsData);
        setProducts([]);
        return;
      }

      // 1. Remove any null/undefined entries
      const nonNullData = productsData.filter(
        (p): p is Record<string, any> => p != null
      );

      // 2. Map directly to ProductCardProps
      const mappedProducts: ProductCardProps[] = nonNullData.map((product) => {
        const productId = (product.id || product._id || "").toString();
        const productFeatures = Array.isArray(product.features)
          ? product.features.map((f: string) => f.toLowerCase())
          : [];
        const displayPrice =
          product.salesPrice > 0
            ? product.salesPrice
            : product.regularPrice || product.price || 0;

        return {
          id: productId,
          title: product.title || product.name || "Product",
          price: displayPrice.toString(),
          rating: product.stars > 0 ? product.stars : undefined,
          reviewCount:
            product.reviewCount > 0 ? product.reviewCount : undefined,
          images: {
            main: product.images?.[0] ?? "/images/product-placeholder.png",
            hover:
              product.images?.[1] ??
              product.images?.[0] ??
              "/images/product-placeholder.png",
          },
          isGlutenFree: productFeatures.includes("gluten-free"),
          isHighFibre: productFeatures.includes("high-fibre"),
          isGutHealth: productFeatures.includes("gut-health"),
          isVegan: productFeatures.includes("vegan"),
          isHighProtein: productFeatures.includes("high-protein"),
          weight: product.weight || "40 GM",
        };
      });

      // 3. Apply feature filtering client-side if needed
      let filteredProducts = mappedProducts;
      const allFeatures = [...(features || []), ...(feature ? [feature] : [])];

      if (allFeatures.length > 0) {
        filteredProducts = mappedProducts.filter((p) =>
          allFeatures.some((feat) => {
            switch (feat.toLowerCase()) {
              case "gluten-free":
                return p.isGlutenFree;
              case "high-fibre":
                return p.isHighFibre;
              case "gut-health":
                return p.isGutHealth;
              case "vegan":
                return p.isVegan;
              case "high-protein":
                return p.isHighProtein;
              default:
                return false;
            }
          })
        );
      }

      // 4. Apply the limit
      const limitedProducts = limit
        ? filteredProducts.slice(0, limit)
        : filteredProducts;

      // 5. Update state with a guaranteed ProductCardProps[]
      setProducts(limitedProducts);
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log("Attempting to fetch products...");

        const queryParams = new URLSearchParams();

        // Add category if provided
        if (category) queryParams.append("category", category);

        // Handle both feature and features props
        if (feature) {
          // Add single feature as in ProductList.tsx
          queryParams.append("feature", feature);
        }

        // If features array is provided, use it both ways:
        // 1. As a single comma-separated feature string (most common API approach)
        if (features && features.length > 0) {
          queryParams.append("feature", features.join(","));

          // 2. Also try individual feature parameters (alternative API approach)
          features.forEach((f) => queryParams.append("features", f));
        }

        const url = `${API_BASE_URL}/products?${queryParams.toString()}`;
        console.log("Request URL:", url);

        const response = await axios.get(url, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        console.log("Response data:", response.data);

        if (!response.data) {
          console.error("API returned null data");
          setProducts([]);
          setError("No products data returned from API");
          return;
        }

        if (Array.isArray(response.data)) {
          mapAndSetProducts(response.data);
        } else {
          mapAndSetProducts(response.data.products || []);
        }

        setError(null);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        if (axios.isAxiosError(err)) {
          console.error("API Error Details:", {
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
          });
        }
        setError(`Failed to load products: ${err.message}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, features, feature, limit]);

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className={styles.noProducts}>
        No products found for the selected criteria.
      </div>
    );
  }

  return (
    <div className={styles.productGrid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList2;
