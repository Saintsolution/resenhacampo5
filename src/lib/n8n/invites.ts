import { ownerRequest } from './owner';
export type InviteKind = 'ADMIN' | 'MENSALISTA' | 'DIARISTA';
export interface InviteRecord { convite_id: string; apelido: string; tipo: InviteKind; categoria: string; whatsapp: string; convidador_nome: string; emitido_em: string; expira_em: string; data_jogo: string; situacao: string }
export interface InviteResult { convite: InviteRecord; link_disponivel: boolean; link_convite?: string; whatsapp_url?: string }
export interface PublicInvite { apelido: string; tipo: InviteKind; categoria: string; convidador: string; data_jogo: string; expira_em: string; pelada: { nome: string; local: string; hora_inicio: string; hora_fim: string } }
export const kindLabel = (type: InviteKind) => type === 'ADMIN' ? 'Administrador mensalista' : type === 'DIARISTA' ? 'Diarista' : 'Mensalista';
export const listInvites = (token: string) => ownerRequest<{ convites: InviteRecord[] }>('convites', { token, method:'GET' });
export const createInvite = (token:string,body:{apelido:string;whatsapp:string;tipo:InviteKind;data_jogo?:string},requestId:string) => ownerRequest<InviteResult>('convites',{token,body,requestId});
export const validateInvite = (token:string) => ownerRequest<{convite:PublicInvite;cadastro_disponivel:boolean}>('validar-convite',{body:{token}});
