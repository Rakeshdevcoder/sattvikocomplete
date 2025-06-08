package internal

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid token")
)

// GenerateToken embeds the userID (string) into the "sub" claim.
func GenerateToken(userID, secret string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(secret))
}

// ValidateToken extracts the "sub" claim as a string.
func ValidateToken(tokenStr, secret string) (string, error) {
	tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, ErrInvalidToken
		}
		return []byte(secret), nil
	})
	if err != nil || !tok.Valid {
		return "", ErrInvalidToken
	}
	claims, ok := tok.Claims.(jwt.MapClaims)
	if !ok {
		return "", ErrInvalidToken
	}
	sub, ok := claims["sub"].(string)
	if !ok {
		return "", ErrInvalidToken
	}
	return sub, nil
}
