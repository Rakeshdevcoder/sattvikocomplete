// frontend/src/pages/HighFibre.tsx
import React, { useState, useEffect } from "react";
import { shopifyApi, type ShopifyProduct } from "../api/shopifyApi";
import ProductCard from "../components/ProductCard";
import styles from "../styles/makhanas/collectionhero.module.css";
import listStyles from "../styles/makhanas/productlist.module.css";

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
  shopifyVariantId?: string;
  handle?: string;
}

const HighFibre = () => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapShopifyToProductCard = (
    shopifyProduct: ShopifyProduct
  ): ProductCardProps => {
    const firstVariant = shopifyProduct.variants.edges[0]?.node;
    const mainImage =
      shopifyProduct.images.edges[0]?.node.url ||
      "/images/product-placeholder.png";
    const hoverImage = shopifyProduct.images.edges[1]?.node.url || mainImage;

    // Extract features from tags
    const tags = shopifyProduct.tags.map((tag) => tag.toLowerCase());

    return {
      id: shopifyProduct.id,
      title: shopifyProduct.title,
      price:
        firstVariant?.price.amount ||
        shopifyProduct.priceRange.minVariantPrice.amount,
      rating: undefined, // Shopify doesn't provide ratings by default
      reviewCount: undefined,
      images: {
        main: mainImage,
        hover: hoverImage,
      },
      hasAntioxidants:
        tags.includes("antioxidants") || tags.includes("anti-oxidants"),
      hasProbiotics: tags.includes("probiotics"),
      weight: "40 GM", // Default weight, you can extract from product title or metafields
      shopifyVariantId: firstVariant?.id,
      handle: shopifyProduct.handle,
    };
  };

  const fetchAllProducts = async (): Promise<ShopifyProduct[]> => {
    let allProducts: ShopifyProduct[] = [];
    let hasNextPage = true;
    let endCursor: string | undefined;

    while (hasNextPage) {
      try {
        const result = await shopifyApi.getProducts(50, endCursor); // Fetch 50 products per batch
        allProducts = [...allProducts, ...result.products];
        hasNextPage = result.pageInfo.hasNextPage;
        endCursor = result.pageInfo.endCursor;
      } catch (error) {
        console.error("Error fetching products batch:", error);
        break;
      }
    }

    return allProducts;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching all products and filtering for high-fiber...");

        // Fetch all products from the store
        const allProducts = await fetchAllProducts();

        if (!allProducts || allProducts.length === 0) {
          console.log("No products found in the store");
          setProducts([]);
          return;
        }

        // Filter products that have "high-fiber" tag
        const highFiberProducts = allProducts.filter((product) => {
          const tags = product.tags.map((tag) => tag.toLowerCase());
          return (
            tags.includes("high-fiber") ||
            tags.includes("high-fibre") ||
            tags.includes("highfiber") ||
            tags.includes("highfibre") ||
            tags.includes("high fiber") ||
            tags.includes("high fibre")
          );
        });

        console.log(
          `Found ${highFiberProducts.length} high-fiber products out of ${allProducts.length} total products`
        );

        if (highFiberProducts.length === 0) {
          setProducts([]);
          return;
        }

        const mappedProducts = highFiberProducts.map(mapShopifyToProductCard);
        setProducts(mappedProducts);

        console.log(`Loaded ${mappedProducts.length} high-fiber products`);
      } catch (err: any) {
        console.error("Error fetching high-fiber products:", err);
        setError(`Failed to load high-fiber products: ${err.message}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        {/* Collection Hero */}
        <div className={styles.collectionHero}>
          <div className={styles.heroInner}>
            <div className={styles.textWrapper}>
              <h1 className={styles.title}>
                <span className={styles.visuallyHidden}>Collection: </span>
                High Fiber Products
              </h1>
              <div className={styles.description}>
                <p>
                  <strong>
                    Boost your digestive health with our high-fiber snacks and
                    meals.
                  </strong>
                </p>
                <p>
                  Support your digestive wellness with our fiber-rich collection
                  designed to keep you feeling satisfied and energized
                  throughout the day. Each product is packed with natural
                  dietary fiber to promote healthy digestion, regulate blood
                  sugar levels, and support heart health. Perfect for
                  maintaining a balanced diet while enjoying delicious,
                  nutritious snacks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product List */}
        {loading && (
          <div className={listStyles.loading}>
            Loading high-fiber products...
          </div>
        )}

        {error && <div className={listStyles.error}>{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className={listStyles.noProducts}>
            No high-fiber products found in the store.
          </div>
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

export default HighFibre;
