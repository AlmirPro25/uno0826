/**
 * Testes de Utilitários
 */

describe('Validações', () => {
  // Validação de Email
  describe('validateEmail', () => {
    const validateEmail = (email: string): boolean => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    it('deve aceitar email válido', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.com.br')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
      expect(validateEmail('noat.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  // Validação de Senha
  describe('validatePassword', () => {
    const validatePassword = (password: string): boolean => {
      return password.length >= 8;
    };

    it('deve aceitar senha válida', () => {
      expect(validatePassword('password123')).toBe(true);
      expect(validatePassword('12345678')).toBe(true);
      expect(validatePassword('senhaSegura!')).toBe(true);
    });

    it('deve rejeitar senha curta', () => {
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('1234567')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  // Validação de CPF
  describe('validateCPF', () => {
    const validateCPF = (cpf: string): boolean => {
      const cleaned = cpf.replace(/\D/g, '');
      if (cleaned.length !== 11) return false;
      if (/^(\d)\1+$/.test(cleaned)) return false;
      return true; // Simplificado para teste
    };

    it('deve aceitar CPF válido', () => {
      expect(validateCPF('123.456.789-09')).toBe(true);
      expect(validateCPF('12345678909')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('123')).toBe(false);
      expect(validateCPF('')).toBe(false);
    });
  });

  // Validação de Telefone
  describe('validatePhone', () => {
    const validatePhone = (phone: string): boolean => {
      const cleaned = phone.replace(/\D/g, '');
      return cleaned.length >= 10 && cleaned.length <= 11;
    };

    it('deve aceitar telefone válido', () => {
      expect(validatePhone('(11) 99999-9999')).toBe(true);
      expect(validatePhone('11999999999')).toBe(true);
      expect(validatePhone('(11) 3333-3333')).toBe(true);
    });

    it('deve rejeitar telefone inválido', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });
});

describe('Formatação', () => {
  // Formatação de Data
  describe('formatDate', () => {
    const formatDate = (date: Date | string): string => {
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR');
    };

    it('deve formatar data corretamente', () => {
      expect(formatDate('2024-12-15')).toBe('15/12/2024');
      expect(formatDate(new Date(2024, 11, 15))).toBe('15/12/2024');
    });
  });

  // Formatação de Moeda
  describe('formatCurrency', () => {
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    it('deve formatar moeda corretamente', () => {
      expect(formatCurrency(150)).toBe('R$ 150,00');
      expect(formatCurrency(1500.5)).toBe('R$ 1.500,50');
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });
  });

  // Formatação de CPF
  describe('formatCPF', () => {
    const formatCPF = (cpf: string): string => {
      const cleaned = cpf.replace(/\D/g, '');
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    it('deve formatar CPF corretamente', () => {
      expect(formatCPF('12345678909')).toBe('123.456.789-09');
    });
  });

  // Formatação de Telefone
  describe('formatPhone', () => {
    const formatPhone = (phone: string): string => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    };

    it('deve formatar telefone celular', () => {
      expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
    });

    it('deve formatar telefone fixo', () => {
      expect(formatPhone('1133333333')).toBe('(11) 3333-3333');
    });
  });
});

describe('Utilitários', () => {
  // Debounce
  describe('debounce', () => {
    jest.useFakeTimers();

    const debounce = <T extends (...args: unknown[]) => unknown>(
      fn: T,
      delay: number
    ) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };

    it('deve atrasar execução', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  // Truncate
  describe('truncate', () => {
    const truncate = (str: string, length: number): string => {
      if (str.length <= length) return str;
      return str.slice(0, length) + '...';
    };

    it('deve truncar texto longo', () => {
      expect(truncate('Texto muito longo', 10)).toBe('Texto muit...');
    });

    it('não deve truncar texto curto', () => {
      expect(truncate('Curto', 10)).toBe('Curto');
    });
  });

  // Capitalize
  describe('capitalize', () => {
    const capitalize = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    it('deve capitalizar primeira letra', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('hELLO')).toBe('Hello');
    });
  });

  // Slug
  describe('slugify', () => {
    const slugify = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    it('deve criar slug válido', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Olá Mundo!')).toBe('ola-mundo');
      expect(slugify('Test 123')).toBe('test-123');
    });
  });
});

describe('Cálculos', () => {
  // Calcular idade
  describe('calculateAge', () => {
    const calculateAge = (birthDate: Date): number => {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    it('deve calcular idade corretamente', () => {
      const birthDate = new Date(1990, 0, 1); // 1 Jan 1990
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(34);
    });
  });

  // Calcular porcentagem
  describe('calculatePercentage', () => {
    const calculatePercentage = (value: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((value / total) * 100);
    };

    it('deve calcular porcentagem', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(0, 100)).toBe(0);
      expect(calculatePercentage(100, 0)).toBe(0);
    });
  });
});

describe('Status de Consulta', () => {
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      scheduled: 'Agendada',
      confirmed: 'Confirmada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
      no_show: 'Não compareceu'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      scheduled: 'blue',
      confirmed: 'green',
      completed: 'gray',
      cancelled: 'red',
      no_show: 'orange'
    };
    return colors[status] || 'gray';
  };

  it('deve retornar label correto', () => {
    expect(getStatusLabel('scheduled')).toBe('Agendada');
    expect(getStatusLabel('completed')).toBe('Concluída');
    expect(getStatusLabel('unknown')).toBe('unknown');
  });

  it('deve retornar cor correta', () => {
    expect(getStatusColor('scheduled')).toBe('blue');
    expect(getStatusColor('cancelled')).toBe('red');
    expect(getStatusColor('unknown')).toBe('gray');
  });
});
