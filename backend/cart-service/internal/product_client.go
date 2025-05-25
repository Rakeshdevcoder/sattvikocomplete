// cart-service/internal/product_client.go
package internal

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// HTTPProductServiceClient is a client for the product service
type HTTPProductServiceClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewHTTPProductServiceClient creates a new product service client
func NewHTTPProductServiceClient(baseURL string, timeout time.Duration) *HTTPProductServiceClient {
	return &HTTPProductServiceClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// Product represents a product from the product service
type Product struct {
	ID    string  `json:"id"`
	Stock int     `json:"stock"`
	Price float64 `json:"price"`
}

// CheckProductAvailability checks if a product is available in the requested quantity
func (c *HTTPProductServiceClient) CheckProductAvailability(ctx context.Context, productID string, quantity int) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/products/%s", c.baseURL, productID), nil)
	if err != nil {
		return err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return ErrProductNotAvailable
		}
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var product Product
	if err := json.NewDecoder(resp.Body).Decode(&product); err != nil {
		return err
	}

	if product.Stock < quantity {
		return ErrProductNotAvailable
	}

	return nil
}

// MockProductServiceClient is a mock client for testing
type MockProductServiceClient struct {
	AvailableProducts map[string]int
}

// NewMockProductServiceClient creates a new mock product service client
func NewMockProductServiceClient() *MockProductServiceClient {
	return &MockProductServiceClient{
		AvailableProducts: make(map[string]int),
	}
}

// CheckProductAvailability checks if a product is available in the requested quantity
func (c *MockProductServiceClient) CheckProductAvailability(ctx context.Context, productID string, quantity int) error {
	stock, exists := c.AvailableProducts[productID]
	if !exists {
		return ErrProductNotAvailable
	}

	if stock < quantity {
		return ErrProductNotAvailable
	}

	return nil
}

// SetProductStock sets the available stock for a product
func (c *MockProductServiceClient) SetProductStock(productID string, stock int) {
	c.AvailableProducts[productID] = stock
}
