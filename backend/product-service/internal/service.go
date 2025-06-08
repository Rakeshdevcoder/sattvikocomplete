// product-service/internal/service.go
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

type ProductService struct {
	col *mongo.Collection
}

// NewProductService connects to MongoDB and creates indexes.
func NewProductService(ctx context.Context, mongoURI string) (*ProductService, error) {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		return nil, err
	}
	col := client.Database("productsdb").Collection("products")

	// Create indexes for efficient queries
	idx := []mongo.IndexModel{
		{Keys: bson.D{{Key: "name", Value: "text"}, {Key: "title", Value: "text"}, {Key: "description", Value: "text"}}},
		{Keys: bson.M{"category": 1}},
		{Keys: bson.M{"features": 1}},
		{Keys: bson.M{"isTopSeller": 1}},
		{Keys: bson.M{"stars": -1}}, // For sorting by rating
	}
	if _, err := col.Indexes().CreateMany(ctx, idx); err != nil {
		return nil, err
	}

	return &ProductService{col: col}, nil
}

// Create adds a new product.
func (s *ProductService) Create(ctx context.Context, p *Product) (*Product, error) {
	now := time.Now().UTC()
	p.CreatedAt = now
	p.UpdatedAt = now

	// Initialize review values if not set
	if p.Stars == 0 {
		p.Stars = 0
	}
	if p.ReviewCount == 0 {
		p.ReviewCount = 0
	}

	res, err := s.col.InsertOne(ctx, p)
	if err != nil {
		return nil, err
	}
	p.ID = res.InsertedID.(primitive.ObjectID)
	return p, nil
}

// Get fetches a product by hex ID.
func (s *ProductService) Get(ctx context.Context, id string) (*Product, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var p Product
	if err := s.col.FindOne(ctx, bson.M{"_id": oid}).Decode(&p); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return &p, nil
}

// List returns all products, optionally filtered by category and/or feature.
func (s *ProductService) List(ctx context.Context, category, feature string) ([]Product, error) {
	filter := bson.M{}

	if category != "" {
		filter["category"] = category
	}

	if feature != "" {
		filter["features"] = feature
	}

	cursor, err := s.col.Find(ctx, filter, options.Find().SetSort(bson.M{"createdAt": -1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil {
		return nil, err
	}
	return products, nil
}

// Update modifies an existing product.
func (s *ProductService) Update(ctx context.Context, id string, p *Product) (*Product, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	// First, get the current product to preserve review data
	var current Product
	if err := s.col.FindOne(ctx, bson.M{"_id": oid}).Decode(&current); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}

	p.UpdatedAt = time.Now().UTC()

	// Preserve stars and reviewCount from the current product
	p.Stars = current.Stars
	p.ReviewCount = current.ReviewCount

	update := bson.M{
		"$set": bson.M{
			"title":           p.Title,
			"name":            p.Name,
			"description":     p.Description,
			"ingredientsDesc": p.IngredientsDesc,
			"regularPrice":    p.RegularPrice,
			"salesPrice":      p.SalesPrice,
			"price":           p.Price,
			"category":        p.Category,
			"images":          p.Images,
			"features":        p.Features,
			"weight":          p.Weight,
			"stock":           p.Stock,
			"isTopSeller":     p.IsTopSeller,
			"updatedAt":       p.UpdatedAt,
		},
	}

	res := s.col.FindOneAndUpdate(ctx, bson.M{"_id": oid}, update, options.FindOneAndUpdate().SetReturnDocument(options.After))

	var updated Product
	if err := res.Decode(&updated); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return &updated, nil
}

// Delete removes a product.
func (s *ProductService) Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	res, err := s.col.DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrProductNotFound
	}
	return nil
}

// AddReview adds a product review and updates the rating.
func (s *ProductService) AddReview(ctx context.Context, id string, rating float64, comment string) (*Product, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	// First, get the current product
	var product Product
	if err := s.col.FindOne(ctx, bson.M{"_id": oid}).Decode(&product); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}

	// Calculate new average rating
	newReviewCount := product.ReviewCount + 1
	currentTotalRating := product.Stars * float64(product.ReviewCount)
	newTotalRating := currentTotalRating + rating
	newAverageRating := newTotalRating / float64(newReviewCount)

	// Round to 1 decimal place
	newAverageRating = float64(int(newAverageRating*10)) / 10

	// Update the product
	update := bson.M{
		"$set": bson.M{
			"stars":       newAverageRating,
			"reviewCount": newReviewCount,
			"updatedAt":   time.Now().UTC(),
		},
	}

	// For a full review system, you would also store the review in a separate collection
	// and create a reference to it here

	res := s.col.FindOneAndUpdate(ctx, bson.M{"_id": oid}, update, options.FindOneAndUpdate().SetReturnDocument(options.After))

	var updated Product
	if err := res.Decode(&updated); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return &updated, nil
}

// GetTopSellers returns products marked as top sellers.
func (s *ProductService) GetTopSellers(ctx context.Context) ([]Product, error) {
	filter := bson.M{"isTopSeller": true}
	cursor, err := s.col.Find(ctx, filter, options.Find().SetSort(bson.M{"createdAt": -1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil {
		return nil, err
	}
	return products, nil
}

// GetHighestRated returns products with the highest ratings.
func (s *ProductService) GetHighestRated(ctx context.Context, limit int) ([]Product, error) {
	if limit <= 0 {
		limit = 10 // Default limit
	}

	options := options.Find().
		SetSort(bson.M{"stars": -1}).
		SetLimit(int64(limit))

	cursor, err := s.col.Find(ctx, bson.M{"reviewCount": bson.M{"$gt": 0}}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var products []Product
	if err := cursor.All(ctx, &products); err != nil {
		return nil, err
	}
	return products, nil
}
