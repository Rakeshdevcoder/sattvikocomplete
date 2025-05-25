// backend/auth-service/internal/handler.go
package internal

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/mail"
	"regexp"

	"github.com/sirupsen/logrus"
)

// Handler holds your AuthService and logger.
type Handler struct {
	service *AuthService
	log     *logrus.Logger
}

// NewHandler creates a new HTTP Handler.
func NewHandler(svc *AuthService, log *logrus.Logger) *Handler {
	return &Handler{service: svc, log: log}
}

// signupRequest is the JSON body for /signup.
type signupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// authResponse is the JSON response for signup/login.
type authResponse struct {
	Token  string `json:"token"`
	UserId string `json:"userId"`
}

// validateRequest is the JSON body for /validate.
type validateRequest struct {
	Token string `json:"token"`
}

// validateResponse is the JSON response for /validate.
type validateResponse struct {
	Valid  bool   `json:"valid"`
	UserId string `json:"userId,omitempty"`
}

// ---------------------------------------------------------------------------
// validation helpers

// password must be at least 8 chars, contain upper, lower, digit & special
var (
	pwMinLen  = 8
	reUpper   = regexp.MustCompile(`[A-Z]`)
	reLower   = regexp.MustCompile(`[a-z]`)
	reNumber  = regexp.MustCompile(`[0-9]`)
	reSpecial = regexp.MustCompile(`[^A-Za-z0-9]`)
)

func validateEmailFmt(email string) error {
	if _, err := mail.ParseAddress(email); err != nil {
		return errors.New("invalid email format")
	}
	return nil
}

func validatePassword(pw string) error {
	if len(pw) < pwMinLen {
		return errors.New("password must be at least 8 characters")
	}
	if !reUpper.MatchString(pw) {
		return errors.New("password must include at least one uppercase letter")
	}
	if !reLower.MatchString(pw) {
		return errors.New("password must include at least one lowercase letter")
	}
	if !reNumber.MatchString(pw) {
		return errors.New("password must include at least one digit")
	}
	if !reSpecial.MatchString(pw) {
		return errors.New("password must include at least one special character")
	}
	return nil
}

// ---------------------------------------------------------------------------

// Signup handles POST /signup with email & password validation.
func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req signupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.log.Error("decode signup:", err)
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// --- Validation before hitting the service ---
	if err := validateEmailFmt(req.Email); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := validatePassword(req.Password); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// --- Attempt to sign up ---
	token, userID, err := h.service.Signup(context.Background(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, ErrUserExists) {
			http.Error(w, "user already exists", http.StatusConflict)
			return
		}
		h.log.Error("signup failed:", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(authResponse{Token: token, UserId: userID})
}

// Login handles POST /login.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req signupRequest // same shape
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.log.Error("decode login:", err)
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	token, userID, err := h.service.Login(context.Background(), req.Email, req.Password)
	if err != nil {
		h.log.Error("login failed:", err)
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(authResponse{Token: token, UserId: userID})
}

// Validate handles POST /validate.
func (h *Handler) Validate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req validateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.log.Error("decode validate:", err)
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	userID, err := h.service.ValidateToken(req.Token)
	if err != nil {
		h.log.Error("validate token failed:", err)
		json.NewEncoder(w).Encode(validateResponse{Valid: false})
		return
	}
	json.NewEncoder(w).Encode(validateResponse{Valid: true, UserId: userID})
}
