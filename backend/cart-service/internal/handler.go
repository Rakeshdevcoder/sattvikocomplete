// cart-service/internal/handler.go
package internal

import (
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
)

type CartHandler struct {
	svc    *CartService
	jwtKey string
	log    *logrus.Logger
}

// NewCartHandler creates a new cart handler
func NewCartHandler(svc *CartService, jwtKey string, log *logrus.Logger) *CartHandler {
	return &CartHandler{
		svc:    svc,
		jwtKey: jwtKey,
		log:    log,
	}
}

// AuthMiddleware verifies JWT tokens
func (h *CartHandler) AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		auth := c.Request().Header.Get("Authorization")
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid auth header")
		}

		userID, err := ValidateToken(parts[1], h.jwtKey)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
		}

		// Store userID in context for later use
		c.Set("userID", userID)
		return next(c)
	}
}

// OptionalAuthMiddleware checks for JWT but doesn't require it
func (h *CartHandler) OptionalAuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		auth := c.Request().Header.Get("Authorization")
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) == 2 && parts[0] == "Bearer" {
			userID, err := ValidateToken(parts[1], h.jwtKey)
			if err == nil {
				c.Set("userID", userID)
			}
		}
		return next(c)
	}
}

// CreateCart creates a new shopping cart
// POST /carts
func (h *CartHandler) CreateCart(c echo.Context) error {
	req := new(CreateCartRequest)
	if err := c.Bind(req); err != nil {
		h.log.WithError(err).Error("Invalid request format")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request format")
	}

	// If user is authenticated, use the user ID from the token
	if userID, ok := c.Get("userID").(string); ok && userID != "" {
		req.UserID = userID
	}

	cart, err := h.svc.CreateCart(c.Request().Context(), req)
	if err != nil {
		h.log.WithError(err).Error("Failed to create cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create cart")
	}

	return c.JSON(http.StatusCreated, cart)
}

// GetCart retrieves a cart by ID
// GET /carts/:id
func (h *CartHandler) GetCart(c echo.Context) error {
	cartID := c.Param("id")

	cart, err := h.svc.GetCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartExpired {
			return echo.NewHTTPError(http.StatusGone, "Cart has expired")
		}
		h.log.WithError(err).Error("Failed to retrieve cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart")
	}

	// For security, only allow access to user's own cart
	if userID, ok := c.Get("userID").(string); ok && cart.UserID != "" && cart.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "Not authorized to access this cart")
	}

	return c.JSON(http.StatusOK, cart)
}

// GetUserCart retrieves the active cart for the authenticated user
// GET /user/cart
func (h *CartHandler) GetUserCart(c echo.Context) error {
	userID, ok := c.Get("userID").(string)
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "User authentication required")
	}

	cart, err := h.svc.GetCartByUserID(c.Request().Context(), userID)
	if err != nil {
		if err == ErrCartNotFound {
			// If no cart exists, create a new one
			newCart, err := h.svc.CreateCart(c.Request().Context(), &CreateCartRequest{
				UserID: userID,
			})
			if err != nil {
				h.log.WithError(err).Error("Failed to create user cart")
				return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create cart")
			}
			return c.JSON(http.StatusOK, newCart)
		}
		if err == ErrCartExpired {
			// If cart expired, create a new one
			newCart, err := h.svc.CreateCart(c.Request().Context(), &CreateCartRequest{
				UserID: userID,
			})
			if err != nil {
				h.log.WithError(err).Error("Failed to create user cart")
				return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create cart")
			}
			return c.JSON(http.StatusOK, newCart)
		}
		h.log.WithError(err).Error("Failed to retrieve user cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart")
	}

	return c.JSON(http.StatusOK, cart)
}

// AddCartItem adds an item to a cart
// POST /carts/:id/items
func (h *CartHandler) AddCartItem(c echo.Context) error {
	cartID := c.Param("id")

	// First, check if cart exists and user has access
	cart, err := h.svc.GetCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartExpired {
			return echo.NewHTTPError(http.StatusGone, "Cart has expired")
		}
		h.log.WithError(err).Error("Failed to retrieve cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart")
	}

	// For security, only allow access to user's own cart
	if userID, ok := c.Get("userID").(string); ok && cart.UserID != "" && cart.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "Not authorized to access this cart")
	}

	// Get item details from request
	item := new(AddItemRequest)
	if err := c.Bind(item); err != nil {
		h.log.WithError(err).Error("Invalid request format")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request format")
	}

	if err := c.Validate(item); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Add item to cart
	updatedCart, err := h.svc.AddItem(c.Request().Context(), cartID, item)
	if err != nil {
		if err == ErrProductNotAvailable {
			return echo.NewHTTPError(http.StatusBadRequest, "Product not available or insufficient stock")
		}
		h.log.WithError(err).Error("Failed to add item to cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to add item to cart")
	}

	return c.JSON(http.StatusOK, updatedCart)
}

// UpdateCartItem updates an item in a cart
// PUT /carts/:id/items/:itemId
func (h *CartHandler) UpdateCartItem(c echo.Context) error {
	cartID := c.Param("id")
	itemID := c.Param("itemId")

	// First, check if cart exists and user has access
	cart, err := h.svc.GetCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartExpired {
			return echo.NewHTTPError(http.StatusGone, "Cart has expired")
		}
		h.log.WithError(err).Error("Failed to retrieve cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart")
	}

	// For security, only allow access to user's own cart
	if userID, ok := c.Get("userID").(string); ok && cart.UserID != "" && cart.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "Not authorized to access this cart")
	}

	// Get update details
	req := new(UpdateItemRequest)
	if err := c.Bind(req); err != nil {
		h.log.WithError(err).Error("Invalid request format")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request format")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Update the item
	updatedCart, err := h.svc.UpdateItem(c.Request().Context(), cartID, itemID, req)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrItemNotInCart {
			return echo.NewHTTPError(http.StatusNotFound, "Item not found in cart")
		}
		if err == ErrQuantityInvalid {
			return echo.NewHTTPError(http.StatusBadRequest, "Quantity must be greater than zero")
		}
		if err == ErrProductNotAvailable {
			return echo.NewHTTPError(http.StatusBadRequest, "Product not available or insufficient stock")
		}
		h.log.WithError(err).Error("Failed to update cart item")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update cart item")
	}

	return c.JSON(http.StatusOK, updatedCart)
}

// RemoveCartItem removes an item from a cart
// DELETE /carts/:id/items/:itemId
func (h *CartHandler) RemoveCartItem(c echo.Context) error {
	cartID := c.Param("id")
	itemID := c.Param("itemId")

	// First, check if cart exists and user has access
	cart, err := h.svc.GetCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartExpired {
			return echo.NewHTTPError(http.StatusGone, "Cart has expired")
		}
		h.log.WithError(err).Error("Failed to retrieve cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart")
	}

	// For security, only allow access to user's own cart
	if userID, ok := c.Get("userID").(string); ok && cart.UserID != "" && cart.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "Not authorized to access this cart")
	}

	// Remove the item
	updatedCart, err := h.svc.RemoveItem(c.Request().Context(), cartID, itemID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrItemNotInCart {
			return echo.NewHTTPError(http.StatusNotFound, "Item not found in cart")
		}
		h.log.WithError(err).Error("Failed to remove cart item")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to remove cart item")
	}

	return c.JSON(http.StatusOK, updatedCart)
}

// ClearCart removes all items from a cart
// DELETE /carts/:id/items
func (h *CartHandler) ClearCart(c echo.Context) error {
	cartID := c.Param("id")

	// First, check if cart exists and user has access
	cart, err := h.svc.GetCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartExpired {
			return echo.NewHTTPError(http.StatusGone, "Cart has expired")
		}
		h.log.WithError(err).Error("Failed to retrieve cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart")
	}

	// For security, only allow access to user's own cart
	if userID, ok := c.Get("userID").(string); ok && cart.UserID != "" && cart.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "Not authorized to access this cart")
	}

	// Clear the cart
	updatedCart, err := h.svc.ClearCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		h.log.WithError(err).Error("Failed to clear cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to clear cart")
	}

	return c.JSON(http.StatusOK, updatedCart)
}

// ApplyCoupon applies a coupon to a cart
// POST /carts/:id/coupon
func (h *CartHandler) ApplyCoupon(c echo.Context) error {
	cartID := c.Param("id")

	// First, check if cart exists and user has access
	cart, err := h.svc.GetCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartExpired {
			return echo.NewHTTPError(http.StatusGone, "Cart has expired")
		}
		h.log.WithError(err).Error("Failed to retrieve cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart")
	}

	// For security, only allow access to user's own cart
	if userID, ok := c.Get("userID").(string); ok && cart.UserID != "" && cart.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "Not authorized to access this cart")
	}

	// Get coupon code from request
	req := new(ApplyCouponRequest)
	if err := c.Bind(req); err != nil {
		h.log.WithError(err).Error("Invalid request format")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request format")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Apply the coupon
	updatedCart, err := h.svc.ApplyCoupon(c.Request().Context(), cartID, req)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartEmpty {
			return echo.NewHTTPError(http.StatusBadRequest, "Cannot apply coupon to empty cart")
		}
		if err == ErrCouponNotValid {
			return echo.NewHTTPError(http.StatusBadRequest, "Coupon not valid or expired")
		}
		h.log.WithError(err).Error("Failed to apply coupon")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to apply coupon")
	}

	return c.JSON(http.StatusOK, updatedCart)
}

// RemoveCoupon removes a coupon from a cart
// DELETE /carts/:id/coupon
func (h *CartHandler) RemoveCoupon(c echo.Context) error {
	cartID := c.Param("id")

	// First, check if cart exists and user has access
	cart, err := h.svc.GetCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartExpired {
			return echo.NewHTTPError(http.StatusGone, "Cart has expired")
		}
		h.log.WithError(err).Error("Failed to retrieve cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart")
	}

	// For security, only allow access to user's own cart
	if userID, ok := c.Get("userID").(string); ok && cart.UserID != "" && cart.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "Not authorized to access this cart")
	}

	// Remove the coupon
	updatedCart, err := h.svc.RemoveCoupon(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		h.log.WithError(err).Error("Failed to remove coupon")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to remove coupon")
	}

	return c.JSON(http.StatusOK, updatedCart)
}

// CheckoutCart processes a cart for checkout
// POST /carts/:id/checkout
func (h *CartHandler) CheckoutCart(c echo.Context) error {
	cartID := c.Param("id")

	// First, check if cart exists and user has access
	cart, err := h.svc.GetCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartExpired {
			return echo.NewHTTPError(http.StatusGone, "Cart has expired")
		}
		h.log.WithError(err).Error("Failed to retrieve cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart")
	}

	// For security, only allow access to user's own cart
	if userID, ok := c.Get("userID").(string); ok && cart.UserID != "" && cart.UserID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "Not authorized to access this cart")
	}

	// Start checkout process
	updatedCart, err := h.svc.CheckoutCart(c.Request().Context(), cartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Cart not found")
		}
		if err == ErrCartEmpty {
			return echo.NewHTTPError(http.StatusBadRequest, "Cannot checkout empty cart")
		}
		h.log.WithError(err).Error("Failed to checkout cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to checkout cart")
	}

	return c.JSON(http.StatusOK, updatedCart)
}

// MergeGuestCart merges a guest cart into a user's cart
// POST /carts/:id/merge
func (h *CartHandler) MergeGuestCart(c echo.Context) error {
	userCartID := c.Param("id")

	// Extract guest cart ID from request
	type MergeRequest struct {
		GuestCartID string `json:"guestCartId" validate:"required"`
	}

	req := new(MergeRequest)
	if err := c.Bind(req); err != nil {
		h.log.WithError(err).Error("Invalid request format")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request format")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// First, check if user cart exists and user has access
	userCart, err := h.svc.GetCart(c.Request().Context(), userCartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "User cart not found")
		}
		h.log.WithError(err).Error("Failed to retrieve user cart")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve user cart")
	}

	// For security, only allow access to user's own cart
	if userID, ok := c.Get("userID").(string); ok {
		if userCart.UserID == "" {
			// This is a guest cart, not a user cart
			return echo.NewHTTPError(http.StatusBadRequest, "Target cart must be a user cart")
		}

		if userCart.UserID != userID {
			return echo.NewHTTPError(http.StatusForbidden, "Not authorized to access this cart")
		}
	} else {
		return echo.NewHTTPError(http.StatusUnauthorized, "Authentication required")
	}

	// Merge the carts
	mergedCart, err := h.svc.MergeGuestCart(c.Request().Context(), userCartID, req.GuestCartID)
	if err != nil {
		if err == ErrCartNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "One of the carts was not found")
		}
		h.log.WithError(err).Error("Failed to merge carts")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to merge carts")
	}

	return c.JSON(http.StatusOK, mergedCart)
}

// GetCartStatistics retrieves cart analytics
// GET /admin/carts/statistics
func (h *CartHandler) GetCartStatistics(c echo.Context) error {
	// Parse time range from query params
	rangeParam := c.QueryParam("range")
	timeRange := 24 * time.Hour // Default to 24 hours

	if rangeParam != "" {
		switch rangeParam {
		case "day":
			timeRange = 24 * time.Hour
		case "week":
			timeRange = 7 * 24 * time.Hour
		case "month":
			timeRange = 30 * 24 * time.Hour
		}
	}

	stats, err := h.svc.GetCartStatistics(c.Request().Context(), timeRange)
	if err != nil {
		h.log.WithError(err).Error("Failed to retrieve cart statistics")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve cart statistics")
	}

	return c.JSON(http.StatusOK, stats)
}
