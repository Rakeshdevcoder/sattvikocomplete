// src/hooks/useShopifyProducts.ts
import { useState, useEffect } from "react";
import {
  shopifyApi,
  type ShopifyProduct,
  type ShopifyCollection,
} from "../api/shopifyApi";

export const useShopifyProducts = (first: number = 20) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>();

  const fetchProducts = async (after?: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await shopifyApi.getProducts(first, after);

      if (after) {
        setProducts((prev) => [...prev, ...result.products]);
      } else {
        setProducts(result.products);
      }

      setHasNextPage(result.pageInfo.hasNextPage);
      setEndCursor(result.pageInfo.endCursor);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      setError(err.message || "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasNextPage && endCursor && !loading) {
      fetchProducts(endCursor);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [first]);

  return {
    products,
    loading,
    error,
    hasNextPage,
    loadMore,
    refetch: () => fetchProducts(),
  };
};

export const useShopifyProduct = (handle: string) => {
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!handle) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedProduct = await shopifyApi.getProductByHandle(handle);
        setProduct(fetchedProduct);
      } catch (err: any) {
        console.error("Failed to fetch product:", err);
        setError(err.message || "Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [handle]);

  return {
    product,
    loading,
    error,
    refetch: () => {
      if (handle) {
        setLoading(true);
        shopifyApi
          .getProductByHandle(handle)
          .then(setProduct)
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false));
      }
    },
  };
};

export const useShopifyCollections = () => {
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchedCollections = await shopifyApi.getCollections();
        setCollections(fetchedCollections);
      } catch (err: any) {
        console.error("Failed to fetch collections:", err);
        setError(
          err.message || "Failed to load collections. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return {
    collections,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      shopifyApi
        .getCollections()
        .then(setCollections)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
  };
};

export const useShopifyCollectionProducts = (handle: string) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollectionProducts = async () => {
      if (!handle) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedProducts = await shopifyApi.getCollectionProducts(handle);
        setProducts(fetchedProducts);
      } catch (err: any) {
        console.error("Failed to fetch collection products:", err);
        setError(
          err.message || "Failed to load collection products. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionProducts();
  }, [handle]);

  return {
    products,
    loading,
    error,
    refetch: () => {
      if (handle) {
        setLoading(true);
        shopifyApi
          .getCollectionProducts(handle)
          .then(setProducts)
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false));
      }
    },
  };
};
