// frontend/src/pages/Combo.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../styles/makhanas/collectionhero.module.css";
import productStyles from "../styles/productcard.module.css";
import listStyles from "../styles/makhanas/productlist.module.css";
import { useNavigate } from "react-router-dom";

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

const Combo = () => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log("Attempting to fetch products...");

        let queryParams = new URLSearchParams();
        queryParams.append("category", "Combos");

        const url = `${API_BASE_URL}/products?${queryParams.toString()}`;
        console.log("Request URL:", url);

        const response = await axios.get(url, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        console.log("Response data:", response.data);

        if (!Array.isArray(response.data)) {
          console.log("Response is not an array:", response.data);
          const productsData = response.data.products || [];
          mapAndSetProducts(productsData);
        } else {
          mapAndSetProducts(response.data);
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
      } finally {
        setLoading(false);
      }
    };

    const mapAndSetProducts = (productsData: any[]) => {
      const mappedProducts: ProductCardProps[] = productsData.map(
        (product: any) => {
          const productId = product.id || product._id || "";
          const hasAntioxidants =
            product.features?.includes("antioxidants") || false;
          const hasProbiotics =
            product.features?.includes("probiotics") || false;

          const displayPrice =
            product.salesPrice > 0
              ? product.salesPrice
              : product.regularPrice || product.price || 0;

          return {
            id: productId.toString(),
            title: product.title || product.name || "Product",
            price: displayPrice.toString(),
            rating: product.stars > 0 ? product.stars : undefined,
            reviewCount:
              product.reviewCount > 0 ? product.reviewCount : undefined,
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

      const limitedProducts = mappedProducts.slice(0, 8);
      setProducts(limitedProducts);
    };

    fetchProducts();
  }, []);

  const ProductCard: React.FC<{ product: ProductCardProps }> = ({
    product,
  }) => {
    const [isHovered, setIsHovered] = useState(false);

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

    const handleCardClick = () => {
      navigate(`/products/${product.id}`);
    };

    return (
      <div className={productStyles.cardWrapper}>
        <div
          className={productStyles.card}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleCardClick}
          style={{ cursor: "pointer" }}
        >
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
          </div>

          <div className={productStyles.contentContainer}>
            <div className={productStyles.titleContainer}>
              <h3 className={productStyles.cardHeading}>{formattedTitle}</h3>
            </div>

            {product.rating && product.rating > 0 && (
              <div className={productStyles.ratingContainer}>
                {renderStars()}
              </div>
            )}

            <div className={productStyles.price}>
              <span className={productStyles.priceRegular}>
                Rs. {product.price}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        {/* Collection Hero */}
        <div className={styles.collectionHero}>
          <div className={styles.heroInner}>
            <div className={styles.textWrapper}>
              <h1 className={styles.title}>
                <span className={styles.visuallyHidden}>Collection: </span>
                Combo Packs
              </h1>
              <div className={styles.description}>
                <p>
                  Offering a nutritious and delicious snack rich in protein,
                  fiber, and essential minerals. Perfect for guilt-free
                  munching, our variety of flavors caters to every taste. Enjoy
                  a healthy, crunchy treat anytime, anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product List */}
        {loading && (
          <div className={listStyles.loading}>Loading products...</div>
        )}
        {error && <div className={listStyles.error}>{error}</div>}
        {!loading && !error && products.length === 0 && (
          <div className={listStyles.noProducts}>No products found.</div>
        )}
        {!loading && !error && products.length > 0 && (
          <div className={listStyles.productGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Combo;
