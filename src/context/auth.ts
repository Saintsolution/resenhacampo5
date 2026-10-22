import { createContext, useContext } from 'react';
import type { Organizador, Participante, Pelada } from '@/types/domain';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthContextType {
  // Sem identidade ou sessão simuladas: autenticação depende dos contratos n8n.
  session: null;
  user: AuthUser | null;
  organizador: Organizador | null;
  participanteAtivo: Participante | null;
  peladaAtiva: Pelada | null;
  participantes: Participante[];
  peladas: Pelada[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, nome: string, telefone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  selecionarPelada: (peladaId: string) => void;
  refreshOrganizador: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
