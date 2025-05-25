package config

import (
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	MongoURI  string `envconfig:"ORDER_DB_URL"       required:"true"`
	HTTPPort  string `envconfig:"ORDER_PORT"         default:"8081"`
	JWTSecret string `envconfig:"ORDER_JWT_SECRET"   required:"true"`
	LogLevel  string `envconfig:"ORDER_LOG_LEVEL"    default:"info"`
}

func Load() (*Config, error) {
	_ = godotenv.Load("config/.env")
	var cfg Config
	if err := envconfig.Process("ORDER", &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
