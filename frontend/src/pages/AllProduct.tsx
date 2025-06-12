// frontend/src/pages/AllProduct.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import productStyles from "../styles/productcard.module.css";
import listStyles from "../styles/makhanas/productlist.module.css";

const API_BASE_URL = "/api";

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

const AllProduct = () => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mapAndSetProducts = (productsData: any[]) => {
      if (!Array.isArray(productsData)) {
        console.error("productsData is not an array:", productsData);
        setProducts([]);
        return;
      }

      const nonNullData = productsData.filter(
        (p): p is Record<string, any> => p != null
      );

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

      setProducts(mappedProducts);
    };

    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log("Attempting to fetch all products...");

        const url = `${API_BASE_URL}/products`;
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
  }, []);

  const ProductCard: React.FC<{ product: ProductCardProps }> = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);

    const formatTitle = () => {
      let title = product.title;
      let additionalInfo = "";

      const features = [];
      if (product.isVegan) features.push("Vegan");
      if (product.isGlutenFree) features.push("Gluten-Free");
      if (product.isHighFibre) features.push("High-Fibre");
      if (product.isGutHealth) features.push("Gut-Health");
      if (product.isHighProtein) features.push("High-Protein");

      if (features.length > 0) {
        additionalInfo = ` | ${features.join(", ")}`;
      }

      return `${title} ${product.weight}${additionalInfo}`;
    };

    const formattedTitle = formatTitle();

    const renderStars = () => {
      if (!product.rating) return null;

      return (
        <div className={productStyles.rating}>
          <div className={productStyles.stars}>
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={
                  i < Math.round(product.rating!)
                    ? productStyles.starFilled
                    : productStyles.starEmpty
                }
              >
                ★
              </span>
            ))}
          </div>
          {product.reviewCount && (
            <span className={productStyles.reviewCount}>
              {product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      );
    };

    const renderFeatureBadges = () => {
      if (!product.isVegan && !product.isGlutenFree && !product.isHighProtein) {
        return null;
      }

      return (
        <div className={productStyles.featureBadges}>
          {product.isVegan && <span className={productStyles.badge}>Vegan</span>}
          {product.isGlutenFree && (
            <span className={productStyles.badge}>Gluten-Free</span>
          )}
          {product.isHighProtein && (
            <span className={productStyles.badge}>High Protein</span>
          )}
        </div>
      );
    };

    return (
      <div className={productStyles.cardWrapper}>
        <div
          className={productStyles.card}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <a href={`/products/${product.id}`} className={productStyles.imageLink}>
            <div className={productStyles.imageContainer}>
              <img
                src={
                  isHovered && product.images.hover
                    ? product.images.hover
                    : product.images.main
                }
                alt={formattedTitle}
                className={productStyles.productImage}
                loading="lazy"
              />
              {renderFeatureBadges()}
            </div>
          </a>

          <div className={productStyles.contentContainer}>
            <div className={productStyles.titleContainer}>
              <h3 className={productStyles.cardHeading}>
                
                  href={`/products/${product.id}`}
                  className={productStyles.productLink}
                >
                  {formattedTitle}
                </a>
              </h3>
            </div>

            {product.rating && product.rating > 0 && (
              <div className={productStyles.ratingContainer}>{renderStars()}</div>
            )}

            <div className={productStyles.price}>
              <span className={productStyles.priceRegular}>Rs. {product.price}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        <div className={listStyles.loading}>Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        <div className={listStyles.error}>{error}</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        <div className={listStyles.noProducts}>
          No products found for the selected criteria.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
      <div className={listStyles.productGrid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default AllProduct;