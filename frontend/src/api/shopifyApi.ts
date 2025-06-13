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
  private storeDomain: string;
  private accessToken: string;

  constructor() {
    this.storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
    this.accessToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    // Debug configuration
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

    // Clean store domain
    let cleanDomain = this.storeDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    if (!cleanDomain.includes(".myshopify.com")) {
      cleanDomain = `${cleanDomain}.myshopify.com`;
    }

    console.log("🏪 Using store domain:", cleanDomain);

    try {
      this.client = createStorefrontApiClient({
        storeDomain: `https://${cleanDomain}`,
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

  // Test connection method
  async testConnection(): Promise<boolean> {
    const testQuery = `
      query {
        shop {
          name
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

  // Alternative fetch method for debugging
  async testWithFetch(): Promise<boolean> {
    const url = `https://${this.storeDomain}.myshopify.com/api/2024-10/graphql.json`;
    const query = {
      query: `
        query {
          shop {
            name
          }
        }
      `,
    };

    try {
      console.log("🧪 Testing with native fetch...");
      console.log("URL:", url);
      console.log("Headers:", {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token":
          this.accessToken.substring(0, 8) + "...",
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": this.accessToken,
        },
        body: JSON.stringify(query),
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

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

      console.log("📝 GraphQL Request:", {
        query: query.substring(0, 100) + "...",
        variables,
        response: response,
      });

      if (response.errors && response.errors.length > 0) {
        console.error("❌ GraphQL errors:", response.errors);

        // Check for specific error types
        const authError = response.errors.find(
          (error: any) =>
            error.message?.includes("401") ||
            error.message?.includes("Unauthorized") ||
            error.extensions?.code === "UNAUTHENTICATED"
        );

        if (authError) {
          throw new Error(
            "Authentication failed. Please check your Storefront Access Token and permissions."
          );
        }

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

      // Enhanced error handling
      if (error instanceof Error) {
        if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          throw new Error(`
            🔑 Authentication Error: Your Storefront Access Token is invalid or expired.
            
            To fix this:
            1. Go to your Shopify Admin
            2. Navigate to Apps & sales channels > Develop apps
            3. Click on your private app (or create one)
            4. Go to API credentials
            5. Copy the Storefront access token
            6. Update your .env file with: VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
            7. Make sure the token has these permissions:
               - Read products
               - Read product listings
               - Read collections
               - Read customers
               - Read and write carts
          `);
        }

        if (
          error.message.includes("403") ||
          error.message.includes("Forbidden")
        ) {
          throw new Error(`
            🚫 Permission Error: Your app doesn't have the required permissions.
            
            Required Storefront API scopes:
            - Read products
            - Read collections  
            - Read and write carts
          `);
        }

        if (error.message.includes("404")) {
          throw new Error(`
            🏪 Store Not Found: Check your store domain.
            Current: ${this.storeDomain}
            Should be: your-store-name (without .myshopify.com)
          `);
        }
      }

      throw error;
    }
  }

  async getProducts(first: number = 10, after?: string) {
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

    const data = await this.makeRequest(query, { first, after });

    return {
      products: data.products?.edges?.map((edge: any) => edge.node) || [],
      pageInfo: data.products?.pageInfo || { hasNextPage: false },
    };
  }

  // ... rest of your methods remain the same
}

export const shopifyApi = new ShopifyApiClient();
export default shopifyApi;
