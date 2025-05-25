package logger

import (
  "github.com/sirupsen/logrus"
)

// New returns a configured logger
func New(level string) *logrus.Logger {
  log := logrus.New()
  lvl, err := logrus.ParseLevel(level)
  if err != nil {
    lvl = logrus.InfoLevel
  }
  log.SetLevel(lvl)
  log.SetFormatter(&logrus.JSONFormatter{})
  return log
}