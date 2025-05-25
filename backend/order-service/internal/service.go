// internal/service.go
package internal

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ErrOrderNotFound is imported from model.go.

// OrderService wraps Mongo access.
type OrderService struct {
	col *mongo.Collection
}

// NewOrderService connects to Mongo and ensures indexes.
func NewOrderService(ctx context.Context, mongoURI string) (*OrderService, error) {
	clientOpts := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		return nil, err
	}
	col := client.Database("ordersdb").Collection("orders")

	// Index on userId + createdAt
	idxModels := []mongo.IndexModel{
		{Keys: bson.M{"userId": 1}},
		{Keys: bson.M{"createdAt": -1}},
	}
	if _, err := col.Indexes().CreateMany(ctx, idxModels); err != nil {
		return nil, err
	}

	return &OrderService{col: col}, nil
}

// CreateOrder inserts a new order for the given user.
func (s *OrderService) CreateOrder(ctx context.Context, userID string, items []OrderItem) (*Order, error) {
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}
	now := time.Now()

	total := 0.0
	for _, it := range items {
		total += float64(it.Quantity) * it.Price
	}

	order := &Order{
		UserID:    uid,
		Items:     items,
		Total:     total,
		Status:    "pending",
		CreatedAt: now,
	}
	res, err := s.col.InsertOne(ctx, order)
	if err != nil {
		return nil, err
	}
	order.ID = res.InsertedID.(primitive.ObjectID)
	return order, nil
}

// GetOrder finds an order by its hex ID.
func (s *OrderService) GetOrder(ctx context.Context, orderID string) (*Order, error) {
	oid, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return nil, err
	}
	var ord Order
	if err := s.col.FindOne(ctx, bson.M{"_id": oid}).Decode(&ord); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}
	return &ord, nil
}

// ListOrders returns all orders for the given user, most recent first.
func (s *OrderService) ListOrders(ctx context.Context, userID string) ([]Order, error) {
	uid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}
	cursor, err := s.col.Find(ctx, bson.M{"userId": uid}, options.Find().SetSort(bson.M{"createdAt": -1}))
	if err != nil {
		return nil, err
	}
	var orders []Order
	if err := cursor.All(ctx, &orders); err != nil {
		return nil, err
	}
	return orders, nil
}

func (s *OrderService) UpdateOrder(ctx context.Context, orderID string, productID primitive.ObjectID, quantity int) (*Order, error) {
	oid, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return nil, err
	}

	filter := bson.M{
		"_id":             oid,
		"items.productId": productID,
	}
	update := bson.M{
		"$set": bson.M{"items.$.quantity": quantity},
	}
	// Return the document *after* update
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)

	var updated Order
	err = s.col.FindOneAndUpdate(ctx, filter, update, opts).Decode(&updated)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}
	return &updated, nil
}

// DeleteOrder removes an order by its ID.
func (s *OrderService) DeleteOrder(ctx context.Context, orderID string) error {
	oid, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return err
	}
	res, err := s.col.DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrOrderNotFound
	}
	return nil
}
