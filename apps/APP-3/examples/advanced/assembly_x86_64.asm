; ============================================================================
; ASSEMBLY x86_64 - EXEMPLOS AVANÇADOS
; ============================================================================
; Compilar: nasm -f elf64 assembly_x86_64.asm -o assembly_x86_64.o
; Linkar:   ld assembly_x86_64.o -o assembly_x86_64
; Ou com C: gcc -c assembly_x86_64.asm && gcc main.c assembly_x86_64.o -o app
; ============================================================================

section .data
    hello_msg db "Hello from Assembly x86_64!", 10, 0
    hello_len equ $ - hello_msg
    
    newline db 10, 0
    hex_chars db "0123456789ABCDEF", 0

section .bss
    buffer resb 256
    result resq 1

section .text
    global _start
    global add_numbers
    global multiply_numbers
    global factorial
    global fibonacci
    global memcpy_fast
    global strlen_fast
    global print_hex

; ============================================================================
; ENTRY POINT (standalone)
; ============================================================================
_start:
    ; Print hello message
    mov rax, 1              ; syscall: write
    mov rdi, 1              ; fd: stdout
    mov rsi, hello_msg      ; buffer
    mov rdx, hello_len      ; length
    syscall
    
    ; Test add_numbers(5, 3)
    mov rdi, 5
    mov rsi, 3
    call add_numbers
    ; rax = 8
    
    ; Test factorial(5)
    mov rdi, 5
    call factorial
    ; rax = 120
    
    ; Exit
    mov rax, 60             ; syscall: exit
    xor rdi, rdi            ; status: 0
    syscall

; ============================================================================
; FUNÇÃO: add_numbers(a, b) -> a + b
; Parâmetros: rdi = a, rsi = b
; Retorno: rax = resultado
; ============================================================================
add_numbers:
    mov rax, rdi
    add rax, rsi
    ret

; ============================================================================
; FUNÇÃO: multiply_numbers(a, b) -> a * b
; Parâmetros: rdi = a, rsi = b
; Retorno: rax = resultado
; ============================================================================
multiply_numbers:
    mov rax, rdi
    imul rax, rsi
    ret

; ============================================================================
; FUNÇÃO: factorial(n) -> n!
; Parâmetros: rdi = n
; Retorno: rax = n!
; Implementação iterativa (mais eficiente que recursiva)
; ============================================================================
factorial:
    mov rax, 1              ; resultado = 1
    cmp rdi, 1              ; se n <= 1
    jle .factorial_done     ; retorna 1
    
.factorial_loop:
    imul rax, rdi           ; resultado *= n
    dec rdi                 ; n--
    cmp rdi, 1              ; enquanto n > 1
    jg .factorial_loop
    
.factorial_done:
    ret

; ============================================================================
; FUNÇÃO: fibonacci(n) -> fib(n)
; Parâmetros: rdi = n
; Retorno: rax = fibonacci(n)
; Implementação iterativa O(n)
; ============================================================================
fibonacci:
    cmp rdi, 0
    je .fib_zero
    cmp rdi, 1
    je .fib_one
    
    mov rcx, rdi            ; contador = n
    xor rax, rax            ; fib(0) = 0
    mov rbx, 1              ; fib(1) = 1
    
.fib_loop:
    mov rdx, rax            ; temp = fib(n-2)
    mov rax, rbx            ; fib(n-2) = fib(n-1)
    add rbx, rdx            ; fib(n-1) = fib(n-2) + temp
    dec rcx
    cmp rcx, 1
    jg .fib_loop
    
    mov rax, rbx            ; retorna fib(n)
    ret
    
.fib_zero:
    xor rax, rax
    ret
    
.fib_one:
    mov rax, 1
    ret

; ============================================================================
; FUNÇÃO: memcpy_fast(dest, src, n)
; Parâmetros: rdi = dest, rsi = src, rdx = n (bytes)
; Retorno: rax = dest
; Cópia otimizada usando REP MOVSB
; ============================================================================
memcpy_fast:
    push rdi                ; salva dest para retorno
    mov rcx, rdx            ; contador = n
    cld                     ; direção: incrementar
    rep movsb               ; copia byte a byte
    pop rax                 ; retorna dest original
    ret

; ============================================================================
; FUNÇÃO: strlen_fast(str) -> length
; Parâmetros: rdi = ponteiro para string
; Retorno: rax = comprimento (sem null terminator)
; ============================================================================
strlen_fast:
    xor rax, rax            ; contador = 0
    
.strlen_loop:
    cmp byte [rdi + rax], 0 ; se str[i] == 0
    je .strlen_done         ; terminou
    inc rax                 ; i++
    jmp .strlen_loop
    
.strlen_done:
    ret

; ============================================================================
; FUNÇÃO: print_hex(value)
; Parâmetros: rdi = valor 64-bit
; Imprime valor em hexadecimal
; ============================================================================
print_hex:
    push rbx
    push r12
    
    mov r12, rdi            ; salva valor
    mov rcx, 16             ; 16 dígitos hex
    
.print_hex_loop:
    rol r12, 4              ; rotaciona 4 bits para esquerda
    mov rax, r12
    and rax, 0xF            ; pega último nibble
    
    lea rbx, [hex_chars]
    mov al, [rbx + rax]     ; converte para char
    
    ; Print char
    push rcx
    mov [buffer], al
    mov rax, 1              ; syscall: write
    mov rdi, 1              ; fd: stdout
    lea rsi, [buffer]
    mov rdx, 1
    syscall
    pop rcx
    
    dec rcx
    jnz .print_hex_loop
    
    ; Print newline
    mov rax, 1
    mov rdi, 1
    mov rsi, newline
    mov rdx, 1
    syscall
    
    pop r12
    pop rbx
    ret

; ============================================================================
; FUNÇÃO: sum_array(arr, n) -> soma
; Parâmetros: rdi = ponteiro para array de int64, rsi = n elementos
; Retorno: rax = soma de todos os elementos
; ============================================================================
global sum_array
sum_array:
    xor rax, rax            ; soma = 0
    test rsi, rsi           ; se n == 0
    jz .sum_done
    
.sum_loop:
    add rax, [rdi]          ; soma += arr[i]
    add rdi, 8              ; próximo elemento (8 bytes)
    dec rsi                 ; n--
    jnz .sum_loop
    
.sum_done:
    ret

; ============================================================================
; FUNÇÃO: find_max(arr, n) -> max
; Parâmetros: rdi = ponteiro para array de int64, rsi = n elementos
; Retorno: rax = maior elemento
; ============================================================================
global find_max
find_max:
    test rsi, rsi
    jz .max_empty
    
    mov rax, [rdi]          ; max = arr[0]
    dec rsi
    jz .max_done
    add rdi, 8
    
.max_loop:
    cmp [rdi], rax          ; se arr[i] > max
    jle .max_skip
    mov rax, [rdi]          ; max = arr[i]
    
.max_skip:
    add rdi, 8
    dec rsi
    jnz .max_loop
    
.max_done:
    ret
    
.max_empty:
    xor rax, rax
    ret

; ============================================================================
; FUNÇÃO: reverse_string(str, len)
; Parâmetros: rdi = ponteiro para string, rsi = comprimento
; Inverte string in-place
; ============================================================================
global reverse_string
reverse_string:
    test rsi, rsi
    jz .reverse_done
    
    lea rdx, [rdi + rsi - 1] ; rdx = ponteiro para último char
    
.reverse_loop:
    cmp rdi, rdx
    jge .reverse_done
    
    ; Swap
    mov al, [rdi]
    mov cl, [rdx]
    mov [rdi], cl
    mov [rdx], al
    
    inc rdi
    dec rdx
    jmp .reverse_loop
    
.reverse_done:
    ret
