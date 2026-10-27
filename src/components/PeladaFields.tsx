import type { PeladaSetup } from '../lib/n8n/bootstrap';

export default function PeladaFields({value,onField,disabled}:{value:PeladaSetup;onField:(key:keyof PeladaSetup,value:string)=>void;disabled:boolean}) {
 return <>
        <fieldset disabled={disabled}><legend>Local e horário</legend>
          {(['nome','local','cidade'] as const).map(key=><label key={key}>{key==='nome'?'Nome da pelada':key==='local'?'Local':'Cidade'}<input required maxLength={150} value={value[key]} onChange={e=>onField(key,e.target.value)}/></label>)}
          <label>Dia da semana<select required value={value.dia_semana < 0 ? '' : value.dia_semana} onChange={e=>onField('dia_semana',e.target.value)}><option value="" disabled>Selecione</option>{['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'].map((day,i)=><option key={day} value={i}>{day}</option>)}</select></label>
          <div className="setup-grid"><label>Horário inicial<input required type="time" value={value.horario_inicio} onChange={e=>onField('horario_inicio',e.target.value)}/></label><label>Horário final<input required type="time" value={value.horario_fim} onChange={e=>onField('horario_fim',e.target.value)}/></label></div>
        </fieldset>
        <fieldset disabled={disabled}><legend>Valores e regras</legend><div className="setup-grid">
          {([['mensalidade','Mensalidade'],['diaria_sem_colete','Diária sem colete'],['diaria_com_colete','Diária com colete'],['colete_avulso','Colete avulso']] as const).map(([key,label])=><label key={key}>{label} (R$)<input required type="number" min="0" max="100000" step="0.01" value={Number.isFinite(value[key])?value[key]:''} onChange={e=>onField(key,e.target.value)}/></label>)}
          <label>Dia do vencimento<input required type="number" min="1" max="28" step="1" value={Number.isFinite(value.vencimento_mensal)?value.vencimento_mensal:''} onChange={e=>onField('vencimento_mensal',e.target.value)}/></label><label>Validade do convite (horas)<input required type="number" min="1" max="720" step="1" value={Number.isFinite(value.validade_convite_horas)?value.validade_convite_horas:''} onChange={e=>onField('validade_convite_horas',e.target.value)}/></label>
        </div></fieldset>
 </>;
}
