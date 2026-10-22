import type { ReactNode } from 'react';
import { AuthContext, type AuthContextType } from './auth';

const unavailable = async () => ({
  error: 'Autenticação indisponível. A integração segura com o n8n ainda não foi configurada.',
});

// Preserva as telas existentes sem implementar login antes da validação criptográfica.
const disconnectedAuth: AuthContextType = {
  session: null,
  user: null,
  organizador: null,
  participanteAtivo: null,
  peladaAtiva: null,
  participantes: [],
  peladas: [],
  loading: false,
  signIn: unavailable,
  signUp: unavailable,
  signOut: async () => {},
  selecionarPelada: () => {},
  refreshOrganizador: async () => {},
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={disconnectedAuth}>{children}</AuthContext.Provider>;
}
