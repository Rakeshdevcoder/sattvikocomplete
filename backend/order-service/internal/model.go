package internal

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// OrderItem represents a single product in an order.
type OrderItem struct {
  ProductID primitive.ObjectID `bson:"productId" json:"productId"`
  Quantity  int                `bson:"quantity"  json:"quantity"`
  Price     float64            `bson:"price"     json:"price"`
}

// Order is the main order document.
type Order struct {
  ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
  UserID    primitive.ObjectID `bson:"userId"        json:"userId"`
  Items     []OrderItem        `bson:"items"         json:"items"`
  Total     float64            `bson:"total"         json:"total"`
  Status    string             `bson:"status"        json:"status"`
  CreatedAt time.Time          `bson:"createdAt"     json:"createdAt"`
}

// ErrOrderNotFound is returned when an order can't be found.
var ErrOrderNotFound = errors.New("order not found")
