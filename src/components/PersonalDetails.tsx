import { useState, type FormEvent } from 'react';
import { ownerRequest, type PersonalProfile } from '../lib/n8n/owner';

export default function PersonalDetails({ profile, token, onSaved }: { profile: PersonalProfile; token: string; onSaved: (profile: PersonalProfile) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const values = new FormData(event.currentTarget);
    const body = { apelido: String(values.get('apelido') || ''), telefone: profile.contato_editavel ? String(values.get('telefone') || '') : profile.telefone, email: profile.contato_editavel ? String(values.get('email') || '') : profile.email };
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await ownerRequest<{ meu_cadastro: PersonalProfile }>('meu-cadastro', { token, body });
      if (!result.meu_cadastro || result.meu_cadastro.cpf !== profile.cpf) throw new Error('A atualização não foi confirmada. Consulte seu cadastro antes de repetir.');
      onSaved(result.meu_cadastro); setMessage('Cadastro atualizado.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível atualizar.'); }
    finally { setBusy(false); }
  }
  return <form className="owner-form" onSubmit={save}>
    <h2>Meu cadastro</h2>
    <label>Nome completo<input value={profile.nome} readOnly/></label>
    <label>CPF<input value={profile.cpf} readOnly/></label>
    <label>Apelido<input name="apelido" required maxLength={40} defaultValue={profile.apelido} disabled={busy}/></label>
    <label>Telefone / WhatsApp<input name="telefone" type="tel" required maxLength={20} defaultValue={profile.telefone} readOnly={!profile.contato_editavel} disabled={busy}/></label>
    <label>E-mail<input name="email" type="email" required maxLength={254} defaultValue={profile.email} readOnly={!profile.contato_editavel} disabled={busy}/></label>
    {!profile.contato_editavel && <small>Telefone e e-mail vinculados ao Asaas: somente consulta nesta etapa.</small>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <button className="button primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button>
  </form>;
}
