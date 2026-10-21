export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

export function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(digits[10])) return false;

  return true;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

export function statusAsaasLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    received: 'Recebido',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
    refunded: 'Estornado',
  };
  return labels[status] || status;
}

export function statusAsaasColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    received: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-200 text-gray-600',
    refunded: 'bg-purple-100 text-purple-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

export function categoriaLabel(categoria: string): string {
  const labels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    mensalista: 'Mensalista',
    diarista: 'Diarista',
  };
  return labels[categoria] || categoria;
}

export function categoriaColor(categoria: string): string {
  const colors: Record<string, string> = {
    owner: 'bg-emerald-100 text-emerald-700',
    admin: 'bg-blue-100 text-blue-700',
    mensalista: 'bg-teal-100 text-teal-700',
    diarista: 'bg-slate-100 text-slate-600',
  };
  return colors[categoria] || 'bg-gray-100 text-gray-600';
}

export function situacaoLabel(situacao: string): string {
  const labels: Record<string, string> = {
    ativo: 'Ativo',
    suspenso: 'Suspenso',
    removido: 'Removido',
  };
  return labels[situacao] || situacao;
}

export function situacaoColor(situacao: string): string {
  const colors: Record<string, string> = {
    ativo: 'bg-green-100 text-green-700',
    suspenso: 'bg-amber-100 text-amber-700',
    removido: 'bg-red-100 text-red-700',
  };
  return colors[situacao] || 'bg-gray-100 text-gray-600';
}

export function diaSemanaLabel(dia: string): string {
  const labels: Record<string, string> = {
    domingo: 'Domingo',
    segunda: 'Segunda',
    terca: 'Terça',
    quarta: 'Quarta',
    quinta: 'Quinta',
    sexta: 'Sexta',
    sabado: 'Sábado',
  };
  return labels[dia] || dia;
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
