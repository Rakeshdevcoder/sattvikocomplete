package internal

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// ErrUserExists is returned when attempting to sign up with an email already in use.
var ErrUserExists = errors.New("user already exists")

// AuthService now uses MongoDB under the hood.
type AuthService struct {
	col       *mongo.Collection
	jwtSecret string
}

// NewAuthService connects to MongoDB, ensures indexes, and returns your service.
func NewAuthService(mongoURI, jwtSecret string) (*AuthService, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		return nil, err
	}

	// Use the database named in your URI or default to "authdb"
	db := client.Database("authdb")
	col := db.Collection("users")

	// Ensure a unique index on email
	idx := mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := col.Indexes().CreateOne(ctx, idx); err != nil {
		return nil, err
	}

	return &AuthService{col: col, jwtSecret: jwtSecret}, nil
}

// userDoc defines the BSON structure for a user.
type userDoc struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	Email        string             `bson:"email"`
	PasswordHash string             `bson:"password"`
}

// Signup hashes the password, inserts the user, and returns JWT + userID.
func (s *AuthService) Signup(ctx context.Context, email, password string) (token string, userID string, err error) {
	// hash the password
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", "", err
	}

	// insert new user
	res, err := s.col.InsertOne(ctx, userDoc{
		Email:        email,
		PasswordHash: string(hash),
	})
	if err != nil {
		// catch duplicate‐key error
		if we, ok := err.(mongo.WriteException); ok {
			for _, e := range we.WriteErrors {
				if e.Code == 11000 {
					return "", "", ErrUserExists
				}
			}
		}
		return "", "", err
	}

	// convert the inserted ObjectID to its hex string
	oid := res.InsertedID.(primitive.ObjectID)
	userID = oid.Hex()

	// generate a JWT whose “sub” is the hex‐string ID
	token, err = GenerateToken(userID, s.jwtSecret)
	return token, userID, err
}

// Login finds the user, compares the password, and returns JWT + userID.
func (s *AuthService) Login(ctx context.Context, email, password string) (token string, userID string, err error) {
	var u userDoc
	if err := s.col.FindOne(ctx, bson.M{"email": email}).Decode(&u); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return "", "", errors.New("invalid credentials")
		}
		return "", "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return "", "", errors.New("invalid credentials")
	}

	userID = u.ID.Hex()
	token, err = GenerateToken(userID, s.jwtSecret)
	return token, userID, err
}

// ValidateToken parses the JWT and returns the userID string if valid.
func (s *AuthService) ValidateToken(tokenStr string) (string, error) {
	return ValidateToken(tokenStr, s.jwtSecret)
}
