// src/components/ShopifyTest.tsx
import React, { useEffect, useState } from "react";
import { shopifyApi } from "../api/shopifyApi";

const ShopifyTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [productSample, setProductSample] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runComprehensiveTests = async () => {
      console.log("🚀 Starting comprehensive Shopify API tests...");
      setLoading(true);

      try {
        // Test 1: Basic connection
        console.log("🧪 Test 1: Basic connection...");
        const basicTest = await shopifyApi.testConnection();

        // Test 2: Fetch method
        console.log("🧪 Test 2: Fetch method...");
        const fetchTest = await shopifyApi.testWithFetch();

        // Test 3: Get actual products
        console.log("🧪 Test 3: Fetching actual products...");
        let productsTest = false;
        let productCount = 0;
        let sampleProduct = null;

        try {
          const { products } = await shopifyApi.getProducts(5);
          productsTest = true;
          productCount = products.length;
          sampleProduct = products[0] || null;

          console.log("📦 Products fetched:", {
            count: productCount,
            products: products.map((p) => ({
              id: p.id,
              title: p.title,
              available: p.availableForSale,
              hasImages: p.images?.edges?.length > 0,
              hasVariants: p.variants?.edges?.length > 0,
              firstVariant: p.variants?.edges?.[0]?.node,
            })),
          });

          setProductSample(sampleProduct);
        } catch (error) {
          console.error("❌ Products test failed:", error);
        }

        // Test 4: Get collections
        console.log("🧪 Test 4: Fetching collections...");
        let collectionsTest = false;
        let collectionCount = 0;

        try {
          const collections = await shopifyApi.getCollections(3);
          collectionsTest = true;
          collectionCount = collections.length;

          console.log("📁 Collections fetched:", {
            count: collectionCount,
            collections: collections.map((c) => ({
              id: c.id,
              title: c.title,
              handle: c.handle,
              productCount: c.products?.edges?.length || 0,
            })),
          });
        } catch (error) {
          console.error("❌ Collections test failed:", error);
        }

        const results = {
          basicTest,
          fetchTest,
          productsTest,
          productCount,
          collectionsTest,
          collectionCount,
          timestamp: new Date().toISOString(),
          // Store detailed sample for debugging
          sampleProductStructure: sampleProduct
            ? {
                id: sampleProduct.id,
                title: sampleProduct.title,
                handle: sampleProduct.handle,
                availableForSale: sampleProduct.availableForSale,
                vendor: sampleProduct.vendor,
                productType: sampleProduct.productType,
                images: {
                  count: sampleProduct.images?.edges?.length || 0,
                  firstImage:
                    sampleProduct.images?.edges?.[0]?.node?.url || "none",
                },
                variants: {
                  count: sampleProduct.variants?.edges?.length || 0,
                  firstVariant: sampleProduct.variants?.edges?.[0]?.node
                    ? {
                        id: sampleProduct.variants.edges[0].node.id,
                        title: sampleProduct.variants.edges[0].node.title,
                        availableForSale:
                          sampleProduct.variants.edges[0].node.availableForSale,
                        price: sampleProduct.variants.edges[0].node.price,
                        compareAtPrice:
                          sampleProduct.variants.edges[0].node.compareAtPrice,
                      }
                    : "none",
                },
                priceRange: sampleProduct.priceRange,
              }
            : null,
        };

        setTestResults(results);
        console.log("✅ All tests completed:", results);
      } catch (error) {
        console.error("❌ Test suite failed:", error);
        setTestResults({
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    runComprehensiveTests();
  }, []);

  const handleRetryTests = () => {
    setTestResults({});
    setProductSample(null);
    setLoading(true);

    // Re-run tests after a small delay
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        margin: "20px",
        borderRadius: "8px",
        border: "1px solid #dee2e6",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: 0, color: "#495057" }}>
          🧪 Shopify API Comprehensive Test Results
        </h3>
        <button
          onClick={handleRetryTests}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Retry Tests
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>
            🔄 Running tests...
          </div>
          <div style={{ color: "#6c757d" }}>This may take a few seconds</div>
        </div>
      ) : (
        <>
          {/* Test Results Summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                padding: "15px",
                backgroundColor: testResults.basicTest ? "#d4edda" : "#f8d7da",
                border: `1px solid ${
                  testResults.basicTest ? "#c3e6cb" : "#f5c6cb"
                }`,
                borderRadius: "4px",
              }}
            >
              <strong>API Connection:</strong>
              <br />
              {testResults.basicTest ? "✅ Success" : "❌ Failed"}
            </div>

            <div
              style={{
                padding: "15px",
                backgroundColor: testResults.fetchTest ? "#d4edda" : "#f8d7da",
                border: `1px solid ${
                  testResults.fetchTest ? "#c3e6cb" : "#f5c6cb"
                }`,
                borderRadius: "4px",
              }}
            >
              <strong>Fetch Method:</strong>
              <br />
              {testResults.fetchTest ? "✅ Success" : "❌ Failed"}
            </div>

            <div
              style={{
                padding: "15px",
                backgroundColor: testResults.productsTest
                  ? "#d4edda"
                  : "#f8d7da",
                border: `1px solid ${
                  testResults.productsTest ? "#c3e6cb" : "#f5c6cb"
                }`,
                borderRadius: "4px",
              }}
            >
              <strong>Products:</strong>
              <br />
              {testResults.productsTest
                ? `✅ ${testResults.productCount} found`
                : "❌ Failed"}
            </div>

            <div
              style={{
                padding: "15px",
                backgroundColor: testResults.collectionsTest
                  ? "#d4edda"
                  : "#f8d7da",
                border: `1px solid ${
                  testResults.collectionsTest ? "#c3e6cb" : "#f5c6cb"
                }`,
                borderRadius: "4px",
              }}
            >
              <strong>Collections:</strong>
              <br />
              {testResults.collectionsTest
                ? `✅ ${testResults.collectionCount} found`
                : "❌ Failed"}
            </div>
          </div>

          {/* Detailed Results */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <h4 style={{ marginTop: 0, color: "#495057" }}>
                📋 Full Test Results
              </h4>
              <pre
                style={{
                  backgroundColor: "#ffffff",
                  padding: "15px",
                  borderRadius: "4px",
                  border: "1px solid #dee2e6",
                  fontSize: "12px",
                  overflow: "auto",
                  maxHeight: "300px",
                }}
              >
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>

            {productSample && (
              <div>
                <h4 style={{ marginTop: 0, color: "#495057" }}>
                  📦 Sample Product Data
                </h4>
                <pre
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "15px",
                    borderRadius: "4px",
                    border: "1px solid #dee2e6",
                    fontSize: "12px",
                    overflow: "auto",
                    maxHeight: "300px",
                  }}
                >
                  {JSON.stringify(testResults.sampleProductStructure, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Debugging Tips */}
          {testResults.error && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#f8d7da",
                border: "1px solid #f5c6cb",
                borderRadius: "4px",
                color: "#721c24",
              }}
            >
              <strong>❌ Error:</strong> {testResults.error}
            </div>
          )}

          {!testResults.productsTest && testResults.basicTest && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "4px",
                color: "#856404",
              }}
            >
              <strong>⚠️ Note:</strong> API connection works but no products
              found. This could mean:
              <ul style={{ marginBottom: 0, marginTop: "10px" }}>
                <li>Your Shopify store has no published products</li>
                <li>Products are not available for the storefront API</li>
                <li>Access token permissions may be limited</li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShopifyTest;
