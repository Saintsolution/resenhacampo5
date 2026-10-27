import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, Menu, Pause, Play, RotateCcw, ShieldCheck, Users, Volume2, VolumeX, X } from 'lucide-react';

export default function Landing({ onCreate, onLogin, onDemo }: { onCreate: () => void; onLogin: () => void; onDemo: () => void }) {
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
    <header className="welcome-header"><a className="welcome-wordmark" href="#/" aria-label="Página inicial">RESENHA<span>FUTEBOL ENTRE AMIGOS</span></a><button className="icon-button welcome-menu" onClick={()=>setMenu(v=>!v)} aria-label={menu?'Fechar menu':'Abrir menu'} aria-expanded={menu} aria-controls="welcome-navigation">{menu?<X/>:<Menu/>}</button><nav id="welcome-navigation" className={menu?'is-open':''} aria-label="Navegação inicial"><button onClick={onCreate}>Criar pelada</button><button onClick={onLogin}>Entrar na minha pelada</button><button onClick={browse}>Peladas próximas</button></nav></header>
    <section className="welcome-hero" style={{ backgroundColor:borderColor }} aria-label="Vinheta de abertura Resenha">
      {!failed && <video ref={video} src="/vinheta%20inicio.mp4" muted={muted} playsInline preload="auto" style={{ backgroundColor:borderColor }} onLoadedData={matchVideoBorders} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>{matchVideoBorders();setEnded(true);setPlaying(false);}} onError={()=>{setFailed(true);setPlaying(false);}} aria-label="Vinheta de abertura da Resenha"/>}
      {failed && <div className="welcome-video-fallback welcome-video-unavailable" role="status">Resenha · futebol entre amigos</div>}
      {!failed && <div className="welcome-video-controls"><button onClick={toggle} aria-label={ended?'Repetir vinheta':playing?'Pausar vinheta':'Reproduzir vinheta'}>{ended?<RotateCcw size={16}/>:playing?<Pause size={16}/>:<Play size={16}/>}<span>{ended?'Ver novamente':playing?'Pausar':'Reproduzir'}</span></button><button onClick={()=>setMuted(v=>!v)} aria-label={muted?'Ativar som':'Silenciar'}>{muted?<VolumeX size={17}/>:<Volume2 size={17}/>}</button></div>}
    </section>
    <main className="welcome-content"><section className="welcome-intro"><div><div className="eyebrow">MENOS ORGANIZAÇÃO NO GRUPO. MAIS BOLA EM CAMPO.</div><h1>A turma se encontra.<br/>O jogo acontece.</h1></div><div><p>Um lugar para reunir os jogadores, combinar a próxima partida e deixar a resenha em dia. Do primeiro convite ao apito final, cada um sabe onde entrar.</p><div className="welcome-actions"><button className="button primary" onClick={onCreate}>Criar minha pelada<ArrowUpRight size={17}/></button><button className="button light" onClick={onLogin}>Entrar na minha pelada<ArrowUpRight size={17}/></button></div></div></section>
      <section className="welcome-features" aria-label="Como funciona"><article><Users size={23}/><h2>Junte sua turma</h2><p>Crie a pelada e convide mensalistas e diaristas para participar.</p></article><article><CalendarDays size={23}/><h2>Deixe o jogo combinado</h2><p>Local, horário, presença e fila reunidos para o dia da partida.</p></article><article><ShieldCheck size={23}/><h2>Divida a organização</h2><p>O dono pode convidar administradores e definir o que cada um pode fazer.</p></article></section>
      <section id="peladas-proximas" className="welcome-peladas"><div className="welcome-section-heading"><div><div className="eyebrow">BORA JOGAR?</div><h2>Peladas próximas</h2></div><span>Seu próximo encontro começa aqui.</span></div><div className="welcome-empty"><CalendarDays size={30}/><h3>Espaço para a primeira resenha</h3><p>As peladas cadastradas aparecerão nesta seção, com local e horário para você encontrar sua turma.</p><small>A consulta de peladas ainda será conectada. Nenhuma pelada demonstrativa é exibida nesta lista.</small><button className="button primary" onClick={onCreate}>Começar minha pelada<ArrowUpRight size={16}/></button></div></section>
      <footer className="welcome-footer"><span>Futebol entre amigos. Organização para todo mundo.</span><button className="text-button" onClick={onDemo}>Conhecer a demonstração</button></footer>
    </main>
  </div>;
}
