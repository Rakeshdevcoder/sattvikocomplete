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

  constructor() {
    const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
    const accessToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    if (!storeDomain || !accessToken) {
      throw new Error(
        "Missing Shopify configuration. Please check your environment variables."
      );
    }

    this.client = createStorefrontApiClient({
      storeDomain: storeDomain.includes("http")
        ? storeDomain
        : `https://${storeDomain}`,
      apiVersion: "2024-10",
      publicAccessToken: accessToken,
    });

    this.cartId = localStorage.getItem("shopify_cart_id");
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
              images(first: 5) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
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
                    availableForSale
                    quantityAvailable
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
              vendor
              productType
              tags
              availableForSale
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    try {
      const { data, errors } = await this.client.request(query, {
        variables: { first, after },
      });

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      return {
        products: data.products.edges.map((edge: any) => edge.node),
        pageInfo: data.products.pageInfo,
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  async getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
    const query = `
      query GetProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          title
          description
          handle
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
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
                availableForSale
                quantityAvailable
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
          vendor
          productType
          tags
          availableForSale
        }
      }
    `;

    try {
      const { data, errors } = await this.client.request(query, {
        variables: { handle },
      });

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      return data.productByHandle;
    } catch (error) {
      console.error("Error fetching product by handle:", error);
      throw error;
    }
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
              products(first: 20) {
                edges {
                  node {
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
                    priceRange {
                      minVariantPrice {
                        amount
                        currencyCode
                      }
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const { data, errors } = await this.client.request(query, {
        variables: { first },
      });

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      return data.collections.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  }

  async getCollectionProducts(
    handle: string,
    first: number = 20
  ): Promise<ShopifyProduct[]> {
    const query = `
      query GetCollectionProducts($handle: String!, $first: Int!) {
        collectionByHandle(handle: $handle) {
          products(first: $first) {
            edges {
              node {
                id
                title
                description
                handle
                images(first: 5) {
                  edges {
                    node {
                      id
                      url
                      altText
                    }
                  }
                }
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
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
                      availableForSale
                      quantityAvailable
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
                vendor
                productType
                tags
                availableForSale
              }
            }
          }
        }
      }
    `;

    try {
      const { data, errors } = await this.client.request(query, {
        variables: { handle, first },
      });

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      return (
        data.collectionByHandle?.products.edges.map((edge: any) => edge.node) ||
        []
      );
    } catch (error) {
      console.error("Error fetching collection products:", error);
      throw error;
    }
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

    try {
      const { data, errors } = await this.client.request(query);

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      if (data.cartCreate.userErrors.length > 0) {
        throw new Error(data.cartCreate.userErrors[0].message);
      }

      const cart = data.cartCreate.cart;
      this.cartId = cart.id;
      localStorage.setItem("shopify_cart_id", cart.id);

      return cart;
    } catch (error) {
      console.error("Error creating cart:", error);
      throw error;
    }
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
      const { data, errors } = await this.client.request(query, {
        variables: { cartId: this.cartId },
      });

      if (errors && errors.length > 0) {
        console.error("GraphQL errors:", errors);
        return await this.createCart();
      }

      if (!data.cart) {
        return await this.createCart();
      }

      return data.cart;
    } catch (error) {
      console.error("Error fetching cart:", error);
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

    try {
      const { data, errors } = await this.client.request(query, {
        variables: {
          cartId: this.cartId,
          lines: [{ merchandiseId: variantId, quantity }],
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      if (data.cartLinesAdd.userErrors.length > 0) {
        throw new Error(data.cartLinesAdd.userErrors[0].message);
      }

      return data.cartLinesAdd.cart;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
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

    try {
      const { data, errors } = await this.client.request(query, {
        variables: {
          cartId: this.cartId,
          lines: [{ id: lineId, quantity }],
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      if (data.cartLinesUpdate.userErrors.length > 0) {
        throw new Error(data.cartLinesUpdate.userErrors[0].message);
      }

      return data.cartLinesUpdate.cart;
    } catch (error) {
      console.error("Error updating cart line:", error);
      throw error;
    }
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

    try {
      const { data, errors } = await this.client.request(query, {
        variables: {
          cartId: this.cartId,
          lineIds: [lineId],
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      if (data.cartLinesRemove.userErrors.length > 0) {
        throw new Error(data.cartLinesRemove.userErrors[0].message);
      }

      return data.cartLinesRemove.cart;
    } catch (error) {
      console.error("Error removing cart line:", error);
      throw error;
    }
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

    try {
      const { data, errors } = await this.client.request(query, {
        variables: {
          cartId: this.cartId,
          lineIds,
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }

      if (data.cartLinesRemove.userErrors.length > 0) {
        throw new Error(data.cartLinesRemove.userErrors[0].message);
      }

      return data.cartLinesRemove.cart;
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
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
