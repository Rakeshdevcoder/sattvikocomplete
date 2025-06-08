// cart-service/internal/jwt.go
package internal

import (
  "errors"

  "github.com/golang-jwt/jwt/v4"
)

var ErrInvalidToken = errors.New("invalid or expired token")

// ValidateToken checks HMAC JWT and returns the "sub" claim as userID.
func ValidateToken(tokenStr, secret string) (string, error) {
  tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
    if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
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
  if !ok || sub == "" {
    return "", ErrInvalidToken
  }
  return sub, nil
}