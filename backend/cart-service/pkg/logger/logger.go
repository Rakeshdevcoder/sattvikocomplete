// cart-service/pkg/logger/logger.go
package logger

import (
	"strings"

	"github.com/sirupsen/logrus"
)

// New creates a new configured logger
func New(level string) *logrus.Logger {
	log := logrus.New()

	// Parse log level
	lvl, err := logrus.ParseLevel(strings.ToLower(level))
	if err != nil {
		lvl = logrus.InfoLevel
	}
	log.SetLevel(lvl)

	// Use JSON formatter for structured logging
	log.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02T15:04:05.000Z07:00",
	})

	return log
}
