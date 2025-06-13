// src/api/shopifyApi.ts
import { createStorefrontApiClient } from "@shopify/storefront-api-client";

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  images: {
    edges: Array<{
      node: {
        id: string;
        url: string;
        altText?: string;
        width?: number;
        height?: number;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        compareAtPrice?: {
          amount: string;
          currencyCode: string;
        };
        selectedOptions: Array<{
          name: string;
          value: string;
        }>;
        availableForSale: boolean;
        quantityAvailable?: number;
      };
    }>;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  vendor: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
}

export interface ShopifyCollection {
  id: string;
  title: string;
  description: string;
  handle: string;
  image?: {
    url: string;
    altText?: string;
  };
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
  };
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      id: string;
      title: string;
      handle: string;
      images: {
        edges: Array<{
          node: {
            url: string;
            altText?: string;
          };
        }>;
      };
    };
    price: {
      amount: string;
      currencyCode: string;
    };
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
  };
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

export interface ShopifyCart {
  id: string;
  lines: {
    edges: Array<{
      node: CartLine;
    }>;
  };
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
    subtotalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalTaxAmount?: {
      amount: string;
      currencyCode: string;
    };
  };
  checkoutUrl: string;
  totalQuantity: number;
}

class ShopifyApiClient {
  private client: any;
  private cartId: string | null = null;
  private storeDomain: string;
  private accessToken: string;

  constructor() {
    this.storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
    this.accessToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    console.log("🔍 Shopify Configuration Debug:", {
      storeDomain: this.storeDomain,
      accessTokenLength: this.accessToken?.length,
      accessTokenStart: this.accessToken?.substring(0, 8) + "...",
      hasAccessToken: !!this.accessToken,
    });

    if (!this.storeDomain || !this.accessToken) {
      console.error("❌ Missing Shopify configuration!");
      throw new Error(
        `Missing Shopify configuration. Store Domain: ${!!this
          .storeDomain}, Access Token: ${!!this.accessToken}`
      );
    }

    // Clean domain parsing
    let cleanDomain = this.storeDomain;
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
    cleanDomain = cleanDomain.replace(/\/$/, "");
    if (!cleanDomain.endsWith(".myshopify.com")) {
      cleanDomain = `${cleanDomain}.myshopify.com`;
    }

    console.log("🏪 Clean domain:", cleanDomain);

    try {
      this.client = createStorefrontApiClient({
        storeDomain: cleanDomain,
        apiVersion: "2024-10",
        publicAccessToken: this.accessToken,
      });
      console.log("✅ Shopify client created successfully");
    } catch (error) {
      console.error("❌ Failed to create Shopify client:", error);
      throw error;
    }

    this.cartId = localStorage.getItem("shopify_cart_id");
  }

  async testConnection(): Promise<boolean> {
    const testQuery = `
      query {
        shop {
          name
          description
        }
      }
    `;

    try {
      console.log("🧪 Testing Shopify connection...");
      const response = await this.client.request(testQuery);
      console.log("✅ Connection test successful:", response);
      return true;
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      return false;
    }
  }

  async testWithFetch(): Promise<boolean> {
    let cleanDomain = this.storeDomain;
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!cleanDomain.endsWith(".myshopify.com")) {
      cleanDomain = `${cleanDomain}.myshopify.com`;
    }

    const url = `https://${cleanDomain}/api/2024-10/graphql.json`;

    const query = {
      query: `
        query {
          shop {
            name
            description
          }
        }
      `,
    };

    try {
      console.log("🧪 Testing with native fetch...");
      console.log("URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": this.accessToken,
        },
        body: JSON.stringify(query),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.status === 401) {
        console.error(
          "❌ Authentication failed - check your access token and permissions"
        );
        return false;
      }

      if (data.errors) {
        console.error("❌ GraphQL errors:", data.errors);
        return false;
      }

      console.log("✅ Fetch test successful");
      return true;
    } catch (error) {
      console.error("❌ Fetch test failed:", error);
      return false;
    }
  }

  private async makeRequest(query: string, variables?: any) {
    try {
      const response = await this.client.request(query, {
        variables: variables || {},
      });

      console.log("📝 GraphQL Request successful:", {
        hasData: !!response.data,
        hasErrors: !!response.errors,
      });

      if (response.errors && response.errors.length > 0) {
        console.error("❌ GraphQL errors:", response.errors);
        throw new Error(
          `GraphQL errors: ${response.errors
            .map((e: any) => e.message)
            .join(", ")}`
        );
      }

      if (!response.data) {
        console.error("❌ No data in response:", response);
        throw new Error("No data returned from Shopify API");
      }

      return response.data;
    } catch (error) {
      console.error("❌ Request failed:", error);
      throw error;
    }
  }

  async getProducts(
    first: number = 10,
    after?: string
  ): Promise<{
    products: ShopifyProduct[];
    pageInfo: { hasNextPage: boolean; endCursor?: string };
  }> {
    const query = `
      query GetProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              description
              handle
              availableForSale
              vendor
              productType
              tags
              images(first: 5) {
                edges {
                  node {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    quantityAvailable
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const data = await this.makeRequest(query, { first, after });

    return {
      products: data.products?.edges?.map((edge: any) => edge.node) || [],
      pageInfo: data.products?.pageInfo || { hasNextPage: false },
    };
  }

  async getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
    const query = `
      query GetProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          title
          description
          handle
          availableForSale
          vendor
          productType
          tags
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                availableForSale
                quantityAvailable
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    `;

    const data = await this.makeRequest(query, { handle });
    return data.productByHandle || null;
  }

  async getCollections(first: number = 10): Promise<ShopifyCollection[]> {
    const query = `
      query GetCollections($first: Int!) {
        collections(first: $first) {
          edges {
            node {
              id
              title
              description
              handle
              image {
                url
                altText
              }
              products(first: 5) {
                edges {
                  node {
                    id
                    title
                    description
                    handle
                    availableForSale
                    vendor
                    productType
                    tags
                    images(first: 1) {
                      edges {
                        node {
                          id
                          url
                          altText
                          width
                          height
                        }
                      }
                    }
                    variants(first: 10) {
                      edges {
                        node {
                          id
                          title
                          availableForSale
                          quantityAvailable
                          price {
                            amount
                            currencyCode
                          }
                          compareAtPrice {
                            amount
                            currencyCode
                          }
                          selectedOptions {
                            name
                            value
                          }
                        }
                      }
                    }
                    priceRange {
                      minVariantPrice {
                        amount
                        currencyCode
                      }
                      maxVariantPrice {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.makeRequest(query, { first });
    return data.collections?.edges?.map((edge: any) => edge.node) || [];
  }

  async getCollectionProducts(
    handle: string,
    first: number = 20
  ): Promise<ShopifyProduct[]> {
    const query = `
      query GetCollectionProducts($handle: String!, $first: Int!) {
        collectionByHandle(handle: $handle) {
          id
          title
          products(first: $first) {
            edges {
              node {
                id
                title
                description
                handle
                availableForSale
                vendor
                productType
                tags
                images(first: 5) {
                  edges {
                    node {
                      id
                      url
                      altText
                      width
                      height
                    }
                  }
                }
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      availableForSale
                      quantityAvailable
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.makeRequest(query, { handle, first });
    return (
      data.collectionByHandle?.products?.edges?.map((edge: any) => edge.node) ||
      []
    );
  }

  async createCart(): Promise<ShopifyCart> {
    const query = `
      mutation CartCreate {
        cartCreate {
          cart {
            id
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        id
                        title
                        handle
                        images(first: 1) {
                          edges {
                            node {
                              url
                              altText
                            }
                          }
                        }
                      }
                      price {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
            }
            checkoutUrl
            totalQuantity
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await this.makeRequest(query);

    if (data.cartCreate?.userErrors?.length > 0) {
      throw new Error(data.cartCreate.userErrors[0].message);
    }

    const cart = data.cartCreate?.cart;
    if (!cart) {
      throw new Error("Failed to create cart - no cart data returned");
    }

    this.cartId = cart.id;
    localStorage.setItem("shopify_cart_id", cart.id);
    return cart;
  }

  async getCart(): Promise<ShopifyCart | null> {
    if (!this.cartId) {
      return await this.createCart();
    }

    const query = `
      query GetCart($cartId: ID!) {
        cart(id: $cartId) {
          id
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      id
                      title
                      handle
                      images(first: 1) {
                        edges {
                          node {
                            url
                            altText
                          }
                        }
                      }
                    }
                    price {
                      amount
                      currencyCode
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
                cost {
                  totalAmount {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalTaxAmount {
              amount
              currencyCode
            }
          }
          checkoutUrl
          totalQuantity
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { cartId: this.cartId });

      if (!data.cart) {
        console.log("Cart not found, creating new one");
        return await this.createCart();
      }

      return data.cart;
    } catch (error) {
      console.error("Error fetching cart, creating new one:", error);
      return await this.createCart();
    }
  }

  async addToCart(
    variantId: string,
    quantity: number = 1
  ): Promise<ShopifyCart> {
    if (!this.cartId) {
      await this.createCart();
    }

    const query = `
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        id
                        title
                        handle
                        images(first: 1) {
                          edges {
                            node {
                              url
                              altText
                            }
                          }
                        }
                      }
                      price {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
            }
            checkoutUrl
            totalQuantity
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await this.makeRequest(query, {
      cartId: this.cartId,
      lines: [{ merchandiseId: variantId, quantity }],
    });

    if (data.cartLinesAdd?.userErrors?.length > 0) {
      throw new Error(data.cartLinesAdd.userErrors[0].message);
    }

    return data.cartLinesAdd.cart;
  }

  async updateCartLine(lineId: string, quantity: number): Promise<ShopifyCart> {
    const query = `
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            id
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        id
                        title
                        handle
                        images(first: 1) {
                          edges {
                            node {
                              url
                              altText
                            }
                          }
                        }
                      }
                      price {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
            }
            checkoutUrl
            totalQuantity
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await this.makeRequest(query, {
      cartId: this.cartId,
      lines: [{ id: lineId, quantity }],
    });

    if (data.cartLinesUpdate?.userErrors?.length > 0) {
      throw new Error(data.cartLinesUpdate.userErrors[0].message);
    }

    return data.cartLinesUpdate.cart;
  }

  async removeCartLine(lineId: string): Promise<ShopifyCart> {
    const query = `
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            id
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        id
                        title
                        handle
                        images(first: 1) {
                          edges {
                            node {
                              url
                              altText
                            }
                          }
                        }
                      }
                      price {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
            }
            checkoutUrl
            totalQuantity
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await this.makeRequest(query, {
      cartId: this.cartId,
      lineIds: [lineId],
    });

    if (data.cartLinesRemove?.userErrors?.length > 0) {
      throw new Error(data.cartLinesRemove.userErrors[0].message);
    }

    return data.cartLinesRemove.cart;
  }

  async clearCart(): Promise<ShopifyCart> {
    if (!this.cartId) {
      return await this.createCart();
    }

    const cart = await this.getCart();
    if (!cart || cart.lines.edges.length === 0) {
      return cart || (await this.createCart());
    }

    const lineIds = cart.lines.edges.map((edge) => edge.node.id);

    const query = `
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            id
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        id
                        title
                        handle
                        images(first: 1) {
                          edges {
                            node {
                              url
                              altText
                            }
                          }
                        }
                      }
                      price {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                  cost {
                    totalAmount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
              subtotalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
            }
            checkoutUrl
            totalQuantity
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await this.makeRequest(query, {
      cartId: this.cartId,
      lineIds,
    });

    if (data.cartLinesRemove?.userErrors?.length > 0) {
      throw new Error(data.cartLinesRemove.userErrors[0].message);
    }

    return data.cartLinesRemove.cart;
  }

  async getCheckoutUrl(): Promise<string> {
    const cart = await this.getCart();
    if (!cart) {
      throw new Error("No cart found");
    }
    return cart.checkoutUrl;
  }
}

export const shopifyApi = new ShopifyApiClient();
export default shopifyApi;
