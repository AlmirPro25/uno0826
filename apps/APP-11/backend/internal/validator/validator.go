
package validator

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

// Validator holds the validation instance.
type Validator struct {
	validate *validator.Validate
}

// NewValidator creates and returns a new Validator instance.
func NewValidator() *Validator {
	v := validator.New()
	// You can register custom validations here if needed
	// e.g., v.RegisterValidation("password", validatePassword)
	return &Validator{validate: v}
}

// Validate validates the given struct.
func (v *Validator) Validate(i interface{}) error {
	if err := v.validate.Struct(i); err != nil {
		validationErrors := err.(validator.ValidationErrors)
		var errorMessages []string
		for _, e := range validationErrors {
			errorMessages = append(errorMessages, fmt.Sprintf("Field '%s' failed validation on '%s' tag", e.Field(), e.Tag()))
		}
		return fmt.Errorf(strings.Join(errorMessages, "; "))
	}
	return nil
}
