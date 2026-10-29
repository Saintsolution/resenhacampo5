import { useEffect, useRef, useState } from 'react';
import MatchBoard from './MatchBoard';
import type { MatchParticipant } from '../lib/n8n/owner';
import { ownerRequest } from '../lib/n8n/owner';
import { nextGameDate, formatGameDate } from '../lib/matchDate';
import type { PeladaSetup } from '../lib/n8n/bootstrap';
import { ArrowUpRight, CalendarDays, Menu, Pause, Play, RotateCcw, ShieldCheck, Users, Volume2, VolumeX, X } from 'lucide-react';

export default function Landing({ onLogin, onDemo, onOpenClub }: { onLogin: () => void; onDemo: () => void; onOpenClub: (id: string) => void }) {
  type PublicClub = Pick<PeladaSetup, 'nome' | 'local' | 'dia_semana' | 'horario_inicio' | 'horario_fim'> & { id: string; proxima_partida?: { data: string; participantes: MatchParticipant[] } };
  const [openedClub,setOpenedClub] = useState<string | null>(null);
  const [clubs, setClubs] = useState<PublicClub[]>([]);
  const [agendaError, setAgendaError] = useState('');
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  useEffect(() => {
    let active=true, fetching=false;
    async function refresh(){if(fetching)return;fetching=true;try{const r=await ownerRequest<{peladas:PublicClub[]}>('peladas-publicas');if(!Array.isArray(r.peladas))throw new Error('agenda');if(active){const now=new Date();setClubs([...r.peladas].sort((a,b)=>(nextGameDate(a,now)+'T'+a.horario_inicio).localeCompare(nextGameDate(b,now)+'T'+b.horario_inicio)||a.nome.localeCompare(b.nome,'pt-BR')));setAgendaError('');}}catch{if(active)setAgendaError('Não foi possível atualizar a agenda. A lista pode estar desatualizada.');}finally{fetching=false;if(active)setLoadingAgenda(false);}}
    void refresh();const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh();},30000);
    return()=>{active=false;window.clearInterval(timer);};
  }, []);

  const video = useRef<HTMLVideoElement>(null);
  const [menu, setMenu] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [borderColor, setBorderColor] = useState('#3c4a2d');
  function matchVideoBorders() {
    const element = video.current;
    if (!element?.videoWidth || !element.videoHeight) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 4; canvas.height = 1;
      const context = canvas.getContext('2d');
      if (!context) return;
      const { videoWidth: width, videoHeight: height } = element;
      [[2,2],[width-3,2],[2,height-3],[width-3,height-3]].forEach(([x,y],index) => {
        context.drawImage(element,x,y,1,1,index,0,1,1);
      });
      const pixels = context.getImageData(0,0,4,1).data;
      const channels = [0,1,2].map(channel => Math.round((pixels[channel]+pixels[channel+4]+pixels[channel+8]+pixels[channel+12])/4));
      setBorderColor(`rgb(${channels.join(',')})`);
    } catch { /* Mantém o musgo enquanto a leitura do vídeo não estiver disponível. */ }
  }
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = async () => {
      if (!media.matches) { try { if(video.current) video.current.currentTime = 0; await video.current?.play(); } catch { /* O botão permite iniciar quando autoplay for bloqueado. */ } }
    };
    void start();
    const reduce = () => { if(media.matches) video.current?.pause(); };
    media.addEventListener('change', reduce);
    return () => media.removeEventListener('change', reduce);
  }, []);
  async function toggle() {
    const element=video.current; if(!element)return;
    if(element.paused) {if(ended)element.currentTime=0;try{await element.play();setEnded(false);}catch{setFailed(true);}}
    else element.pause();
  }
  function browse() { setMenu(false); document.getElementById('peladas-proximas')?.scrollIntoView({ behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start' }); }
  return <div className="welcome-page">
    <header className="welcome-header"><a className="welcome-wordmark" href="#/" aria-label="Página inicial">RESENHA<span>FUTEBOL ENTRE AMIGOS</span></a><button className="icon-button welcome-menu" onClick={()=>setMenu(v=>!v)} aria-label={menu?'Fechar menu':'Abrir menu'} aria-expanded={menu} aria-controls="welcome-navigation">{menu?<X/>:<Menu/>}</button><nav id="welcome-navigation" className={menu?'is-open':''} aria-label="Navegação inicial"><button onClick={onLogin}>Entrar na minha pelada</button><button onClick={browse}>Peladas próximas</button></nav></header>
    <section className="welcome-hero" style={{ backgroundColor:borderColor }} aria-label="Vinheta de abertura Resenha">
      {!failed && <video ref={video} src="/vinheta%20inicio.mp4" muted={muted} playsInline preload="auto" style={{ backgroundColor:borderColor }} onLoadedData={matchVideoBorders} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>{matchVideoBorders();setEnded(true);setPlaying(false);}} onError={()=>{setFailed(true);setPlaying(false);}} aria-label="Vinheta de abertura da Resenha"/>}
      {failed && <div className="welcome-video-fallback welcome-video-unavailable" role="status">Resenha · futebol entre amigos</div>}
      {!failed && <div className="welcome-video-controls"><button onClick={toggle} aria-label={ended?'Repetir vinheta':playing?'Pausar vinheta':'Reproduzir vinheta'}>{ended?<RotateCcw size={16}/>:playing?<Pause size={16}/>:<Play size={16}/>}<span>{ended?'Ver novamente':playing?'Pausar':'Reproduzir'}</span></button><button onClick={()=>setMuted(v=>!v)} aria-label={muted?'Ativar som':'Silenciar'}>{muted?<VolumeX size={17}/>:<Volume2 size={17}/>}</button></div>}
    </section>
    <main className="welcome-content"><section className="welcome-intro"><div><div className="eyebrow">MENOS ORGANIZAÇÃO NO GRUPO. MAIS BOLA EM CAMPO.</div><h1>A turma se encontra.<br/>O jogo acontece.</h1></div><div><p>Um lugar para reunir os jogadores, combinar a próxima partida e deixar a resenha em dia. Do primeiro convite ao apito final, cada um sabe onde entrar.</p><div className="welcome-actions"><button className="button primary" onClick={onLogin}>Entrar na minha pelada<ArrowUpRight size={17}/></button></div></div></section>
      <section className="welcome-features" aria-label="Como funciona"><article><Users size={23}/><h2>Junte sua turma</h2><p>Crie a pelada e convide mensalistas e diaristas para participar.</p></article><article><CalendarDays size={23}/><h2>Deixe o jogo combinado</h2><p>Local, horário, presença e fila reunidos para o dia da partida.</p></article><article><ShieldCheck size={23}/><h2>Divida a organização</h2><p>O dono pode convidar administradores e definir o que cada um pode fazer.</p></article></section>
      <section id="peladas-proximas" className="welcome-peladas"><div className="welcome-section-heading"><div><div className="eyebrow">BORA JOGAR?</div><h2>Peladas próximas</h2></div><span>Seu próximo encontro começa aqui.</span></div><div className="welcome-agenda">{loadingAgenda ? <p role="status">Consultando próximas peladas…</p> : agendaError && !clubs.length ? <p role="status">{agendaError}</p> : !clubs.length ? <p>Nenhuma pelada disponível no momento.</p> : clubs.map(club => <article className="entry-explanation" key={club.id}><button className="text-button" aria-expanded={openedClub === club.id} onClick={() => setOpenedClub(openedClub === club.id ? null : club.id)}><h3>{club.nome}</h3></button><span>{formatGameDate(nextGameDate(club))}<br/>{club.horario_inicio} às {club.horario_fim}<br/>{club.local}</span><button className="button primary" onClick={() => setOpenedClub(openedClub === club.id ? null : club.id)}>Abrir quadro da pelada<ArrowUpRight size={16}/></button>{openedClub === club.id && <MatchBoard name={club.nome} local={club.local} date={club.proxima_partida?.data || nextGameDate(club)} start={club.horario_inicio} end={club.horario_fim} participants={club.proxima_partida?.participantes}/>}<button className="text-button" onClick={() => onOpenClub(club.id)}>Entrar na minha área</button></article>)}</div></section>
      <footer className="welcome-footer"><span>Futebol entre amigos. Organização para todo mundo.</span><button className="text-button" onClick={onDemo}>Conhecer a demonstração</button></footer>
    </main>
  </div>;
}
