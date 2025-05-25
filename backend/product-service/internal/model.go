// product-service/internal/model.go
package internal

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Product represents a single product with extended attributes.
type Product struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title           string             `bson:"title"                json:"title"`
	Name            string             `bson:"name"                 json:"name"`
	Description     string             `bson:"description"          json:"description"`
	IngredientsDesc string             `bson:"ingredientsDesc"      json:"ingredientsDesc"`
	RegularPrice    float64            `bson:"regularPrice"         json:"regularPrice"`
	SalesPrice      float64            `bson:"salesPrice"           json:"salesPrice,omitempty"`
	Price           float64            `bson:"price"                json:"price"` // Keep for backward compatibility
	Category        string             `bson:"category"             json:"category"`
	Images          []string           `bson:"images"               json:"images"`
	Stars           float64            `bson:"stars"                json:"stars"`
	ReviewCount     int                `bson:"reviewCount"          json:"reviewCount"`
	Features        []string           `bson:"features"             json:"features,omitempty"`
	Weight          string             `bson:"weight"               json:"weight,omitempty"`
	Stock           int                `bson:"stock"                json:"stock"`
	IsTopSeller     bool               `bson:"isTopSeller"          json:"isTopSeller,omitempty"`
	CreatedAt       time.Time          `bson:"createdAt"            json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt"            json:"updatedAt"`
}

// ErrProductNotFound is returned when a lookup fails.
var ErrProductNotFound = errors.New("product not found")
