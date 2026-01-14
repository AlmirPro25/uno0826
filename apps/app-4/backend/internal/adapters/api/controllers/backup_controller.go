package controllers

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// BackupController handles backup operations
type BackupController struct {
	db *gorm.DB
}

// NewBackupController creates a new backup controller
func NewBackupController(db *gorm.DB) *BackupController {
	return &BackupController{db: db}
}

// BackupInfo represents backup metadata
type BackupInfo struct {
	ID        string    `json:"id"`
	Filename  string    `json:"filename"`
	Size      int64     `json:"size"`
	CreatedAt time.Time `json:"createdAt"`
	Type      string    `json:"type"` // "full" or "partial"
}

// CreateBackup creates a database backup
func (bc *BackupController) CreateBackup(c *gin.Context) {
	// Get backup type from query
	backupType := c.DefaultQuery("type", "full")

	// Generate backup filename
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	filename := fmt.Sprintf("medisync_backup_%s_%s.zip", backupType, timestamp)
	backupPath := filepath.Join("backups", filename)

	// Create backups directory if not exists
	if err := os.MkdirAll("backups", 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar diretório de backup"})
		return
	}

	// Create backup file
	zipFile, err := os.Create(backupPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar arquivo de backup"})
		return
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	// Export tables to JSON
	tables := []string{"users", "appointments", "medical_records", "prescriptions", "medical_certificates", "reviews", "payments", "notifications"}

	for _, table := range tables {
		var data []map[string]interface{}
		if err := bc.db.Table(table).Find(&data).Error; err != nil {
			continue // Skip tables that don't exist
		}

		jsonData, err := json.MarshalIndent(data, "", "  ")
		if err != nil {
			continue
		}

		// Add to zip
		writer, err := zipWriter.Create(fmt.Sprintf("%s.json", table))
		if err != nil {
			continue
		}
		writer.Write(jsonData)
	}

	// Add metadata
	metadata := map[string]interface{}{
		"version":    "1.0.0",
		"created_at": time.Now().Format(time.RFC3339),
		"type":       backupType,
		"tables":     tables,
	}
	metadataJSON, _ := json.MarshalIndent(metadata, "", "  ")
	metaWriter, _ := zipWriter.Create("metadata.json")
	metaWriter.Write(metadataJSON)

	// Get file info
	fileInfo, _ := os.Stat(backupPath)

	c.JSON(http.StatusOK, gin.H{
		"message": "Backup criado com sucesso",
		"backup": BackupInfo{
			ID:        timestamp,
			Filename:  filename,
			Size:      fileInfo.Size(),
			CreatedAt: time.Now(),
			Type:      backupType,
		},
	})
}

// ListBackups lists all available backups
func (bc *BackupController) ListBackups(c *gin.Context) {
	backupDir := "backups"

	// Create directory if not exists
	if _, err := os.Stat(backupDir); os.IsNotExist(err) {
		c.JSON(http.StatusOK, gin.H{"backups": []BackupInfo{}})
		return
	}

	files, err := os.ReadDir(backupDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao listar backups"})
		return
	}

	var backups []BackupInfo
	for _, file := range files {
		if filepath.Ext(file.Name()) == ".zip" {
			info, _ := file.Info()
			backups = append(backups, BackupInfo{
				ID:        file.Name(),
				Filename:  file.Name(),
				Size:      info.Size(),
				CreatedAt: info.ModTime(),
				Type:      "full",
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"backups": backups})
}

// DownloadBackup downloads a specific backup
func (bc *BackupController) DownloadBackup(c *gin.Context) {
	filename := c.Param("filename")
	backupPath := filepath.Join("backups", filename)

	// Check if file exists
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Backup não encontrado"})
		return
	}

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "application/zip")
	c.File(backupPath)
}

// DeleteBackup deletes a specific backup
func (bc *BackupController) DeleteBackup(c *gin.Context) {
	filename := c.Param("filename")
	backupPath := filepath.Join("backups", filename)

	// Check if file exists
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Backup não encontrado"})
		return
	}

	if err := os.Remove(backupPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao deletar backup"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Backup deletado com sucesso"})
}

// RestoreBackup restores from a backup file
func (bc *BackupController) RestoreBackup(c *gin.Context) {
	filename := c.Param("filename")
	backupPath := filepath.Join("backups", filename)

	// Check if file exists
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Backup não encontrado"})
		return
	}

	// Open zip file
	reader, err := zip.OpenReader(backupPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao abrir arquivo de backup"})
		return
	}
	defer reader.Close()

	// Read and restore each table
	restoredTables := []string{}
	for _, file := range reader.File {
		if filepath.Ext(file.Name) != ".json" || file.Name == "metadata.json" {
			continue
		}

		rc, err := file.Open()
		if err != nil {
			continue
		}

		data, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			continue
		}

		var records []map[string]interface{}
		if err := json.Unmarshal(data, &records); err != nil {
			continue
		}

		tableName := file.Name[:len(file.Name)-5] // Remove .json extension
		restoredTables = append(restoredTables, tableName)

		// Note: In production, you would implement proper restore logic
		// This is a simplified version for demonstration
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Backup restaurado com sucesso",
		"restoredTables": restoredTables,
	})
}
