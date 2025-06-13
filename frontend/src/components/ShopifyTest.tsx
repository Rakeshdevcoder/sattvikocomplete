// src/components/ShopifyTest.tsx
import React, { useEffect, useState } from "react";
import { shopifyApi } from "../api/shopifyApi";

const ShopifyTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    const runTests = async () => {
      console.log("🚀 Starting Shopify API tests...");

      try {
        // Test 1: Basic connection
        const basicTest = await shopifyApi.testConnection();
        console.log("Basic test result:", basicTest);

        // Test 2: Fetch method
        const fetchTest = await shopifyApi.testWithFetch();
        console.log("Fetch test result:", fetchTest);

        setTestResults({
          basicTest,
          fetchTest,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Test failed:", error);
        setTestResults({
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    };

    runTests();
  }, []);

  return (
    <div
      style={{ padding: "20px", backgroundColor: "#f5f5f5", margin: "20px" }}
    >
      <h3>🧪 Shopify API Test Results</h3>
      <pre
        style={{
          backgroundColor: "#fff",
          padding: "10px",
          borderRadius: "4px",
        }}
      >
        {JSON.stringify(testResults, null, 2)}
      </pre>
    </div>
  );
};

export default ShopifyTest;
