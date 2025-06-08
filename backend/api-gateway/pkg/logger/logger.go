package logger

import (
  "strings"
  "github.com/sirupsen/logrus"
)

func New(level string) *logrus.Logger {
  log := logrus.New()
  lvl, err := logrus.ParseLevel(strings.ToLower(level))
  if err != nil {
    lvl = logrus.InfoLevel
  }
  log.SetLevel(lvl)
  log.SetFormatter(&logrus.JSONFormatter{})
  return log
}
