// cart-service/internal/model.go
package internal

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CartStatus represents the current state of a cart
type CartStatus string

const (
	CartStatusActive     CartStatus = "active"
	CartStatusAbandoned  CartStatus = "abandoned"
	CartStatusCompleted  CartStatus = "completed"
	CartStatusProcessing CartStatus = "processing"
)

// Cart represents a shopping cart
type Cart struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID       string             `bson:"userId,omitempty" json:"userId,omitempty"` // optional for guest carts
	Status       CartStatus         `bson:"status" json:"status"`
	Items        []CartItem         `bson:"items" json:"items"`
	Subtotal     float64            `bson:"subtotal" json:"subtotal"`
	TaxAmount    float64            `bson:"taxAmount" json:"taxAmount"`
	ShippingCost float64            `bson:"shippingCost" json:"shippingCost"`
	TotalAmount  float64            `bson:"totalAmount" json:"totalAmount"`
	Coupon       *Coupon            `bson:"coupon,omitempty" json:"coupon,omitempty"`
	Metadata     map[string]string  `bson:"metadata,omitempty" json:"metadata,omitempty"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
	ExpiresAt    time.Time          `bson:"expiresAt" json:"expiresAt"`
}

// CartItem represents a product in the cart
type CartItem struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID   string             `bson:"productId" json:"productId"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	Price       float64            `bson:"price" json:"price"`
	Quantity    int                `bson:"quantity" json:"quantity"`
	Weight      string             `bson:"weight,omitempty" json:"weight,omitempty"`
	Image       string             `bson:"image,omitempty" json:"image,omitempty"`
	Metadata    map[string]string  `bson:"metadata,omitempty" json:"metadata,omitempty"`
	AddedAt     time.Time          `bson:"addedAt" json:"addedAt"`
}

// Coupon represents a discount coupon applied to a cart
type Coupon struct {
	Code          string    `bson:"code" json:"code"`
	DiscountType  string    `bson:"discountType" json:"discountType"` // percentage, fixed
	DiscountValue float64   `bson:"discountValue" json:"discountValue"`
	AppliedAt     time.Time `bson:"appliedAt" json:"appliedAt"`
}

// Standard errors
var (
	ErrCartNotFound        = errors.New("cart not found")
	ErrCartExpired         = errors.New("cart has expired")
	ErrItemNotInCart       = errors.New("item not in cart")
	ErrProductNotAvailable = errors.New("product not available or insufficient stock")
	ErrCouponNotValid      = errors.New("coupon not valid or expired")
	ErrQuantityInvalid     = errors.New("quantity must be greater than zero")
	ErrCartEmpty           = errors.New("cart is empty")
)

// CreateCartRequest is used for creating a new cart
type CreateCartRequest struct {
	UserID   string            `json:"userId,omitempty"`
	Metadata map[string]string `json:"metadata,omitempty"`
}

// AddItemRequest is used for adding items to a cart
type AddItemRequest struct {
	ProductID   string            `json:"productId" validate:"required"`
	Title       string            `json:"title" validate:"required"`
	Description string            `json:"description,omitempty"`
	Price       float64           `json:"price" validate:"required,gt=0"`
	Quantity    int               `json:"quantity" validate:"required,gt=0"`
	Weight      string            `json:"weight,omitempty"`
	Image       string            `json:"image,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// UpdateItemRequest is used for updating cart items
type UpdateItemRequest struct {
	Quantity int `json:"quantity" validate:"required,gt=0"`
}

// ApplyCouponRequest is used for applying coupons
type ApplyCouponRequest struct {
	Code string `json:"code" validate:"required"`
}

// CartSummary provides a simplified view of the cart
type CartSummary struct {
	ID          string     `json:"id"`
	ItemCount   int        `json:"itemCount"`
	TotalAmount float64    `json:"totalAmount"`
	Status      CartStatus `json:"status"`
}

// CartStatistics contains analytics data for carts
type CartStatistics struct {
	TotalCarts       int     `json:"totalCarts"`
	ActiveCarts      int     `json:"activeCarts"`
	AbandonedCarts   int     `json:"abandonedCarts"`
	CompletedCarts   int     `json:"completedCarts"`
	AverageCartValue float64 `json:"averageCartValue"`
}