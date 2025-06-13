// frontend/src/pages/Millets.tsx
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

const Millets = () => {
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
        console.log("Fetching millet puff products from Shopify collection...");

        const shopifyProducts = await shopifyApi.getCollectionProducts(
          "millet-puffs",
          20
        );

        if (!shopifyProducts || shopifyProducts.length === 0) {
          console.log("No products found in millet-puffs collection");
          setProducts([]);
          return;
        }

        const mappedProducts = shopifyProducts.map(mapShopifyToProductCard);

        // Limit to 8 products as in original code
        const limitedProducts = mappedProducts.slice(0, 8);
        setProducts(limitedProducts);

        console.log(`Loaded ${limitedProducts.length} millet puff products`);
      } catch (err: any) {
        console.error("Error fetching millet puff products:", err);
        setError(`Failed to load millet puff products: ${err.message}`);
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
                Millet Puffs
              </h1>
              <div className={styles.description}>
                <p>
                  <strong>
                    Millet Puffs with Probiotics – A Crunchy Boost to Gut
                    Health!
                  </strong>
                </p>
                <p>
                  Discover the perfect blend of taste and wellness with our
                  Millet Puffs enriched with Probiotics. Made from nutrient-rich
                  millets like ragi, jowar, and bajra, these light and crispy
                  snacks are not only gluten-free but also packed with dietary
                  fiber, essential minerals, and gut-friendly probiotics.
                </p>
                <p>
                  Each bite supports digestion and boosts immunity while
                  satisfying your snack cravings guilt-free. Whether you're
                  looking for a healthy midday munch or a tasty treat for kids,
                  our millet puffs offer the perfect mix of crunch, flavor, and
                  functionality.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product List */}
        {loading && (
          <div className={listStyles.loading}>
            Loading millet puff products...
          </div>
        )}

        {error && <div className={listStyles.error}>{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className={listStyles.noProducts}>
            No millet puff products found in the collection.
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

export default Millets;
