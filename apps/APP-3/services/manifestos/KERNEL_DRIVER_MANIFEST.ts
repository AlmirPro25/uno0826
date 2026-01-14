/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🔧 KERNEL & DRIVER MANIFEST - MESTRE DO NÚCLEO 🔧                       ║
 * ║                                                                              ║
 * ║     "O KERNEL É O CORAÇÃO. O DRIVER É O NERVO.                              ║
 * ║      SEM ELES, O HARDWARE É APENAS METAL MORTO."                            ║
 * ║                                                                              ║
 * ║     NÍVEL: 98 (GOD MODE - KERNEL SPACE)                                     ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Especialidades:
 * - Linux Kernel Modules
 * - Windows Kernel Drivers (WDM, KMDF, UMDF)
 * - FreeBSD/macOS Kernel Extensions
 * - Bootloaders (GRUB, U-Boot, UEFI)
 * - Device Drivers (USB, PCIe, I2C, SPI, UART)
 * - File Systems
 * - Network Stack
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type KernelPlatform = 'linux' | 'windows' | 'freebsd' | 'macos' | 'bare-metal' | 'rtos';
export type DriverType = 'char' | 'block' | 'network' | 'usb' | 'pcie' | 'i2c' | 'spi' | 'gpio' | 'uart';
export type KernelLanguage = 'c' | 'rust' | 'assembly';

export interface KernelModuleConfig {
  platform: KernelPlatform;
  driverType: DriverType;
  language: KernelLanguage;
  features: string[];
  targetArch: 'x86_64' | 'arm64' | 'arm32' | 'riscv';
}

export interface DriverTemplate {
  name: string;
  platform: KernelPlatform;
  type: DriverType;
  files: Record<string, string>;
  buildSystem: string;
  testInstructions: string;
}

// ============================================================================
// TEMPLATES DE DRIVERS
// ============================================================================

export const DRIVER_TEMPLATES: Record<string, DriverTemplate> = {
  'linux-char-driver': {
    name: 'Linux Character Device Driver',
    platform: 'linux',
    type: 'char',
    files: {
      'driver.c': LINUX_CHAR_DRIVER_TEMPLATE(),
      'Makefile': LINUX_DRIVER_MAKEFILE(),
      'test_driver.sh': LINUX_DRIVER_TEST_SCRIPT()
    },
    buildSystem: 'make -C /lib/modules/$(uname -r)/build M=$(pwd) modules',
    testInstructions: 'sudo insmod driver.ko && echo "test" > /dev/mydevice'
  },
  
  'linux-usb-driver': {
    name: 'Linux USB Device Driver',
    platform: 'linux',
    type: 'usb',
    files: {
      'usb_driver.c': LINUX_USB_DRIVER_TEMPLATE(),
      'Makefile': LINUX_DRIVER_MAKEFILE()
    },
    buildSystem: 'make -C /lib/modules/$(uname -r)/build M=$(pwd) modules',
    testInstructions: 'sudo insmod usb_driver.ko && dmesg | tail'
  },
  
  'linux-i2c-driver': {
    name: 'Linux I2C Device Driver',
    platform: 'linux',
    type: 'i2c',
    files: {
      'i2c_driver.c': LINUX_I2C_DRIVER_TEMPLATE(),
      'Makefile': LINUX_DRIVER_MAKEFILE()
    },
    buildSystem: 'make -C /lib/modules/$(uname -r)/build M=$(pwd) modules',
    testInstructions: 'sudo insmod i2c_driver.ko && i2cdetect -y 1'
  },
  
  'rust-linux-driver': {
    name: 'Rust Linux Kernel Module',
    platform: 'linux',
    type: 'char',
    files: {
      'src/lib.rs': RUST_LINUX_DRIVER_TEMPLATE(),
      'Cargo.toml': RUST_KERNEL_CARGO_TOML(),
      'Makefile': RUST_KERNEL_MAKEFILE()
    },
    buildSystem: 'make LLVM=1',
    testInstructions: 'sudo insmod rust_driver.ko'
  }
};

// ============================================================================
// TEMPLATES DE CÓDIGO
// ============================================================================

function LINUX_CHAR_DRIVER_TEMPLATE(): string {
  return `// Linux Character Device Driver
// Compilar: make -C /lib/modules/$(uname -r)/build M=$(pwd) modules

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>

#define DEVICE_NAME "mydevice"
#define CLASS_NAME "myclass"
#define BUFFER_SIZE 1024

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("Character Device Driver");
MODULE_VERSION("1.0");

static int major_number;
static struct class *device_class = NULL;
static struct device *device = NULL;
static struct cdev my_cdev;
static char device_buffer[BUFFER_SIZE];
static int buffer_pointer = 0;

// File Operations
static int device_open(struct inode *inode, struct file *file) {
    pr_info("%s: Device opened\\n", DEVICE_NAME);
    return 0;
}

static int device_release(struct inode *inode, struct file *file) {
    pr_info("%s: Device closed\\n", DEVICE_NAME);
    return 0;
}

static ssize_t device_read(struct file *file, char __user *buf, 
                           size_t count, loff_t *offset) {
    int bytes_to_read = min((int)count, buffer_pointer);
    
    if (bytes_to_read == 0) {
        pr_info("%s: No data to read\\n", DEVICE_NAME);
        return 0;
    }
    
    if (copy_to_user(buf, device_buffer, bytes_to_read)) {
        return -EFAULT;
    }
    
    pr_info("%s: Read %d bytes\\n", DEVICE_NAME, bytes_to_read);
    buffer_pointer = 0;
    return bytes_to_read;
}

static ssize_t device_write(struct file *file, const char __user *buf,
                            size_t count, loff_t *offset) {
    int bytes_to_write = min((int)count, BUFFER_SIZE - 1);
    
    if (copy_from_user(device_buffer, buf, bytes_to_write)) {
        return -EFAULT;
    }
    
    device_buffer[bytes_to_write] = '\\0';
    buffer_pointer = bytes_to_write;
    pr_info("%s: Wrote %d bytes\\n", DEVICE_NAME, bytes_to_write);
    return bytes_to_write;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = device_open,
    .release = device_release,
    .read = device_read,
    .write = device_write,
};

static int __init driver_init(void) {
    dev_t dev;
    int ret;
    
    // Allocate major number
    ret = alloc_chrdev_region(&dev, 0, 1, DEVICE_NAME);
    if (ret < 0) {
        pr_err("%s: Failed to allocate major number\\n", DEVICE_NAME);
        return ret;
    }
    major_number = MAJOR(dev);
    
    // Initialize cdev
    cdev_init(&my_cdev, &fops);
    my_cdev.owner = THIS_MODULE;
    
    ret = cdev_add(&my_cdev, dev, 1);
    if (ret < 0) {
        unregister_chrdev_region(dev, 1);
        return ret;
    }
    
    // Create device class
    device_class = class_create(THIS_MODULE, CLASS_NAME);
    if (IS_ERR(device_class)) {
        cdev_del(&my_cdev);
        unregister_chrdev_region(dev, 1);
        return PTR_ERR(device_class);
    }
    
    // Create device
    device = device_create(device_class, NULL, dev, NULL, DEVICE_NAME);
    if (IS_ERR(device)) {
        class_destroy(device_class);
        cdev_del(&my_cdev);
        unregister_chrdev_region(dev, 1);
        return PTR_ERR(device);
    }
    
    pr_info("%s: Driver loaded (major=%d)\\n", DEVICE_NAME, major_number);
    return 0;
}

static void __exit driver_exit(void) {
    dev_t dev = MKDEV(major_number, 0);
    
    device_destroy(device_class, dev);
    class_destroy(device_class);
    cdev_del(&my_cdev);
    unregister_chrdev_region(dev, 1);
    
    pr_info("%s: Driver unloaded\\n", DEVICE_NAME);
}

module_init(driver_init);
module_exit(driver_exit);`;
}

function LINUX_DRIVER_MAKEFILE(): string {
  return `# Linux Kernel Module Makefile

obj-m += driver.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
\t$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
\t$(MAKE) -C $(KDIR) M=$(PWD) clean

install:
\tsudo insmod driver.ko

uninstall:
\tsudo rmmod driver

test:
\t@echo "Testing driver..."
\tsudo dmesg | tail -20

.PHONY: all clean install uninstall test`;
}

function LINUX_DRIVER_TEST_SCRIPT(): string {
  return `#!/bin/bash
# Test script for Linux driver

set -e

echo "=== Building driver ==="
make clean
make

echo "=== Loading driver ==="
sudo insmod driver.ko

echo "=== Checking dmesg ==="
dmesg | tail -5

echo "=== Testing write ==="
echo "Hello from userspace" | sudo tee /dev/mydevice

echo "=== Testing read ==="
sudo cat /dev/mydevice

echo "=== Unloading driver ==="
sudo rmmod driver

echo "=== Test complete ==="`;
}


function LINUX_USB_DRIVER_TEMPLATE(): string {
  return `// Linux USB Device Driver
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/usb.h>

#define VENDOR_ID  0x1234
#define PRODUCT_ID 0x5678

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("USB Device Driver");

static struct usb_device_id usb_table[] = {
    { USB_DEVICE(VENDOR_ID, PRODUCT_ID) },
    { } // Terminating entry
};
MODULE_DEVICE_TABLE(usb, usb_table);

static int usb_probe(struct usb_interface *interface,
                     const struct usb_device_id *id) {
    struct usb_device *dev = interface_to_usbdev(interface);
    
    pr_info("USB device connected: VID=0x%04X, PID=0x%04X\\n",
            id->idVendor, id->idProduct);
    pr_info("  Manufacturer: %s\\n", dev->manufacturer);
    pr_info("  Product: %s\\n", dev->product);
    
    return 0;
}

static void usb_disconnect(struct usb_interface *interface) {
    pr_info("USB device disconnected\\n");
}

static struct usb_driver usb_driver = {
    .name = "my_usb_driver",
    .id_table = usb_table,
    .probe = usb_probe,
    .disconnect = usb_disconnect,
};

module_usb_driver(usb_driver);`;
}

function LINUX_I2C_DRIVER_TEMPLATE(): string {
  return `// Linux I2C Device Driver
#include <linux/module.h>
#include <linux/i2c.h>
#include <linux/of.h>

#define DRIVER_NAME "my_i2c_sensor"

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Your Name");
MODULE_DESCRIPTION("I2C Sensor Driver");

struct my_sensor_data {
    struct i2c_client *client;
    struct mutex lock;
    u8 config;
};

static int my_sensor_read_reg(struct i2c_client *client, u8 reg) {
    return i2c_smbus_read_byte_data(client, reg);
}

static int my_sensor_write_reg(struct i2c_client *client, u8 reg, u8 val) {
    return i2c_smbus_write_byte_data(client, reg, val);
}

static int my_sensor_probe(struct i2c_client *client,
                           const struct i2c_device_id *id) {
    struct my_sensor_data *data;
    int ret;
    
    data = devm_kzalloc(&client->dev, sizeof(*data), GFP_KERNEL);
    if (!data)
        return -ENOMEM;
    
    data->client = client;
    mutex_init(&data->lock);
    i2c_set_clientdata(client, data);
    
    // Read device ID
    ret = my_sensor_read_reg(client, 0x00);
    if (ret < 0) {
        dev_err(&client->dev, "Failed to read device ID\\n");
        return ret;
    }
    
    dev_info(&client->dev, "Sensor probed, ID=0x%02X\\n", ret);
    return 0;
}

static int my_sensor_remove(struct i2c_client *client) {
    dev_info(&client->dev, "Sensor removed\\n");
    return 0;
}

static const struct i2c_device_id my_sensor_id[] = {
    { DRIVER_NAME, 0 },
    { }
};
MODULE_DEVICE_TABLE(i2c, my_sensor_id);

static const struct of_device_id my_sensor_of_match[] = {
    { .compatible = "vendor,my-sensor" },
    { }
};
MODULE_DEVICE_TABLE(of, my_sensor_of_match);

static struct i2c_driver my_sensor_driver = {
    .driver = {
        .name = DRIVER_NAME,
        .of_match_table = my_sensor_of_match,
    },
    .probe = my_sensor_probe,
    .remove = my_sensor_remove,
    .id_table = my_sensor_id,
};

module_i2c_driver(my_sensor_driver);`;
}

function RUST_LINUX_DRIVER_TEMPLATE(): string {
  return `// Rust Linux Kernel Module
// Requires: Linux 6.1+ with Rust support enabled

#![no_std]
#![feature(allocator_api, global_asm)]

use kernel::prelude::*;
use kernel::{chrdev, file, miscdev};

module! {
    type: RustDriver,
    name: "rust_driver",
    author: "Your Name",
    description: "Rust Linux Kernel Module",
    license: "GPL",
}

struct RustDriver {
    _dev: Pin<Box<miscdev::Registration<RustDriver>>>,
}

#[vtable]
impl file::Operations for RustDriver {
    fn open(_context: &Self::OpenData, _file: &file::File) -> Result<Self::Data> {
        pr_info!("Device opened\\n");
        Ok(())
    }
    
    fn read(
        _data: (),
        _file: &file::File,
        writer: &mut impl kernel::io_buffer::IoBufferWriter,
        _offset: u64,
    ) -> Result<usize> {
        let msg = b"Hello from Rust kernel module!\\n";
        writer.write_slice(msg)?;
        Ok(msg.len())
    }
    
    fn write(
        _data: (),
        _file: &file::File,
        reader: &mut impl kernel::io_buffer::IoBufferReader,
        _offset: u64,
    ) -> Result<usize> {
        let len = reader.len();
        pr_info!("Received {} bytes\\n", len);
        Ok(len)
    }
}

impl kernel::Module for RustDriver {
    fn init(_name: &'static CStr, _module: &'static ThisModule) -> Result<Self> {
        pr_info!("Rust driver loaded\\n");
        
        let reg = miscdev::Registration::new_pinned(fmt!("rust_device"), ())?;
        
        Ok(RustDriver { _dev: reg })
    }
}

impl Drop for RustDriver {
    fn drop(&mut self) {
        pr_info!("Rust driver unloaded\\n");
    }
}`;
}

function RUST_KERNEL_CARGO_TOML(): string {
  return `[package]
name = "rust_driver"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["staticlib"]

[dependencies]
kernel = { path = "rust/kernel" }

[profile.release]
panic = "abort"
opt-level = 2`;
}

function RUST_KERNEL_MAKEFILE(): string {
  return `# Rust Linux Kernel Module Makefile
KDIR := /lib/modules/$(shell uname -r)/build

obj-m := rust_driver.o

all:
\t$(MAKE) -C $(KDIR) M=$(PWD) LLVM=1 modules

clean:
\t$(MAKE) -C $(KDIR) M=$(PWD) clean

.PHONY: all clean`;
}

// ============================================================================
// COMBINAÇÕES POLYGLOT PARA KERNEL/DRIVER
// ============================================================================

export const KERNEL_POLYGLOT_COMBINATIONS = [
  {
    name: 'C Kernel + Rust Safety Layer',
    primary: 'c',
    secondary: 'rust',
    useCase: 'Kernel em C com módulos críticos em Rust para memory safety',
    interop: 'FFI via extern "C"',
    example: 'Linux kernel com drivers Rust'
  },
  {
    name: 'C Kernel + Assembly Boot',
    primary: 'c',
    secondary: 'assembly',
    useCase: 'Kernel em C com bootloader e context switch em Assembly',
    interop: 'Inline assembly ou arquivos .S',
    example: 'Qualquer kernel real (Linux, Windows, etc)'
  },
  {
    name: 'Rust Kernel + C Legacy',
    primary: 'rust',
    secondary: 'c',
    useCase: 'Kernel moderno em Rust com suporte a drivers C legados',
    interop: 'bindgen para gerar bindings',
    example: 'Redox OS, Rust-for-Linux'
  },
  {
    name: 'C Driver + Python Test',
    primary: 'c',
    secondary: 'python',
    useCase: 'Driver em C com suite de testes em Python',
    interop: 'ctypes ou subprocess para testar via /dev',
    example: 'Testes automatizados de drivers'
  }
];

// ============================================================================
// DETECTOR DE REQUISITOS DE KERNEL/DRIVER
// ============================================================================

export function shouldEnableKernelDriver(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    // Kernel
    'kernel', 'kernel module', 'módulo do kernel', 'kmod',
    'linux kernel', 'windows kernel', 'freebsd kernel',
    'kernel space', 'ring 0', 'supervisor mode',
    
    // Driver
    'driver', 'device driver', 'char driver', 'block driver',
    'network driver', 'usb driver', 'pcie driver',
    'i2c driver', 'spi driver', 'gpio driver', 'uart driver',
    
    // Boot
    'bootloader', 'grub', 'u-boot', 'uefi', 'bios',
    'boot sequence', 'mbr', 'gpt', 'efi',
    
    // Específicos
    'insmod', 'rmmod', 'modprobe', 'lsmod',
    'dmesg', '/dev/', 'ioctl', 'mmap',
    'interrupt handler', 'irq', 'isr',
    'dma', 'memory mapped', 'mmio',
    
    // File systems
    'file system', 'filesystem', 'vfs', 'ext4', 'btrfs',
    'fuse', 'block device'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}


// ============================================================================
// MANIFESTO TEXTUAL
// ============================================================================

export const KERNEL_DRIVER_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     🔧 KERNEL & DRIVER MANIFEST - MESTRE DO NÚCLEO 🔧                       ║
║                                                                              ║
║     "O KERNEL É O CORAÇÃO. O DRIVER É O NERVO.                              ║
║      SEM ELES, O HARDWARE É APENAS METAL MORTO."                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🔧 LINGUAGENS OBRIGATÓRIAS PARA KERNEL/DRIVER
═══════════════════════════════════════════════════════════════════════════════

TIER 1 - OBRIGATÓRIO:
├── C (C11/C17)     → Linguagem padrão para kernels
├── Assembly        → Boot, context switch, ISRs
└── Rust            → Módulos com memory safety (Linux 6.1+)

TIER 2 - AUXILIAR:
├── Python          → Scripts de teste e automação
├── Shell/Bash      → Build scripts, instalação
└── Makefile        → Sistema de build

❌ NUNCA USE PARA KERNEL/DRIVER:
├── JavaScript/TypeScript
├── Java/C#
├── Go (não tem acesso a kernel space)
└── Qualquer linguagem com GC

═══════════════════════════════════════════════════════════════════════════════
📋 TIPOS DE DRIVERS E SUAS CARACTERÍSTICAS
═══════════════════════════════════════════════════════════════════════════════

CHARACTER DEVICE (char):
├── Acesso sequencial (stream)
├── Exemplos: /dev/tty, /dev/random, sensores
├── File ops: open, read, write, release, ioctl
└── Major/Minor numbers

BLOCK DEVICE:
├── Acesso aleatório (blocos)
├── Exemplos: /dev/sda, /dev/nvme0n1
├── Request queue, bio structures
└── Partições, file systems

NETWORK DEVICE:
├── Pacotes de rede
├── Exemplos: eth0, wlan0
├── net_device structure
└── NAPI, sk_buff

USB DEVICE:
├── Hot-plug, enumeration
├── Endpoints, interfaces
├── URBs (USB Request Blocks)
└── Vendor/Product ID matching

I2C/SPI/GPIO:
├── Comunicação com sensores/periféricos
├── Device Tree bindings
├── Regmap API
└── Platform drivers

═══════════════════════════════════════════════════════════════════════════════
🏗️ ESTRUTURA DE PROJETO KERNEL MODULE
═══════════════════════════════════════════════════════════════════════════════

driver-project/
├── src/
│   ├── main.c              # Entry point (init/exit)
│   ├── device.c            # Device operations
│   ├── ioctl.c             # IOCTL handlers
│   └── platform.c          # Platform driver (se aplicável)
├── include/
│   ├── driver.h            # Headers públicos
│   └── ioctl_cmds.h        # Definições de IOCTL
├── dts/
│   └── overlay.dts         # Device Tree overlay
├── test/
│   ├── test_driver.c       # Userspace test program
│   └── test_driver.py      # Python test suite
├── Makefile                # Kernel build system
├── Kconfig                 # Kernel config options
└── README.md               # Documentação

═══════════════════════════════════════════════════════════════════════════════
⚠️ REGRAS INVIOLÁVEIS PARA KERNEL CODE
═══════════════════════════════════════════════════════════════════════════════

1. NUNCA use funções de userspace (printf, malloc, etc)
   → Use pr_info(), kmalloc(), kzalloc()

2. SEMPRE verifique retornos de alocação
   → if (!ptr) return -ENOMEM;

3. SEMPRE use copy_to_user/copy_from_user
   → Nunca acesse memória de userspace diretamente

4. SEMPRE libere recursos em ordem reversa
   → O que foi alocado primeiro, libera por último

5. SEMPRE use spinlocks/mutexes para dados compartilhados
   → spin_lock_irqsave() em contexto de interrupção

6. NUNCA durma em contexto de interrupção
   → Use workqueues ou tasklets

7. SEMPRE valide parâmetros de IOCTL
   → Usuário pode passar qualquer coisa

8. SEMPRE use __init e __exit para funções de módulo
   → Permite que o kernel descarte código após init

═══════════════════════════════════════════════════════════════════════════════
🔗 COMBINAÇÕES POLYGLOT VÁLIDAS
═══════════════════════════════════════════════════════════════════════════════

✅ C + Assembly:
   Kernel em C, boot/context switch em Assembly
   Interop: inline asm ou arquivos .S

✅ C + Rust:
   Kernel em C, módulos críticos em Rust
   Interop: extern "C", bindgen

✅ C + Python (teste):
   Driver em C, testes em Python
   Interop: ctypes, /dev/ interface

❌ PROIBIDO:
   Kernel em JavaScript/TypeScript
   Driver em Python (exceto teste)
   Qualquer coisa com GC em kernel space

═══════════════════════════════════════════════════════════════════════════════
📦 FERRAMENTAS ESSENCIAIS
═══════════════════════════════════════════════════════════════════════════════

BUILD:
├── make, gcc, clang
├── kernel headers
└── cross-compile toolchain

DEBUG:
├── dmesg, journalctl
├── ftrace, perf
├── kgdb, crash
└── printk levels

TEST:
├── kunit (kernel unit tests)
├── kselftest
├── syzkaller (fuzzing)
└── sparse, smatch (static analysis)

═══════════════════════════════════════════════════════════════════════════════

"O KERNEL NÃO PERDOA ERROS. UM BUG AQUI É UM KERNEL PANIC."

                    — Kernel & Driver Manifest, Level 98
`;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  KERNEL_DRIVER_MANIFEST,
  DRIVER_TEMPLATES,
  KERNEL_POLYGLOT_COMBINATIONS,
  shouldEnableKernelDriver
};