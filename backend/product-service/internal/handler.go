// product-service/internal/handler.go
package internal

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
)

type productDTO struct {
	Title           string   `json:"title" validate:"required"`
	Name            string   `json:"name" validate:"required"`
	Description     string   `json:"description" validate:"required"`
	IngredientsDesc string   `json:"ingredientsDesc"`
	RegularPrice    float64  `json:"regularPrice" validate:"required,gt=0"`
	SalesPrice      float64  `json:"salesPrice"`
	Category        string   `json:"category" validate:"required"`
	Images          []string `json:"images" validate:"required,min=1"`
	Stars           float64  `json:"stars"`       // Added for initial rating
	ReviewCount     int      `json:"reviewCount"` // Added for initial review count
	Features        []string `json:"features"`
	Weight          string   `json:"weight"`
	Stock           int      `json:"stock" validate:"required,gte=0"`
	IsTopSeller     bool     `json:"isTopSeller"`
}

type ProductHandler struct {
	svc    *ProductService
	jwtKey string
	log    *logrus.Logger
}

// NewProductHandler wires up service, JWT secret, and logger.
func NewProductHandler(svc *ProductService, jwtKey string, log *logrus.Logger) *ProductHandler {
	return &ProductHandler{svc: svc, jwtKey: jwtKey, log: log}
}

// AuthMiddleware guards write operations.
func (h *ProductHandler) AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		auth := c.Request().Header.Get("Authorization")
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid auth header")
		}
		if _, err := ValidateToken(parts[1], h.jwtKey); err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
		}
		return next(c)
	}
}

// Create → POST /products
func (h *ProductHandler) Create(c echo.Context) error {
	dto := new(productDTO)
	if err := c.Bind(dto); err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}
	if err := c.Validate(dto); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Determine the effective price (regular price or sales price if available)
	price := dto.RegularPrice
	if dto.SalesPrice > 0 && dto.SalesPrice < dto.RegularPrice {
		price = dto.SalesPrice
	}

	prod := &Product{
		Title:           dto.Title,
		Name:            dto.Name,
		Description:     dto.Description,
		IngredientsDesc: dto.IngredientsDesc,
		RegularPrice:    dto.RegularPrice,
		SalesPrice:      dto.SalesPrice,
		Price:           price, // Set effective price for backward compatibility
		Category:        dto.Category,
		Images:          dto.Images,
		Stars:           dto.Stars,       // Use value from request
		ReviewCount:     dto.ReviewCount, // Use value from request
		Features:        dto.Features,
		Weight:          dto.Weight,
		Stock:           dto.Stock,
		IsTopSeller:     dto.IsTopSeller,
	}
	created, err := h.svc.Create(c.Request().Context(), prod)
	if err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not create product")
	}
	return c.JSON(http.StatusCreated, created)
}

// Get → GET /products/:id
func (h *ProductHandler) Get(c echo.Context) error {
	id := c.Param("id")
	prod, err := h.svc.Get(c.Request().Context(), id)
	if err != nil {
		if err == ErrProductNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "product not found")
		}
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not fetch product")
	}
	return c.JSON(http.StatusOK, prod)
}

// List → GET /products[?category=...]
func (h *ProductHandler) List(c echo.Context) error {
	cat := c.QueryParam("category")
	feature := c.QueryParam("feature")
	prods, err := h.svc.List(c.Request().Context(), cat, feature)
	if err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not list products")
	}
	return c.JSON(http.StatusOK, prods)
}

// Update → PUT /products/:id
func (h *ProductHandler) Update(c echo.Context) error {
	id := c.Param("id")
	dto := new(productDTO)
	if err := c.Bind(dto); err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}
	if err := c.Validate(dto); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Determine the effective price (regular price or sales price if available)
	price := dto.RegularPrice
	if dto.SalesPrice > 0 && dto.SalesPrice < dto.RegularPrice {
		price = dto.SalesPrice
	}

	// Get existing product to preserve values if not provided in this update
	existingProd, err := h.svc.Get(c.Request().Context(), id)
	if err != nil {
		if err == ErrProductNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "product not found")
		}
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not fetch product")
	}

	// Determine if we should update stars and review count
	stars := existingProd.Stars
	reviewCount := existingProd.ReviewCount

	// Only update stars and review count if they were explicitly provided
	if dto.Stars > 0 {
		stars = dto.Stars
	}

	if dto.ReviewCount > 0 {
		reviewCount = dto.ReviewCount
	}

	prod := &Product{
		Title:           dto.Title,
		Name:            dto.Name,
		Description:     dto.Description,
		IngredientsDesc: dto.IngredientsDesc,
		RegularPrice:    dto.RegularPrice,
		SalesPrice:      dto.SalesPrice,
		Price:           price, // Set effective price for backward compatibility
		Category:        dto.Category,
		Images:          dto.Images,
		Stars:           stars,
		ReviewCount:     reviewCount,
		Features:        dto.Features,
		Weight:          dto.Weight,
		Stock:           dto.Stock,
		IsTopSeller:     dto.IsTopSeller,
	}

	updated, err := h.svc.Update(c.Request().Context(), id, prod)
	if err != nil {
		if err == ErrProductNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "product not found")
		}
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not update product")
	}
	return c.JSON(http.StatusOK, updated)
}

// Delete → DELETE /products/:id
func (h *ProductHandler) Delete(c echo.Context) error {
	id := c.Param("id")
	if err := h.svc.Delete(c.Request().Context(), id); err != nil {
		if err == ErrProductNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "product not found")
		}
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not delete product")
	}
	return c.NoContent(http.StatusNoContent)
}

// AddReview → POST /products/:id/reviews
func (h *ProductHandler) AddReview(c echo.Context) error {
	id := c.Param("id")

	type reviewDTO struct {
		Rating  float64 `json:"rating" validate:"required,min=1,max=5"`
		Comment string  `json:"comment"`
	}

	review := new(reviewDTO)
	if err := c.Bind(review); err != nil {
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(review); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	updated, err := h.svc.AddReview(c.Request().Context(), id, review.Rating, review.Comment)
	if err != nil {
		if err == ErrProductNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "product not found")
		}
		h.log.Error(err)
		return echo.NewHTTPError(http.StatusInternalServerError, "could not add review")
	}

	return c.JSON(http.StatusOK, updated)
}
