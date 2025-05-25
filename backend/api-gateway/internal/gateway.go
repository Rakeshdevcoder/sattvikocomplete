// backend/api-gateway/internal/gateway.go
package internal

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
)

type GatewayHandler struct {
	jwtSecret string
	log       *logrus.Logger
}

func NewGatewayHandler(jwtSecret string, log *logrus.Logger) *GatewayHandler {
	return &GatewayHandler{jwtSecret: jwtSecret, log: log}
}

func (h *GatewayHandler) AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		auth := c.Request().Header.Get("Authorization")
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid auth header")
		}
		if _, err := ValidateToken(parts[1], h.jwtSecret); err != nil {
			h.log.Warnf("unauthorized request: %v", err)
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
		}
		return next(c)
	}
}

// ProxyTo returns a handler that reverse-proxies to rawURL,
// stripping the given prefix from the incoming request path.
func (h *GatewayHandler) ProxyTo(rawURL, stripPrefix string) echo.HandlerFunc {
	target, err := url.Parse(rawURL)
	if err != nil {
		h.log.Fatalf("invalid proxy URL %q: %v", rawURL, err)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)

	return func(c echo.Context) error {
		// strip the first path segment (e.g. "/auth", "/orders", "/products")
		req := c.Request()
		req.URL.Path = strings.TrimPrefix(req.URL.Path, stripPrefix)
		if req.URL.Path == "" {
			req.URL.Path = "/"
		}
		// ensure the host and scheme point at the target
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		req.Host = target.Host

		proxy.ServeHTTP(c.Response(), req)
		return nil
	}
}
