import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Organizador, Participante, Pelada } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [organizador, setOrganizador] = useState<Organizador | null>(null);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [participanteAtivo, setParticipanteAtivo] = useState<Participante | null>(null);
  const [peladaAtiva, setPeladaAtiva] = useState<Pelada | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData(userId: string) {
    const [{ data: orgData }, { data: peladasData }] = await Promise.all([
      supabase.from('organizadores').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('peladas')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    setOrganizador(orgData as Organizador | null);
    setPeladas((peladasData as Pelada[]) || []);

    const { data: partsData } = await supabase
      .from('participantes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setParticipantes((partsData as Participante[]) || []);
  }

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadData(newSession.user.id);
        } else {
          setOrganizador(null);
          setParticipantes([]);
          setPeladas([]);
          setParticipanteAtivo(null);
          setPeladaAtiva(null);
        }
        setLoading(false);
      })();
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string, nome: string, telefone: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      await supabase.from('organizadores').insert({
        user_id: data.user.id,
        nome,
        email,
        telefone,
      });
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOrganizador(null);
    setParticipantes([]);
    setPeladas([]);
    setParticipanteAtivo(null);
    setPeladaAtiva(null);
  };

  const selecionarPelada = (peladaId: string) => {
    const pelada = peladas.find((p) => p.id === peladaId);
    const part = participantes.find((p) => p.pelada_id === peladaId);
    setPeladaAtiva(pelada || null);
    setParticipanteAtivo(part || null);
  };

  const refreshOrganizador = async () => {
    if (!user) return;
    await loadData(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        organizador,
        participanteAtivo,
        peladaAtiva,
        participantes,
        peladas,
        loading,
        signIn,
        signUp,
        signOut,
        selecionarPelada,
        refreshOrganizador,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
