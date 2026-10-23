import { ArrowLeft } from 'lucide-react';

export default function BackButton({ onClick, disabled = false, label = 'Voltar ao início' }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return <button type="button" className="back-button" onClick={onClick} disabled={disabled}><ArrowLeft size={17} aria-hidden="true"/>{label}</button>;
}
