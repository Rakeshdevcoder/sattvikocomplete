// ProductList.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "./ProductCardAll"; // Adjust this import as needed
import styles from "../styles/makhanas/productlist.module.css";

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

interface ProductCardProps {
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
}

interface ProductListProps {
  category?: string;
  categories?: string[];
  feature?: string;
  limit?: number;
  fetchAll?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  category, // No default - if undefined, will fetch all products
  categories, // Array of categories to fetch
  feature,
  limit = 8, // Default limit
  fetchAll = false, // New prop to explicitly fetch all products
}) => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log("Attempting to fetch products...");

        // Build the query parameters
        let queryParams = new URLSearchParams();

        // Handle category filtering
        if (!fetchAll) {
          if (category) {
            queryParams.append("category", category);
          } else if (categories && categories.length > 0) {
            // Join multiple categories with commas for API
            queryParams.append("category", categories.join(","));
          }
        }

        // Add feature filter if provided
        if (feature) queryParams.append("feature", feature);

        // The full URL being requested (through proxy)
        const url = `${API_BASE_URL}/products?${queryParams.toString()}`;
        console.log("Request URL:", url);

        // Make the request with axios
        const response = await axios.get(url, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        console.log("Response data:", response.data);

        // Check if we got an array of products or an object with products
        let productsData;
        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (
          response.data.products &&
          Array.isArray(response.data.products)
        ) {
          productsData = response.data.products;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
        } else {
          throw new Error("Unexpected response format");
        }

        // Map and set the products
        mapAndSetProducts(productsData);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching products:", err);

        // Enhanced error logging
        if (axios.isAxiosError(err)) {
          console.error("API Error Details:", {
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
          });
        }

        setError(`Failed to load products: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const mapAndSetProducts = (productsData: any[]) => {
      const mappedProducts: ProductCardProps[] = productsData.map(
        (product: any) => {
          // Ensure product ID is a string (handle MongoDB ObjectIDs)
          const productId = product.id || product._id || "";

          // Handle cases where features might be undefined
          const features = product.features || [];

          // Determine if product has antioxidants or probiotics based on features
          const hasAntioxidants = features.includes("antioxidants") || false;
          const hasProbiotics = features.includes("probiotics") || false;

          // Format price - use salesPrice if available, otherwise regularPrice or price
          const displayPrice =
            product.salesPrice && product.salesPrice > 0
              ? product.salesPrice
              : product.regularPrice || product.price || 0;

          return {
            id: productId.toString(), // Convert to string if it's not already
            title: product.title || product.name || "Product",
            price: displayPrice.toString(),
            rating:
              product.stars && product.stars > 0 ? product.stars : undefined,
            reviewCount:
              product.reviewCount && product.reviewCount > 0
                ? product.reviewCount
                : undefined,
            images: {
              main: product.images?.[0] || "/images/product-placeholder.png",
              hover:
                product.images?.[1] ||
                product.images?.[0] ||
                "/images/product-placeholder.png",
            },
            hasAntioxidants,
            hasProbiotics,
            weight: product.weight || "40 GM",
          };
        }
      );

      // Apply limit if specified
      const limitedProducts =
        limit > 0 ? mappedProducts.slice(0, limit) : mappedProducts;

      setProducts(limitedProducts);
    };

    fetchProducts();
  }, [category, categories?.join(","), feature, limit, fetchAll]);

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (products.length === 0) {
    return <div className={styles.noProducts}>No products found.</div>;
  }

  return (
    <div className={styles.productGrid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
