// frontend/src/pages/Makhanas.tsx
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

const Makhanas = () => {
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching makhana products from Shopify collection...");

        const shopifyProducts = await shopifyApi.getCollectionProducts(
          "makhanas",
          20
        );

        if (!shopifyProducts || shopifyProducts.length === 0) {
          console.log("No products found in makhanas collection");
          setProducts([]);
          return;
        }

        const mappedProducts = shopifyProducts.map(mapShopifyToProductCard);

        // Limit to 8 products as in original code
        const limitedProducts = mappedProducts.slice(0, 8);
        setProducts(limitedProducts);

        console.log(`Loaded ${limitedProducts.length} makhana products`);
      } catch (err: any) {
        console.error("Error fetching makhana products:", err);
        setError(`Failed to load makhana products: ${err.message}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <div style={{ marginLeft: "100.4px", marginRight: "100.4px" }}>
        {/* Collection Hero */}
        <div className={styles.collectionHero}>
          <div className={styles.heroInner}>
            <div className={styles.textWrapper}>
              <h1 className={styles.title}>
                <span className={styles.visuallyHidden}>Collection: </span>
                Flavoured Makhana
              </h1>
              <div className={styles.description}>
                <p>
                  <strong>A Wholesome Snack with a Functional Twist</strong>
                </p>
                <p>
                  Discover our range of <em>Flavoured Makhana</em>, a
                  deliciously healthy snack that goes beyond taste. These
                  roasted fox nuts are packed with <strong>antioxidants</strong>{" "}
                  to fight free radicals and support overall wellness. Enriched
                  with <strong>probiotics</strong>, they also promote better gut
                  health and digestion.
                </p>
                <p>
                  Each bite delivers a good source of{" "}
                  <strong>plant-based protein</strong>, making it an ideal snack
                  for fitness enthusiasts and mindful eaters. We've thoughtfully
                  added <strong>sesame seeds</strong> for an extra crunch and a
                  boost of calcium and healthy fats, and{" "}
                  <strong>Ashwagandha</strong>, the ancient adaptogen known to
                  reduce stress and support vitality.
                </p>
                <p>
                  Perfectly roasted and seasoned, our makhanas are not just
                  snacks—they're a lifestyle upgrade.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product List */}
        {loading && (
          <div className={listStyles.loading}>Loading makhana products...</div>
        )}

        {error && <div className={listStyles.error}>{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className={listStyles.noProducts}>
            No makhana products found in the collection.
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

export default Makhanas;
