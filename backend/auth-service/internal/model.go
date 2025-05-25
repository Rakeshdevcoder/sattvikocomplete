package internal

import (
	"gorm.io/gorm"
)

// User represents auth user
type User struct {
  gorm.Model
  Email    string `gorm:"uniqueIndex;not null"`
  Password string `gorm:"not null"` // hashed
}