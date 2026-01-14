/**
 * PaymentForm - Componente de Pagamento com Stripe
 * 
 * Para usar em produção:
 * 1. npm install @stripe/stripe-js @stripe/react-stripe-js
 * 2. Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 * 3. Configure STRIPE_SECRET_KEY no backend
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  description: string;
  appointmentId?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface CardData {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export function PaymentForm({
  amount,
  description,
  appointmentId,
  onSuccess,
  onError,
  onCancel
}: PaymentFormProps) {
  const [cardData, setCardData] = useState<CardData>({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Formatar número do cartão
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  // Formatar data de expiração
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Detectar bandeira do cartão
  const getCardBrand = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    return 'unknown';
  };

  const handleChange = (field: keyof CardData, value: string) => {
    let formattedValue = value;
    
    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvc') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }
    
    setCardData(prev => ({ ...prev, [field]: formattedValue }));
    setError(null);
  };

  const validateCard = (): boolean => {
    const { number, expiry, cvc, name } = cardData;
    
    if (!name.trim()) {
      setError('Nome do titular é obrigatório');
      return false;
    }
    
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      setError('Número do cartão inválido');
      return false;
    }
    
    const [month, year] = expiry.split('/');
    if (!month || !year || parseInt(month) > 12 || parseInt(month) < 1) {
      setError('Data de expiração inválida');
      return false;
    }
    
    if (cvc.length < 3) {
      setError('CVV inválido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCard()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulação de pagamento (em produção, usar Stripe)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular sucesso 90% das vezes
      if (Math.random() > 0.1) {
        const paymentId = `pay_${Date.now()}`;
        setSuccess(true);
        onSuccess?.(paymentId);
      } else {
        throw new Error('Pagamento recusado. Verifique os dados do cartão.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar pagamento';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Pagamento Confirmado!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Seu pagamento de {formatCurrency(amount)} foi processado com sucesso.
        </p>
        <p className="text-sm text-gray-500">
          Um recibo foi enviado para seu email.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-5 h-5" />
          <span className="text-sm font-medium">Pagamento Seguro</span>
        </div>
        <h3 className="text-2xl font-bold">{formatCurrency(amount)}</h3>
        <p className="text-blue-100 text-sm mt-1">{description}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Nome do Titular */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome do Titular
          </label>
          <input
            type="text"
            value={cardData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Como está no cartão"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Número do Cartão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número do Cartão
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardData.number}
              onChange={(e) => handleChange('number', e.target.value)}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {cardData.number && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium uppercase text-gray-500">
                {getCardBrand(cardData.number)}
              </span>
            )}
          </div>
        </div>

        {/* Expiração e CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Validade
            </label>
            <input
              type="text"
              value={cardData.expiry}
              onChange={(e) => handleChange('expiry', e.target.value)}
              placeholder="MM/AA"
              maxLength={5}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CVV
            </label>
            <input
              type="text"
              value={cardData.cvc}
              onChange={(e) => handleChange('cvc', e.target.value)}
              placeholder="123"
              maxLength={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
        </div>

        {/* Erro */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                       text-gray-700 dark:text-gray-300 font-medium
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                       disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 transition-colors disabled:opacity-50
                     flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Pagar {formatCurrency(amount)}
              </>
            )}
          </button>
        </div>

        {/* Segurança */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          🔒 Seus dados são criptografados e protegidos
        </p>
      </form>
    </motion.div>
  );
}

// Componente de Histórico de Pagamentos
interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  description: string;
  date: string;
  method?: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
  onRefund?: (paymentId: string) => void;
}

export function PaymentHistory({ payments, onRefund }: PaymentHistoryProps) {
  const getStatusBadge = (status: Payment['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    const labels = {
      pending: 'Pendente',
      paid: 'Pago',
      refunded: 'Reembolsado',
      failed: 'Falhou'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum pagamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {payment.description}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(payment.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(payment.amount)}
              </p>
              {getStatusBadge(payment.status)}
            </div>
            {payment.status === 'paid' && onRefund && (
              <button
                onClick={() => onRefund(payment.id)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Reembolsar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper para formatar moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
}

export default PaymentForm;
