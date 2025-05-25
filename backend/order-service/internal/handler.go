package internal

import (
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CreateOrderRequest struct {
	Items []OrderItem `json:"items" validate:"required,min=1,dive,required"`
}

type UpdateOrderRequest struct {
	ProductID string `json:"product_id"  validate:"required"`
	Quantity  int    `json:"quantity"    validate:"required,min=1"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}


type OrderHandler struct {
	svc    *OrderService
	jwtKey string
	log    *logrus.Logger
}

func NewOrderHandler(svc *OrderService, jwtKey string, log *logrus.Logger) *OrderHandler {
	return &OrderHandler{svc: svc, jwtKey: jwtKey, log: log}
}

// AuthMiddleware checks Bearer JWT, injects userID into context.
func (h *OrderHandler) AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
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
		c.Set("userID", userID)
		return next(c)
	}
}

// CreateOrder → POST /orders
func (h *OrderHandler) CreateOrder(c echo.Context) error {
	req := new(CreateOrderRequest)
	if err := c.Bind(req); err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	userID := c.Get("userID").(string)
	order, err := h.svc.CreateOrder(c.Request().Context(), userID, req.Items)
	if err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not create order")
	}
	return c.JSON(http.StatusCreated, order)
}

// GetOrder → GET /orders/:id
func (h *OrderHandler) GetOrder(c echo.Context) error {
	id := c.Param("id")
	order, err := h.svc.GetOrder(c.Request().Context(), id)
	if err != nil {
		if errors.Is(err, ErrOrderNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "order not found")
		}
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not fetch order")
	}
	return c.JSON(http.StatusOK, order)
}

// ListOrders → GET /orders
func (h *OrderHandler) ListOrders(c echo.Context) error {
	userID := c.Get("userID").(string)
	orders, err := h.svc.ListOrders(c.Request().Context(), userID)
	if err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not list orders")
	}
	return c.JSON(http.StatusOK, orders)
}

// UpdateOrder → PUT /orders/:id
func (h *OrderHandler) UpdateOrder(c echo.Context) error {
	id := c.Param("id")
	var req UpdateOrderRequest
	if err := c.Bind(&req); err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid payload")
	}

	// Convert productID hex-string to ObjectID
	prodOID, err := primitive.ObjectIDFromHex(req.ProductID)
	if err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid product_id")
	}

	// Call service with the proper types
	updated, err := h.svc.UpdateOrder(c.Request().Context(), id, prodOID, req.Quantity)
	if err != nil {
		if errors.Is(err, ErrOrderNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "order not found")
		}
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "update failed")
	}
	return c.JSON(http.StatusOK, updated)
}

// DeleteOrder → DELETE /orders/:id
func (h *OrderHandler) DeleteOrder(c echo.Context) error {
	id := c.Param("id")
	if err := h.svc.DeleteOrder(c.Request().Context(), id); err != nil {
		if errors.Is(err, ErrOrderNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "order not found")
		}
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "delete failed")
	}
	return c.NoContent(http.StatusNoContent)
}
