# ============================================================================
# MAKEFILE - EXEMPLOS AVANÇADOS DE LOW LEVEL SYSTEMS
# ============================================================================

# Compiladores
CC = gcc
AS = nasm
CFLAGS = -Wall -Wextra -O2 -std=c11 -g
CFLAGS_SIMD = -Wall -Wextra -O3 -mavx2 -mfma -std=c11 -g
ASFLAGS = -f elf64 -g
LDFLAGS = -lm

# Diretórios
BUILD_DIR = build
BIN_DIR = bin

# Targets
.PHONY: all clean help assembly simd kernel freertos

help:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║     ADVANCED LOW LEVEL SYSTEMS BUILD                      ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Targets:"
	@echo "  make assembly  - Build Assembly x86_64 examples"
	@echo "  make simd      - Build SIMD (SSE/AVX) examples"
	@echo "  make kernel    - Build Linux Kernel Module (requires kernel headers)"
	@echo "  make freertos  - Build FreeRTOS example (requires FreeRTOS SDK)"
	@echo "  make all       - Build all (except kernel and freertos)"
	@echo "  make clean     - Remove build artifacts"
	@echo ""

all: assembly simd

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

$(BIN_DIR):
	@mkdir -p $(BIN_DIR)

# ============================================================================
# ASSEMBLY x86_64
# ============================================================================

assembly: $(BIN_DIR)/assembly_demo

$(BUILD_DIR)/assembly_x86_64.o: assembly_x86_64.asm | $(BUILD_DIR)
	@echo "[ASM] Assembling $<"
	@$(AS) $(ASFLAGS) $< -o $@

$(BUILD_DIR)/assembly_main.o: assembly_main.c | $(BUILD_DIR)
	@echo "[CC] Compiling $<"
	@$(CC) $(CFLAGS) -c $< -o $@

$(BIN_DIR)/assembly_demo: $(BUILD_DIR)/assembly_x86_64.o $(BUILD_DIR)/assembly_main.o | $(BIN_DIR)
	@echo "[LD] Linking $@"
	@$(CC) $^ -o $@ -no-pie
	@echo "[SUCCESS] Built: $@"

# Standalone assembly (sem C)
$(BIN_DIR)/assembly_standalone: $(BUILD_DIR)/assembly_x86_64.o | $(BIN_DIR)
	@echo "[LD] Linking standalone $@"
	@ld $< -o $@
	@echo "[SUCCESS] Built: $@"

# ============================================================================
# SIMD (SSE/AVX)
# ============================================================================

simd: $(BIN_DIR)/simd_demo

$(BIN_DIR)/simd_demo: simd_avx_example.c | $(BIN_DIR)
	@echo "[CC] Compiling SIMD example with AVX2+FMA"
	@$(CC) $(CFLAGS_SIMD) $< -o $@ $(LDFLAGS)
	@echo "[SUCCESS] Built: $@"

# ============================================================================
# LINUX KERNEL MODULE
# ============================================================================

kernel:
	@echo "[KERNEL] Building Linux Kernel Module"
	@echo "NOTE: Requires kernel headers installed"
	@echo "Run: make -C /lib/modules/$$(uname -r)/build M=$$(pwd) modules"
	@if [ -d "/lib/modules/$$(uname -r)/build" ]; then \
		make -C /lib/modules/$$(uname -r)/build M=$$(pwd) modules; \
	else \
		echo "ERROR: Kernel headers not found"; \
		echo "Install with: sudo apt-get install linux-headers-$$(uname -r)"; \
	fi

kernel-clean:
	@echo "[KERNEL] Cleaning kernel module"
	@if [ -d "/lib/modules/$$(uname -r)/build" ]; then \
		make -C /lib/modules/$$(uname -r)/build M=$$(pwd) clean; \
	fi

# ============================================================================
# FREERTOS (Requer SDK)
# ============================================================================

freertos:
	@echo "[FREERTOS] FreeRTOS example"
	@echo "NOTE: This example requires FreeRTOS SDK"
	@echo ""
	@echo "For ESP32:"
	@echo "  idf.py build"
	@echo ""
	@echo "For STM32:"
	@echo "  Use STM32CubeIDE"
	@echo ""
	@echo "For POSIX Simulator:"
	@echo "  Download FreeRTOS from https://www.freertos.org/"
	@echo "  Configure FreeRTOSConfig.h"
	@echo "  Compile with: gcc -I<freertos_path>/include freertos_example.c -o freertos_demo"

# ============================================================================
# RUN TARGETS
# ============================================================================

run-assembly: assembly
	@echo "[RUN] Running Assembly demo"
	@./$(BIN_DIR)/assembly_demo

run-simd: simd
	@echo "[RUN] Running SIMD demo"
	@./$(BIN_DIR)/simd_demo

# ============================================================================
# CLEAN
# ============================================================================

clean:
	@echo "[CLEAN] Removing build artifacts"
	@rm -rf $(BUILD_DIR) $(BIN_DIR)
	@rm -f *.o *.ko *.mod.c *.mod.o *.order *.symvers .*.cmd
	@rm -rf .tmp_versions
	@echo "[CLEAN] Done"

# ============================================================================
# INFO
# ============================================================================

info:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║     BUILD INFORMATION                                     ║"
	@echo "╚════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "C Compiler: $(CC)"
	@echo "Assembler: $(AS)"
	@echo "C Flags: $(CFLAGS)"
	@echo "SIMD Flags: $(CFLAGS_SIMD)"
	@echo "ASM Flags: $(ASFLAGS)"
	@echo ""
	@echo "CPU Info:"
	@cat /proc/cpuinfo | grep "model name" | head -1
	@echo ""
	@echo "SIMD Support:"
	@cat /proc/cpuinfo | grep flags | head -1 | tr ' ' '\n' | grep -E "sse|avx|fma" | sort -u | tr '\n' ' '
	@echo ""
