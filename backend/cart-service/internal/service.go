// cart-service/internal/service.go
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

// CartService handles cart business logic
type CartService struct {
	cartCol      *mongo.Collection
	productSvc   ProductServiceClient
	cartTTL      time.Duration
	taxRate      float64
	shippingCost float64
}

// ProductServiceClient defines the interface for product service interaction
type ProductServiceClient interface {
	CheckProductAvailability(ctx context.Context, productID string, quantity int) error
}

// NewCartService creates a new cart service
func NewCartService(
	ctx context.Context,
	mongoURI string,
	productSvc ProductServiceClient,
	cartTTL time.Duration,
	taxRate float64,
	shippingCost float64,
) (*CartService, error) {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		return nil, err
	}

	// Ping the database to verify connection
	if err = client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	cartCol := client.Database("cartsdb").Collection("carts")

	// Create indexes
	indexModels := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "userId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "expiresAt", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(0),
		},
	}

	if _, err := cartCol.Indexes().CreateMany(ctx, indexModels); err != nil {
		return nil, err
	}

	return &CartService{
		cartCol:      cartCol,
		productSvc:   productSvc,
		cartTTL:      cartTTL,
		taxRate:      taxRate,
		shippingCost: shippingCost,
	}, nil
}

// CreateCart creates a new shopping cart
func (s *CartService) CreateCart(ctx context.Context, req *CreateCartRequest) (*Cart, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(s.cartTTL)

	cart := &Cart{
		UserID:       req.UserID,
		Status:       CartStatusActive,
		Items:        []CartItem{},
		Subtotal:     0,
		TaxAmount:    0,
		ShippingCost: 0,
		TotalAmount:  0,
		Metadata:     req.Metadata,
		CreatedAt:    now,
		UpdatedAt:    now,
		ExpiresAt:    expiresAt,
	}

	result, err := s.cartCol.InsertOne(ctx, cart)
	if err != nil {
		return nil, err
	}

	cart.ID = result.InsertedID.(primitive.ObjectID)
	return cart, nil
}

// GetCart retrieves a cart by ID
func (s *CartService) GetCart(ctx context.Context, cartID string) (*Cart, error) {
	oid, err := primitive.ObjectIDFromHex(cartID)
	if err != nil {
		return nil, err
	}

	var cart Cart
	err = s.cartCol.FindOne(ctx, bson.M{"_id": oid}).Decode(&cart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	// Check if cart is expired but not yet removed by MongoDB TTL process
	if time.Now().UTC().After(cart.ExpiresAt) {
		return nil, ErrCartExpired
	}

	return &cart, nil
}

// GetCartByUserID retrieves the active cart for a user
func (s *CartService) GetCartByUserID(ctx context.Context, userID string) (*Cart, error) {
	var cart Cart
	err := s.cartCol.FindOne(ctx, bson.M{
		"userId": userID,
		"status": CartStatusActive,
	}).Decode(&cart)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	// Check if cart is expired but not yet removed by MongoDB TTL process
	if time.Now().UTC().After(cart.ExpiresAt) {
		return nil, ErrCartExpired
	}

	return &cart, nil
}

// AddItem adds an item to a cart
func (s *CartService) AddItem(ctx context.Context, cartID string, item *AddItemRequest) (*Cart, error) {
	// Validate product availability via product service
	if s.productSvc != nil {
		if err := s.productSvc.CheckProductAvailability(ctx, item.ProductID, item.Quantity); err != nil {
			return nil, err
		}
	}

	oid, err := primitive.ObjectIDFromHex(cartID)
	if err != nil {
		return nil, err
	}

	// Get the current cart
	var cart Cart
	err = s.cartCol.FindOne(ctx, bson.M{"_id": oid}).Decode(&cart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	// Check if item already exists in cart
	found := false
	for i, existingItem := range cart.Items {
		if existingItem.ProductID == item.ProductID {
			// Update quantity instead of adding new item
			cart.Items[i].Quantity += item.Quantity
			found = true
			break
		}
	}

	// If item not found, add it
	if !found {
		newItem := CartItem{
			ID:          primitive.NewObjectID(),
			ProductID:   item.ProductID,
			Title:       item.Title,
			Description: item.Description,
			Price:       item.Price,
			Quantity:    item.Quantity,
			Weight:      item.Weight,
			Image:       item.Image,
			Metadata:    item.Metadata,
			AddedAt:     time.Now().UTC(),
		}
		cart.Items = append(cart.Items, newItem)
	}

	// Recalculate cart totals
	s.calculateCartTotals(&cart)

	now := time.Now().UTC()
	cart.UpdatedAt = now
	cart.ExpiresAt = now.Add(s.cartTTL) // Reset expiration when cart is modified

	// Update cart in database
	result := s.cartCol.FindOneAndUpdate(
		ctx,
		bson.M{"_id": oid},
		bson.M{
			"$set": bson.M{
				"items":        cart.Items,
				"subtotal":     cart.Subtotal,
				"taxAmount":    cart.TaxAmount,
				"shippingCost": cart.ShippingCost,
				"totalAmount":  cart.TotalAmount,
				"updatedAt":    cart.UpdatedAt,
				"expiresAt":    cart.ExpiresAt,
			},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var updatedCart Cart
	if err := result.Decode(&updatedCart); err != nil {
		return nil, err
	}

	return &updatedCart, nil
}

// UpdateItem updates an item quantity in the cart
func (s *CartService) UpdateItem(ctx context.Context, cartID string, itemID string, req *UpdateItemRequest) (*Cart, error) {
	if req.Quantity <= 0 {
		return nil, ErrQuantityInvalid
	}

	cartOID, err := primitive.ObjectIDFromHex(cartID)
	if err != nil {
		return nil, err
	}

	itemOID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return nil, err
	}

	// Get the current cart
	var cart Cart
	err = s.cartCol.FindOne(ctx, bson.M{"_id": cartOID}).Decode(&cart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	// Find the item
	itemIndex := -1
	var productID string
	for i, item := range cart.Items {
		if item.ID == itemOID {
			itemIndex = i
			productID = item.ProductID
			break
		}
	}

	if itemIndex == -1 {
		return nil, ErrItemNotInCart
	}

	// Check product availability for the updated quantity
	if s.productSvc != nil {
		if err := s.productSvc.CheckProductAvailability(ctx, productID, req.Quantity); err != nil {
			return nil, err
		}
	}

	// Update the item quantity
	cart.Items[itemIndex].Quantity = req.Quantity

	// Recalculate cart totals
	s.calculateCartTotals(&cart)

	now := time.Now().UTC()
	cart.UpdatedAt = now
	cart.ExpiresAt = now.Add(s.cartTTL) // Reset expiration when cart is modified

	// Update cart in database
	result := s.cartCol.FindOneAndUpdate(
		ctx,
		bson.M{"_id": cartOID},
		bson.M{
			"$set": bson.M{
				"items":        cart.Items,
				"subtotal":     cart.Subtotal,
				"taxAmount":    cart.TaxAmount,
				"shippingCost": cart.ShippingCost,
				"totalAmount":  cart.TotalAmount,
				"updatedAt":    cart.UpdatedAt,
				"expiresAt":    cart.ExpiresAt,
			},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var updatedCart Cart
	if err := result.Decode(&updatedCart); err != nil {
		return nil, err
	}

	return &updatedCart, nil
}

// RemoveItem removes an item from the cart
func (s *CartService) RemoveItem(ctx context.Context, cartID string, itemID string) (*Cart, error) {
	cartOID, err := primitive.ObjectIDFromHex(cartID)
	if err != nil {
		return nil, err
	}

	itemOID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return nil, err
	}

	// Get the current cart
	var cart Cart
	err = s.cartCol.FindOne(ctx, bson.M{"_id": cartOID}).Decode(&cart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	// Find and remove the item
	itemIndex := -1
	for i, item := range cart.Items {
		if item.ID == itemOID {
			itemIndex = i
			break
		}
	}

	if itemIndex == -1 {
		return nil, ErrItemNotInCart
	}

	// Remove item from the array
	cart.Items = append(cart.Items[:itemIndex], cart.Items[itemIndex+1:]...)

	// Recalculate cart totals
	s.calculateCartTotals(&cart)

	now := time.Now().UTC()
	cart.UpdatedAt = now
	cart.ExpiresAt = now.Add(s.cartTTL) // Reset expiration when cart is modified

	// Update cart in database
	result := s.cartCol.FindOneAndUpdate(
		ctx,
		bson.M{"_id": cartOID},
		bson.M{
			"$set": bson.M{
				"items":        cart.Items,
				"subtotal":     cart.Subtotal,
				"taxAmount":    cart.TaxAmount,
				"shippingCost": cart.ShippingCost,
				"totalAmount":  cart.TotalAmount,
				"updatedAt":    cart.UpdatedAt,
				"expiresAt":    cart.ExpiresAt,
			},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var updatedCart Cart
	if err := result.Decode(&updatedCart); err != nil {
		return nil, err
	}

	return &updatedCart, nil
}

// ClearCart removes all items from a cart
func (s *CartService) ClearCart(ctx context.Context, cartID string) (*Cart, error) {
	oid, err := primitive.ObjectIDFromHex(cartID)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	expiresAt := now.Add(s.cartTTL)

	result := s.cartCol.FindOneAndUpdate(
		ctx,
		bson.M{"_id": oid},
		bson.M{
			"$set": bson.M{
				"items":        []CartItem{},
				"subtotal":     0,
				"taxAmount":    0,
				"shippingCost": 0,
				"totalAmount":  0,
				"updatedAt":    now,
				"expiresAt":    expiresAt,
			},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var updatedCart Cart
	if err := result.Decode(&updatedCart); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	return &updatedCart, nil
}

// ApplyCoupon applies a coupon to the cart
func (s *CartService) ApplyCoupon(ctx context.Context, cartID string, req *ApplyCouponRequest) (*Cart, error) {
	// In a real implementation, you'd verify the coupon against a coupon service
	// For this example, we'll simulate a simple percentage discount

	oid, err := primitive.ObjectIDFromHex(cartID)
	if err != nil {
		return nil, err
	}

	// Get the current cart
	var cart Cart
	err = s.cartCol.FindOne(ctx, bson.M{"_id": oid}).Decode(&cart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	if len(cart.Items) == 0 {
		return nil, ErrCartEmpty
	}

	// Example fixed discount of 10%
	coupon := &Coupon{
		Code:          req.Code,
		DiscountType:  "percentage",
		DiscountValue: 10.0, // 10% discount
		AppliedAt:     time.Now().UTC(),
	}

	cart.Coupon = coupon

	// Recalculate cart totals with coupon
	s.calculateCartTotals(&cart)

	now := time.Now().UTC()
	cart.UpdatedAt = now
	cart.ExpiresAt = now.Add(s.cartTTL)

	// Update cart in database
	result := s.cartCol.FindOneAndUpdate(
		ctx,
		bson.M{"_id": oid},
		bson.M{
			"$set": bson.M{
				"coupon":       cart.Coupon,
				"subtotal":     cart.Subtotal,
				"taxAmount":    cart.TaxAmount,
				"shippingCost": cart.ShippingCost,
				"totalAmount":  cart.TotalAmount,
				"updatedAt":    cart.UpdatedAt,
				"expiresAt":    cart.ExpiresAt,
			},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var updatedCart Cart
	if err := result.Decode(&updatedCart); err != nil {
		return nil, err
	}

	return &updatedCart, nil
}

// RemoveCoupon removes a coupon from the cart
func (s *CartService) RemoveCoupon(ctx context.Context, cartID string) (*Cart, error) {
	oid, err := primitive.ObjectIDFromHex(cartID)
	if err != nil {
		return nil, err
	}

	// Get the current cart
	var cart Cart
	err = s.cartCol.FindOne(ctx, bson.M{"_id": oid}).Decode(&cart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	// Remove coupon
	cart.Coupon = nil

	// Recalculate cart totals
	s.calculateCartTotals(&cart)

	now := time.Now().UTC()
	cart.UpdatedAt = now
	cart.ExpiresAt = now.Add(s.cartTTL)

	// Update cart in database
	result := s.cartCol.FindOneAndUpdate(
		ctx,
		bson.M{"_id": oid},
		bson.M{
			"$set": bson.M{
				"coupon":       nil,
				"subtotal":     cart.Subtotal,
				"taxAmount":    cart.TaxAmount,
				"shippingCost": cart.ShippingCost,
				"totalAmount":  cart.TotalAmount,
				"updatedAt":    cart.UpdatedAt,
				"expiresAt":    cart.ExpiresAt,
			},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var updatedCart Cart
	if err := result.Decode(&updatedCart); err != nil {
		return nil, err
	}

	return &updatedCart, nil
}

// CheckoutCart processes a cart for checkout
func (s *CartService) CheckoutCart(ctx context.Context, cartID string) (*Cart, error) {
	oid, err := primitive.ObjectIDFromHex(cartID)
	if err != nil {
		return nil, err
	}

	// Get the current cart
	var cart Cart
	err = s.cartCol.FindOne(ctx, bson.M{"_id": oid}).Decode(&cart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}

	if len(cart.Items) == 0 {
		return nil, ErrCartEmpty
	}

	// In a real application, you would:
	// 1. Verify all items are still available
	// 2. Lock inventory
	// 3. Process payment
	// 4. Create order
	// 5. Reduce inventory
	// 6. Send notifications

	// For this example, we'll just mark the cart as processing
	now := time.Now().UTC()
	result := s.cartCol.FindOneAndUpdate(
		ctx,
		bson.M{"_id": oid},
		bson.M{
			"$set": bson.M{
				"status":    CartStatusProcessing,
				"updatedAt": now,
				// Don't update expiresAt here since we want to keep the cart longer
			},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var updatedCart Cart
	if err := result.Decode(&updatedCart); err != nil {
		return nil, err
	}

	return &updatedCart, nil
}

// MergeGuestCart merges a guest cart into a user's cart
func (s *CartService) MergeGuestCart(ctx context.Context, userCartID, guestCartID string) (*Cart, error) {
	userOID, err := primitive.ObjectIDFromHex(userCartID)
	if err != nil {
		return nil, err
	}
	
	guestOID, err := primitive.ObjectIDFromHex(guestCartID)
	if err != nil {
		return nil, err
	}
	
	// Get the guest cart
	var guestCart Cart
	err = s.cartCol.FindOne(ctx, bson.M{"_id": guestOID}).Decode(&guestCart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}
	
	// Get the user cart
	var userCart Cart
	err = s.cartCol.FindOne(ctx, bson.M{"_id": userOID}).Decode(&userCart)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrCartNotFound
		}
		return nil, err
	}
	
	// Merge items
	itemMap := make(map[string]int) // Map of productID to index in userCart
	for i, item := range userCart.Items {
		itemMap[item.ProductID] = i
	}
	
	for _, guestItem := range guestCart.Items {
		if idx, exists := itemMap[guestItem.ProductID]; exists {
			// Update quantity of existing item
			userCart.Items[idx].Quantity += guestItem.Quantity
		} else {
			// Add new item from guest cart
			userCart.Items = append(userCart.Items, guestItem)
		}
	}
	
	// Recalculate totals
	s.calculateCartTotals(&userCart)
	
	now := time.Now().UTC()
	userCart.UpdatedAt = now
	userCart.ExpiresAt = now.Add(s.cartTTL)
	
	// Update user cart in database
	result := s.cartCol.FindOneAndUpdate(
		ctx,
		bson.M{"_id": userOID},
		bson.M{
			"$set": bson.M{
				"items":        userCart.Items,
				"subtotal":     userCart.Subtotal,
				"taxAmount":    userCart.TaxAmount,
				"shippingCost": userCart.ShippingCost,
				"totalAmount":  userCart.TotalAmount,
				"updatedAt":    userCart.UpdatedAt,
				"expiresAt":    userCart.ExpiresAt,
			},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var updatedCart Cart
	if err := result.Decode(&updatedCart); err != nil {
		return nil, err
	}
	
	// Delete or mark guest cart as merged
	_, err = s.cartCol.UpdateOne(
		ctx,
		bson.M{"_id": guestOID},
		bson.M{
			"$set": bson.M{
				"status": CartStatusCompleted,
				"metadata": bson.M{
					"mergedTo": userCartID,
				},
			},
		},
	)
	
	if err != nil {
		// Log error but don't fail the operation
		// In production, you might want to handle this differently
	}
	
	return &updatedCart, nil
}

// GetCartStatistics retrieves cart analytics
func (s *CartService) GetCartStatistics(ctx context.Context, timeRange time.Duration) (*CartStatistics, error) {
	now := time.Now().UTC()
	startTime := now.Add(-timeRange)

	// Pipeline to aggregate cart statistics
	pipeline := mongo.Pipeline{
		{
			{"$match", bson.M{
				"createdAt": bson.M{"$gte": startTime},
			}},
		},
		{
			{"$group", bson.M{
				"_id": nil,
				"totalCarts": bson.M{"$sum": 1},
				"activeCarts": bson.M{
					"$sum": bson.M{
						"$cond": []interface{}{
							bson.M{"$eq": []interface{}{"$status", CartStatusActive}},
							1,
							0,
						},
					},
				},
				"abandonedCarts": bson.M{
					"$sum": bson.M{
						"$cond": []interface{}{
							bson.M{"$eq": []interface{}{"$status", CartStatusAbandoned}},
							1,
							0,
						},
					},
				},
				"completedCarts": bson.M{
					"$sum": bson.M{
						"$cond": []interface{}{
							bson.M{"$eq": []interface{}{"$status", CartStatusCompleted}},
							1,
							0,
						},
					},
				},
				"totalValue": bson.M{"$sum": "$totalAmount"},
			}},
		},
	}

	cursor, err := s.cartCol.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	// Process results
	var results []struct {
		TotalCarts     int     `bson:"totalCarts"`
		ActiveCarts    int     `bson:"activeCarts"`
		AbandonedCarts int     `bson:"abandonedCarts"`
		CompletedCarts int     `bson:"completedCarts"`
		TotalValue     float64 `bson:"totalValue"`
	}

	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	stats := &CartStatistics{
		TotalCarts:       0,
		ActiveCarts:      0,
		AbandonedCarts:   0,
		CompletedCarts:   0,
		AverageCartValue: 0,
	}

	if len(results) > 0 {
		stats.TotalCarts = results[0].TotalCarts
		stats.ActiveCarts = results[0].ActiveCarts
		stats.AbandonedCarts = results[0].AbandonedCarts
		stats.CompletedCarts = results[0].CompletedCarts
		
		if stats.TotalCarts > 0 {
			stats.AverageCartValue = results[0].TotalValue / float64(stats.TotalCarts)
		}
	}

	return stats, nil
}

// CleanupAbandonedCarts marks abandoned carts
func (s *CartService) CleanupAbandonedCarts(ctx context.Context, olderThan time.Duration) (int, error) {
	cutoffTime := time.Now().UTC().Add(-olderThan)
	
	result, err := s.cartCol.UpdateMany(
		ctx,
		bson.M{
			"status": CartStatusActive,
			"updatedAt": bson.M{"$lt": cutoffTime},
		},
		bson.M{
			"$set": bson.M{
				"status": CartStatusAbandoned,
			},
		},
	)
	
	if err != nil {
		return 0, err
	}
	
	return int(result.ModifiedCount), nil
}

// calculateCartTotals recalculates all cart totals
func (s *CartService) calculateCartTotals(cart *Cart) {
	// Calculate subtotal
	subtotal := 0.0
	for _, item := range cart.Items {
		subtotal += item.Price * float64(item.Quantity)
	}
	cart.Subtotal = subtotal

	// Apply coupon if exists
	if cart.Coupon != nil {
		if cart.Coupon.DiscountType == "percentage" {
			discountAmount := (cart.Coupon.DiscountValue / 100) * subtotal
			subtotal -= discountAmount
		} else if cart.Coupon.DiscountType == "fixed" {
			subtotal -= cart.Coupon.DiscountValue
			if subtotal < 0 {
				subtotal = 0
			}
		}
	}

	// Calculate tax
	taxAmount := subtotal * s.taxRate
	cart.TaxAmount = taxAmount

	// Set shipping cost
	cart.ShippingCost = s.shippingCost

	// Calculate total
	cart.TotalAmount = subtotal + taxAmount + cart.ShippingCost
}