package apigate

import (
	"encoding/json"
	"regexp"
	"strings"
)

// ========================================
// INPUT SANITIZER
// "Limpar inputs antes de processar"
// ========================================

// InputSanitizer sanitizes user inputs
type InputSanitizer struct {
	sqlPatterns []string
	xssPatterns []string
	sqlRegex    []*regexp.Regexp
	xssRegex    []*regexp.Regexp
}

// NewInputSanitizer creates a new sanitizer
func NewInputSanitizer() *InputSanitizer {
	s := &InputSanitizer{
		sqlPatterns: []string{
			"UNION SELECT",
			"UNION ALL SELECT",
			"' OR '1'='1",
			"' OR 1=1",
			"'; DROP TABLE",
			"'; DELETE FROM",
			"'; UPDATE ",
			"'; INSERT INTO",
			"--",
			"/*",
			"*/",
			"@@",
			"CHAR(",
			"NCHAR(",
			"VARCHAR(",
			"EXEC(",
			"EXECUTE(",
		},
		xssPatterns: []string{
			"<script",
			"</script>",
			"javascript:",
			"vbscript:",
			"onload=",
			"onerror=",
			"onclick=",
			"onmouseover=",
		},
	}
	s.compilePatterns()
	return s
}


// compilePatterns compiles regex patterns
func (s *InputSanitizer) compilePatterns() {
	// SQL injection patterns (case insensitive)
	sqlRegexPatterns := []string{
		`(?i)union\s+(all\s+)?select`,
		`(?i)'\s*or\s*'?\d*'?\s*=\s*'?\d*`,
		`(?i);\s*(drop|delete|update|insert|truncate|alter|create)`,
		`(?i)(exec|execute)\s*\(`,
		`(?i)xp_cmdshell`,
		`(?i)sp_executesql`,
		`(?i)waitfor\s+delay`,
		`(?i)benchmark\s*\(`,
		`(?i)sleep\s*\(`,
		`(?i)load_file\s*\(`,
		`(?i)into\s+(out|dump)file`,
	}

	for _, pattern := range sqlRegexPatterns {
		if re, err := regexp.Compile(pattern); err == nil {
			s.sqlRegex = append(s.sqlRegex, re)
		}
	}

	// XSS patterns
	xssRegexPatterns := []string{
		`(?i)<script[^>]*>`,
		`(?i)</script>`,
		`(?i)javascript\s*:`,
		`(?i)vbscript\s*:`,
		`(?i)on\w+\s*=`,
		`(?i)expression\s*\(`,
		`(?i)url\s*\(\s*['"]?\s*data:`,
	}

	for _, pattern := range xssRegexPatterns {
		if re, err := regexp.Compile(pattern); err == nil {
			s.xssRegex = append(s.xssRegex, re)
		}
	}
}

// ContainsSQLInjection checks if string contains SQL injection patterns
func (s *InputSanitizer) ContainsSQLInjection(input string) bool {
	upper := strings.ToUpper(input)

	// Check simple patterns first (faster)
	for _, pattern := range s.sqlPatterns {
		if strings.Contains(upper, pattern) {
			return true
		}
	}

	// Check regex patterns
	for _, re := range s.sqlRegex {
		if re.MatchString(input) {
			return true
		}
	}

	return false
}

// ContainsXSS checks if string contains XSS patterns
func (s *InputSanitizer) ContainsXSS(input string) bool {
	lower := strings.ToLower(input)

	// Check simple patterns first
	for _, pattern := range s.xssPatterns {
		if strings.Contains(lower, pattern) {
			return true
		}
	}

	// Check regex patterns
	for _, re := range s.xssRegex {
		if re.MatchString(input) {
			return true
		}
	}

	return false
}

// SanitizeString removes dangerous patterns from a string
func (s *InputSanitizer) SanitizeString(input string) (string, bool) {
	original := input
	result := input

	// Remove null bytes
	result = strings.ReplaceAll(result, "\x00", "")

	// Escape HTML entities
	result = escapeHTML(result)

	return result, result != original
}

// SanitizeJSON sanitizes all string values in JSON
func (s *InputSanitizer) SanitizeJSON(body []byte) ([]byte, bool) {
	var data interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return body, false
	}

	changed := false
	sanitized := s.sanitizeValue(data, &changed)

	if !changed {
		return body, false
	}

	result, err := json.Marshal(sanitized)
	if err != nil {
		return body, false
	}

	return result, true
}

// sanitizeValue recursively sanitizes values
func (s *InputSanitizer) sanitizeValue(v interface{}, changed *bool) interface{} {
	switch val := v.(type) {
	case string:
		sanitized, wasChanged := s.SanitizeString(val)
		if wasChanged {
			*changed = true
		}
		return sanitized

	case map[string]interface{}:
		result := make(map[string]interface{})
		for k, v := range val {
			result[k] = s.sanitizeValue(v, changed)
		}
		return result

	case []interface{}:
		result := make([]interface{}, len(val))
		for i, v := range val {
			result[i] = s.sanitizeValue(v, changed)
		}
		return result

	default:
		return v
	}
}

// escapeHTML escapes HTML special characters
func escapeHTML(s string) string {
	replacer := strings.NewReplacer(
		"<", "&lt;",
		">", "&gt;",
		"\"", "&quot;",
		"'", "&#39;",
	)
	return replacer.Replace(s)
}

// ========================================
// PATH TRAVERSAL DETECTION
// ========================================

// ContainsPathTraversal checks for path traversal attempts
func (s *InputSanitizer) ContainsPathTraversal(input string) bool {
	patterns := []string{
		"../",
		"..\\",
		"..%2f",
		"..%5c",
		"%2e%2e%2f",
		"%2e%2e/",
		"..%252f",
		"%c0%ae",
		"%c1%9c",
	}

	lower := strings.ToLower(input)
	for _, pattern := range patterns {
		if strings.Contains(lower, pattern) {
			return true
		}
	}

	return false
}

// ========================================
// COMMAND INJECTION DETECTION
// ========================================

// ContainsCommandInjection checks for command injection patterns
func (s *InputSanitizer) ContainsCommandInjection(input string) bool {
	patterns := []string{
		";",
		"|",
		"&&",
		"||",
		"`",
		"$(",
		"${",
		"\n",
		"\r",
	}

	for _, pattern := range patterns {
		if strings.Contains(input, pattern) {
			return true
		}
	}

	return false
}
