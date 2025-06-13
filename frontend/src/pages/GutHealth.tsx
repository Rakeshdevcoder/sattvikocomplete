// frontend/src/pages/GutHealth.tsx
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

const GutHealth = () => {
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
        console.log("Fetching all products and filtering for gut-health...");

        // Fetch all products from the store
        const allProducts = await fetchAllProducts();

        if (!allProducts || allProducts.length === 0) {
          console.log("No products found in the store");
          setProducts([]);
          return;
        }

        // Filter products that have "gut-health" tag
        const gutHealthProducts = allProducts.filter((product) => {
          const tags = product.tags.map((tag) => tag.toLowerCase());
          return (
            tags.includes("gut-health") ||
            tags.includes("gut health") ||
            tags.includes("guthealth") ||
            tags.includes("probiotics") ||
            tags.includes("digestive-health") ||
            tags.includes("digestive health")
          );
        });

        console.log(
          `Found ${gutHealthProducts.length} gut-health products out of ${allProducts.length} total products`
        );

        if (gutHealthProducts.length === 0) {
          setProducts([]);
          return;
        }

        const mappedProducts = gutHealthProducts.map(mapShopifyToProductCard);
        setProducts(mappedProducts);

        console.log(`Loaded ${mappedProducts.length} gut-health products`);
      } catch (err: any) {
        console.error("Error fetching gut-health products:", err);
        setError(`Failed to load gut-health products: ${err.message}`);
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
                Gut Health Products
              </h1>
              <div className={styles.description}>
                <p>
                  <strong>
                    Nourish your gut with our probiotic-rich and
                    digestive-friendly products.
                  </strong>
                </p>
                <p>
                  Discover our carefully curated collection of gut-health
                  focused snacks and meals enriched with probiotics and
                  prebiotics. Each product is designed to support digestive
                  wellness, boost immunity, and promote a healthy gut
                  microbiome. Perfect for maintaining digestive balance while
                  enjoying delicious, functional foods that work from the inside
                  out.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product List */}
        {loading && (
          <div className={listStyles.loading}>
            Loading gut-health products...
          </div>
        )}

        {error && <div className={listStyles.error}>{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className={listStyles.noProducts}>
            No gut-health products found in the store.
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

export default GutHealth;
