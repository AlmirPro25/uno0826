/**
 * ============================================================================
 * LINUX KERNEL MODULE - EXEMPLO COMPLETO
 * ============================================================================
 * 
 * Este é um exemplo de driver de caractere (char device) para Linux.
 * 
 * Compilar:
 *   make -C /lib/modules/$(uname -r)/build M=$(pwd) modules
 * 
 * Carregar:
 *   sudo insmod hello_driver.ko
 * 
 * Verificar:
 *   dmesg | tail
 *   cat /proc/devices | grep hello
 * 
 * Criar device node:
 *   sudo mknod /dev/hello c <major> 0
 * 
 * Testar:
 *   echo "test" > /dev/hello
 *   cat /dev/hello
 * 
 * Descarregar:
 *   sudo rmmod hello_driver
 * 
 * ============================================================================
 */

#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/slab.h>
#include <linux/mutex.h>

// Metadados do módulo
MODULE_LICENSE("GPL");
MODULE_AUTHOR("Low Level Systems Master");
MODULE_DESCRIPTION("Exemplo de Linux Kernel Module - Char Device Driver");
MODULE_VERSION("1.0");

// ============================================================================
// DEFINIÇÕES
// ============================================================================

#define DEVICE_NAME "hello"
#define CLASS_NAME "hello_class"
#define BUFFER_SIZE 1024

// ============================================================================
// ESTRUTURAS
// ============================================================================

struct hello_device {
    char *buffer;
    size_t buffer_size;
    size_t data_len;
    struct mutex lock;
    dev_t dev_num;
    struct cdev cdev;
    struct class *class;
    struct device *device;
};

static struct hello_device *hello_dev = NULL;

// ============================================================================
// PROTÓTIPOS
// ============================================================================

static int hello_open(struct inode *inode, struct file *file);
static int hello_release(struct inode *inode, struct file *file);
static ssize_t hello_read(struct file *file, char __user *buf, size_t count, loff_t *offset);
static ssize_t hello_write(struct file *file, const char __user *buf, size_t count, loff_t *offset);
static long hello_ioctl(struct file *file, unsigned int cmd, unsigned long arg);

// ============================================================================
// FILE OPERATIONS
// ============================================================================

static struct file_operations hello_fops = {
    .owner = THIS_MODULE,
    .open = hello_open,
    .release = hello_release,
    .read = hello_read,
    .write = hello_write,
    .unlocked_ioctl = hello_ioctl,
};

// ============================================================================
// IOCTL COMMANDS
// ============================================================================

#define HELLO_IOCTL_MAGIC 'H'
#define HELLO_IOCTL_CLEAR    _IO(HELLO_IOCTL_MAGIC, 0)
#define HELLO_IOCTL_GET_SIZE _IOR(HELLO_IOCTL_MAGIC, 1, size_t)
#define HELLO_IOCTL_SET_SIZE _IOW(HELLO_IOCTL_MAGIC, 2, size_t)

// ============================================================================
// IMPLEMENTAÇÃO DAS OPERAÇÕES
// ============================================================================

/**
 * Chamado quando o dispositivo é aberto
 */
static int hello_open(struct inode *inode, struct file *file)
{
    pr_info("hello: device opened\n");
    
    // Armazena ponteiro para nossa estrutura no file
    file->private_data = hello_dev;
    
    return 0;
}

/**
 * Chamado quando o dispositivo é fechado
 */
static int hello_release(struct inode *inode, struct file *file)
{
    pr_info("hello: device closed\n");
    return 0;
}

/**
 * Chamado quando o usuário lê do dispositivo
 */
static ssize_t hello_read(struct file *file, char __user *buf, size_t count, loff_t *offset)
{
    struct hello_device *dev = file->private_data;
    ssize_t bytes_read = 0;
    
    if (mutex_lock_interruptible(&dev->lock))
        return -ERESTARTSYS;
    
    // Verifica se já leu tudo
    if (*offset >= dev->data_len) {
        mutex_unlock(&dev->lock);
        return 0;  // EOF
    }
    
    // Calcula quantos bytes ler
    bytes_read = min(count, dev->data_len - (size_t)*offset);
    
    // Copia para userspace
    if (copy_to_user(buf, dev->buffer + *offset, bytes_read)) {
        mutex_unlock(&dev->lock);
        return -EFAULT;
    }
    
    *offset += bytes_read;
    
    pr_info("hello: read %zd bytes\n", bytes_read);
    
    mutex_unlock(&dev->lock);
    return bytes_read;
}

/**
 * Chamado quando o usuário escreve no dispositivo
 */
static ssize_t hello_write(struct file *file, const char __user *buf, size_t count, loff_t *offset)
{
    struct hello_device *dev = file->private_data;
    ssize_t bytes_written = 0;
    
    if (mutex_lock_interruptible(&dev->lock))
        return -ERESTARTSYS;
    
    // Limita ao tamanho do buffer
    bytes_written = min(count, dev->buffer_size - 1);
    
    // Copia de userspace
    if (copy_from_user(dev->buffer, buf, bytes_written)) {
        mutex_unlock(&dev->lock);
        return -EFAULT;
    }
    
    dev->buffer[bytes_written] = '\0';
    dev->data_len = bytes_written;
    
    pr_info("hello: wrote %zd bytes: %s\n", bytes_written, dev->buffer);
    
    mutex_unlock(&dev->lock);
    return bytes_written;
}

/**
 * Chamado para comandos IOCTL
 */
static long hello_ioctl(struct file *file, unsigned int cmd, unsigned long arg)
{
    struct hello_device *dev = file->private_data;
    long ret = 0;
    
    if (mutex_lock_interruptible(&dev->lock))
        return -ERESTARTSYS;
    
    switch (cmd) {
    case HELLO_IOCTL_CLEAR:
        memset(dev->buffer, 0, dev->buffer_size);
        dev->data_len = 0;
        pr_info("hello: buffer cleared\n");
        break;
        
    case HELLO_IOCTL_GET_SIZE:
        if (copy_to_user((size_t __user *)arg, &dev->data_len, sizeof(size_t))) {
            ret = -EFAULT;
        }
        break;
        
    case HELLO_IOCTL_SET_SIZE:
        // Não implementado neste exemplo
        ret = -ENOTTY;
        break;
        
    default:
        ret = -ENOTTY;
        break;
    }
    
    mutex_unlock(&dev->lock);
    return ret;
}

// ============================================================================
// INICIALIZAÇÃO E CLEANUP
// ============================================================================

/**
 * Chamado quando o módulo é carregado
 */
static int __init hello_init(void)
{
    int ret;
    
    pr_info("hello: initializing module\n");
    
    // Aloca estrutura do dispositivo
    hello_dev = kzalloc(sizeof(struct hello_device), GFP_KERNEL);
    if (!hello_dev) {
        pr_err("hello: failed to allocate device structure\n");
        return -ENOMEM;
    }
    
    // Aloca buffer
    hello_dev->buffer_size = BUFFER_SIZE;
    hello_dev->buffer = kzalloc(BUFFER_SIZE, GFP_KERNEL);
    if (!hello_dev->buffer) {
        pr_err("hello: failed to allocate buffer\n");
        ret = -ENOMEM;
        goto fail_buffer;
    }
    
    // Inicializa mutex
    mutex_init(&hello_dev->lock);
    
    // Aloca major number dinamicamente
    ret = alloc_chrdev_region(&hello_dev->dev_num, 0, 1, DEVICE_NAME);
    if (ret < 0) {
        pr_err("hello: failed to allocate major number\n");
        goto fail_chrdev;
    }
    
    pr_info("hello: registered with major %d, minor %d\n",
            MAJOR(hello_dev->dev_num), MINOR(hello_dev->dev_num));
    
    // Inicializa cdev
    cdev_init(&hello_dev->cdev, &hello_fops);
    hello_dev->cdev.owner = THIS_MODULE;
    
    ret = cdev_add(&hello_dev->cdev, hello_dev->dev_num, 1);
    if (ret < 0) {
        pr_err("hello: failed to add cdev\n");
        goto fail_cdev;
    }
    
    // Cria classe do dispositivo
    hello_dev->class = class_create(THIS_MODULE, CLASS_NAME);
    if (IS_ERR(hello_dev->class)) {
        pr_err("hello: failed to create class\n");
        ret = PTR_ERR(hello_dev->class);
        goto fail_class;
    }
    
    // Cria device node automaticamente
    hello_dev->device = device_create(hello_dev->class, NULL,
                                       hello_dev->dev_num, NULL, DEVICE_NAME);
    if (IS_ERR(hello_dev->device)) {
        pr_err("hello: failed to create device\n");
        ret = PTR_ERR(hello_dev->device);
        goto fail_device;
    }
    
    // Mensagem inicial no buffer
    strcpy(hello_dev->buffer, "Hello from kernel space!\n");
    hello_dev->data_len = strlen(hello_dev->buffer);
    
    pr_info("hello: module loaded successfully\n");
    return 0;
    
fail_device:
    class_destroy(hello_dev->class);
fail_class:
    cdev_del(&hello_dev->cdev);
fail_cdev:
    unregister_chrdev_region(hello_dev->dev_num, 1);
fail_chrdev:
    kfree(hello_dev->buffer);
fail_buffer:
    kfree(hello_dev);
    return ret;
}

/**
 * Chamado quando o módulo é descarregado
 */
static void __exit hello_exit(void)
{
    pr_info("hello: unloading module\n");
    
    device_destroy(hello_dev->class, hello_dev->dev_num);
    class_destroy(hello_dev->class);
    cdev_del(&hello_dev->cdev);
    unregister_chrdev_region(hello_dev->dev_num, 1);
    kfree(hello_dev->buffer);
    kfree(hello_dev);
    
    pr_info("hello: module unloaded\n");
}

module_init(hello_init);
module_exit(hello_exit);
