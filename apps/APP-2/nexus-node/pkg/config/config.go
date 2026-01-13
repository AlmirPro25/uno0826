package config

import (
	"os"
	"strconv"
	"strings"
)

// Config holds all the application configuration
type Config struct {
	Version            string
	IdentityFile       string
	IdentityPassphrase string
	DatabasePath       string
	DatabasePassphrase string
	APIPort            string
	P2PPort            int
	BootstrapPeers     []string
	STUNServers        []string
	DHTClient          bool
	EnableMdns         bool
	EnableWebRTC       bool
	// Kernel integration (optional)
	KernelEnabled   bool
	KernelURL       string
	KernelAppKey    string
	KernelAppSecret string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	cfg := &Config{
		Version:            "0.1.0-alpha",
		IdentityFile:       getEnv("NEXUS_IDENTITY_FILE", "nexus_identity.key"),
		IdentityPassphrase: getEnv("NEXUS_IDENTITY_PASSPHRASE", "nexus-default-passphrase-change-me"),
		DatabasePath:       getEnv("NEXUS_DATABASE_PATH", "nexus_data.db"),
		DatabasePassphrase: getEnv("NEXUS_DATABASE_PASSPHRASE", "nexus-db-passphrase-change-me"),
		APIPort:            getEnv("NEXUS_API_PORT", "8080"),
		P2PPort:            getEnvAsInt("NEXUS_P2P_PORT", 4001),
		DHTClient:          getEnvAsBool("NEXUS_DHT_CLIENT_ONLY", false),
		EnableMdns:         getEnvAsBool("NEXUS_ENABLE_MDNS", true),
		EnableWebRTC:       getEnvAsBool("NEXUS_ENABLE_WEBRTC", true),
		// Kernel integration (opt-in)
		KernelEnabled:   getEnvAsBool("NEXUS_KERNEL_ENABLED", false),
		KernelURL:       getEnv("NEXUS_KERNEL_URL", "https://uno0826.onrender.com"),
		KernelAppKey:    getEnv("NEXUS_KERNEL_APP_KEY", ""),
		KernelAppSecret: getEnv("NEXUS_KERNEL_APP_SECRET", ""),
	}

	// Bootstrap peers for Kademlia DHT
	bootstrapPeersStr := getEnv("NEXUS_BOOTSTRAP_PEERS", "")
	if bootstrapPeersStr != "" {
		cfg.BootstrapPeers = splitAndTrim(bootstrapPeersStr, ",")
	} else {
		cfg.BootstrapPeers = []string{
			"/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bpjYzQVPdVWK8VqNRxGSb2KBCz2amWkLHPMWJ",
			"/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2Lk59dRnySPvWs99RTTswza4P7x7N3BWa2RWc22hS",
			"/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6oJYW9ZZGF84YHVv3DyY7PRxfr",
		}
	}

	// STUN servers for WebRTC
	stunServersStr := getEnv("NEXUS_STUN_SERVERS", "")
	if stunServersStr != "" {
		cfg.STUNServers = splitAndTrim(stunServersStr, ",")
	} else {
		cfg.STUNServers = []string{
			"stun.l.google.com:19302",
			"stun1.l.google.com:19302",
			"stun2.l.google.com:19302",
		}
	}

	return cfg, nil
}

func getEnv(key string, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	strValue := getEnv(key, "")
	if intValue, err := strconv.Atoi(strValue); err == nil {
		return intValue
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	strValue := getEnv(key, "")
	if boolValue, err := strconv.ParseBool(strValue); err == nil {
		return boolValue
	}
	return defaultValue
}

func splitAndTrim(s, sep string) []string {
	parts := strings.Split(s, sep)
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
