package apigate

import (
	"fmt"
	"reflect"
)

// ========================================
// REQUEST VALIDATOR
// "Validação estrutural ANTES do handler"
// ========================================

// RequestValidator validates JSON structure
type RequestValidator struct {
	config *GateConfig
}

// NewRequestValidator creates a new validator
func NewRequestValidator(config *GateConfig) *RequestValidator {
	return &RequestValidator{config: config}
}

// ValidateStructure validates JSON structure recursively
func (v *RequestValidator) ValidateStructure(data interface{}, depth int) error {
	// Check depth limit
	if depth > v.config.MaxJSONDepth {
		return fmt.Errorf("JSON nesting depth exceeds limit of %d", v.config.MaxJSONDepth)
	}

	switch val := data.(type) {
	case map[string]interface{}:
		return v.validateObject(val, depth)
	case []interface{}:
		return v.validateArray(val, depth)
	case string:
		return v.validateString(val)
	case nil, bool, float64, int64:
		// Primitive types are OK
		return nil
	default:
		// json.Number and other types
		return nil
	}
}

// validateObject validates a JSON object
func (v *RequestValidator) validateObject(obj map[string]interface{}, depth int) error {
	// Check field count
	if len(obj) > v.config.MaxFieldCount {
		return fmt.Errorf("object has %d fields, exceeds limit of %d", len(obj), v.config.MaxFieldCount)
	}

	// Validate each field
	for key, value := range obj {
		// Check key length
		if len(key) > 256 {
			return fmt.Errorf("field name too long: %s...", key[:50])
		}

		// Check for suspicious field names
		if containsSuspiciousChars(key) {
			return fmt.Errorf("suspicious characters in field name: %s", key)
		}

		// Recursively validate value
		if err := v.ValidateStructure(value, depth+1); err != nil {
			return fmt.Errorf("field '%s': %w", key, err)
		}
	}

	return nil
}

// validateArray validates a JSON array
func (v *RequestValidator) validateArray(arr []interface{}, depth int) error {
	// Check array length
	if len(arr) > v.config.MaxArrayLength {
		return fmt.Errorf("array has %d elements, exceeds limit of %d", len(arr), v.config.MaxArrayLength)
	}

	// Validate each element
	for i, elem := range arr {
		if err := v.ValidateStructure(elem, depth+1); err != nil {
			return fmt.Errorf("array[%d]: %w", i, err)
		}
	}

	return nil
}

// validateString validates a string value
func (v *RequestValidator) validateString(s string) error {
	// Check string length
	if len(s) > v.config.MaxStringLength {
		return fmt.Errorf("string length %d exceeds limit of %d", len(s), v.config.MaxStringLength)
	}

	return nil
}

// containsSuspiciousChars checks for potentially dangerous characters in field names
func containsSuspiciousChars(s string) bool {
	suspicious := []string{
		"$",      // MongoDB operators
		"__",     // Python dunder
		"<",      // HTML/XML
		">",      // HTML/XML
		"\x00",   // Null byte
		"\n",     // Newline in field name
		"\r",     // Carriage return
	}

	for _, char := range suspicious {
		if len(s) > 0 && s[0:1] == char {
			return true
		}
		// Check for $ at start (MongoDB)
		if len(s) > 0 && s[0] == '$' {
			return true
		}
	}

	return false
}

// ========================================
// SCHEMA VALIDATION
// ========================================

// SchemaRule defines a validation rule for a field
type SchemaRule struct {
	Required  bool
	Type      string // "string", "number", "boolean", "array", "object"
	MinLength int
	MaxLength int
	Pattern   string // Regex pattern
	Min       *float64
	Max       *float64
}

// Schema defines expected structure for an endpoint
type Schema struct {
	Fields map[string]SchemaRule
	Strict bool // Reject unknown fields
}

// ValidateAgainstSchema validates data against a schema
func (v *RequestValidator) ValidateAgainstSchema(data map[string]interface{}, schema *Schema) error {
	// Check required fields
	for fieldName, rule := range schema.Fields {
		value, exists := data[fieldName]

		if rule.Required && !exists {
			return fmt.Errorf("required field missing: %s", fieldName)
		}

		if exists {
			if err := v.validateFieldAgainstRule(fieldName, value, rule); err != nil {
				return err
			}
		}
	}

	// Check for unknown fields in strict mode
	if schema.Strict {
		for fieldName := range data {
			if _, known := schema.Fields[fieldName]; !known {
				return fmt.Errorf("unknown field: %s", fieldName)
			}
		}
	}

	return nil
}

// validateFieldAgainstRule validates a single field against its rule
func (v *RequestValidator) validateFieldAgainstRule(name string, value interface{}, rule SchemaRule) error {
	// Type check
	actualType := getJSONType(value)
	if rule.Type != "" && actualType != rule.Type {
		return fmt.Errorf("field '%s' expected type %s, got %s", name, rule.Type, actualType)
	}

	// String-specific validations
	if str, ok := value.(string); ok {
		if rule.MinLength > 0 && len(str) < rule.MinLength {
			return fmt.Errorf("field '%s' too short (min %d)", name, rule.MinLength)
		}
		if rule.MaxLength > 0 && len(str) > rule.MaxLength {
			return fmt.Errorf("field '%s' too long (max %d)", name, rule.MaxLength)
		}
	}

	// Number-specific validations
	if num, ok := toFloat64(value); ok {
		if rule.Min != nil && num < *rule.Min {
			return fmt.Errorf("field '%s' below minimum %f", name, *rule.Min)
		}
		if rule.Max != nil && num > *rule.Max {
			return fmt.Errorf("field '%s' above maximum %f", name, *rule.Max)
		}
	}

	return nil
}

// getJSONType returns the JSON type name for a value
func getJSONType(v interface{}) string {
	if v == nil {
		return "null"
	}

	switch v.(type) {
	case string:
		return "string"
	case float64, int, int64:
		return "number"
	case bool:
		return "boolean"
	case []interface{}:
		return "array"
	case map[string]interface{}:
		return "object"
	default:
		return reflect.TypeOf(v).String()
	}
}

// toFloat64 converts a value to float64 if possible
func toFloat64(v interface{}) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case int:
		return float64(n), true
	case int64:
		return float64(n), true
	default:
		return 0, false
	}
}

// ========================================
// COMMON SCHEMAS
// ========================================

// CommonSchemas provides pre-defined schemas for common endpoints
var CommonSchemas = map[string]*Schema{
	"auth/login": {
		Fields: map[string]SchemaRule{
			"email":    {Required: true, Type: "string", MinLength: 5, MaxLength: 255},
			"password": {Required: true, Type: "string", MinLength: 6, MaxLength: 128},
		},
		Strict: false,
	},
	"auth/register": {
		Fields: map[string]SchemaRule{
			"email":    {Required: true, Type: "string", MinLength: 5, MaxLength: 255},
			"password": {Required: true, Type: "string", MinLength: 8, MaxLength: 128},
			"name":     {Required: false, Type: "string", MaxLength: 255},
		},
		Strict: false,
	},
	"billing/subscribe": {
		Fields: map[string]SchemaRule{
			"plan_id":          {Required: true, Type: "string"},
			"payment_method":   {Required: false, Type: "string"},
		},
		Strict: false,
	},
}

// GetSchemaForPath returns the schema for a given path, if defined
func GetSchemaForPath(path string) *Schema {
	for pattern, schema := range CommonSchemas {
		if matchesPattern(path, pattern) {
			return schema
		}
	}
	return nil
}

// matchesPattern checks if a path matches a pattern
func matchesPattern(path, pattern string) bool {
	// Simple contains check for now
	return len(path) > 0 && len(pattern) > 0 && 
		(path == pattern || 
		 path == "/"+pattern || 
		 path == "/api/v1/"+pattern ||
		 containsPath(path, pattern))
}

func containsPath(path, pattern string) bool {
	return len(path) >= len(pattern) && 
		(path[len(path)-len(pattern):] == pattern ||
		 (len(path) > len(pattern) && path[len(path)-len(pattern)-1:] == "/"+pattern))
}
