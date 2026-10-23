export type DemoPlayer = {
  id: string; nome: string; apelido: string; categoria: 'Mensalista' | 'Diarista';
  ativo: boolean; pago: boolean; presente: boolean; colete: boolean; valor: number;
};
export type DemoInvite = { id: string; nome: string; categoria: DemoPlayer['categoria']; expira: number; status: 'Aberto' | 'Utilizado' | 'Cancelado' };
export type DemoData = { version: 1; players: DemoPlayer[]; invites: DemoInvite[]; queue: string[]; expenses: { id: string; descricao: string; valor: number }[] };
export const DEMO_KEY = 'resenhacampo5-demo-v1';
export function initialDemo(): DemoData {
  const names = [['Ricardo (exemplo)', 'Ricardo'], ['Bruno Santos', 'Bruninho'], ['Carlos Eduardo', 'Cadu'], ['Felipe Costa', 'Felipinho'], ['Marcelo Souza', 'Marcelão'], ['Pedro Lima', 'Pedrinho']];
  return { version: 1, players: names.map(([nome, apelido], i) => ({ id: `demo-${i}`, nome, apelido, categoria: i === 3 || i === 5 ? 'Diarista' : 'Mensalista', ativo: i !== 5, pago: ![2, 5].includes(i), presente: [0, 1].includes(i), colete: i === 3, valor: i === 3 ? 20 : i === 5 ? 15 : 30 })), invites: [], queue: ['demo-0', 'demo-1'], expenses: [] };
}
export function loadDemo(): DemoData {
  try {
    const data = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null');
    if (data?.version === 1 && Array.isArray(data.players) && data.players.every((p: DemoPlayer) => typeof p.id === 'string' && typeof p.nome === 'string' && typeof p.apelido === 'string' && ['Mensalista', 'Diarista'].includes(p.categoria) && ['ativo', 'pago', 'presente', 'colete'].every(key => typeof p[key as keyof DemoPlayer] === 'boolean') && typeof p.valor === 'number' && Number.isFinite(p.valor) && p.valor >= 0) && Array.isArray(data.invites) && data.invites.every((i: DemoInvite) => typeof i.id === 'string' && typeof i.nome === 'string' && ['Mensalista', 'Diarista'].includes(i.categoria) && ['Aberto', 'Utilizado', 'Cancelado'].includes(i.status) && Number.isFinite(i.expira)) && Array.isArray(data.queue) && data.queue.every((id: string) => typeof id === 'string') && Array.isArray(data.expenses) && data.expenses.every((e: { id: string; descricao: string; valor: number }) => typeof e.id === 'string' && typeof e.descricao === 'string' && typeof e.valor === 'number' && Number.isFinite(e.valor) && e.valor > 0)) return data;
  } catch { /* Armazenamento indisponível ou versão inválida: inicia exemplos. */ }
  return initialDemo();
}
export function canJoin(player: DemoPlayer, generalEntry: boolean) {
  return player.ativo && player.pago && (generalEntry || player.categoria === 'Mensalista');
}
export function demoTotals(data: DemoData) {
  const recebido = data.players.filter(p => p.pago).reduce((s, p) => s + p.valor, 0);
  const despesas = data.expenses.reduce((s, e) => s + e.valor, 0);
  return { recebido, despesas, saldo: recebido - despesas, aberto: data.players.filter(p => !p.pago).reduce((s, p) => s + p.valor, 0) };
}
