import { useState, type ReactNode } from 'react';
import type { Character } from './characters';
import './tarot.css';

interface TarotCardProps {
  arcana: string;
  title: string;
  subtitle?: string;
  image?: string;
  consent?: boolean;
  glyph: string;
  hue: Character['hue'];
  /** Extra art rendered over the card face (e.g. a leaking crate). */
  children?: ReactNode;
  size?: 'md' | 'lg';
}

export function TarotCard({ arcana, title, subtitle, image, consent = true, glyph, hue, children, size = 'md' }: TarotCardProps) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(image) && consent && !broken;
  return (
    <figure className={`tarot tarot--${hue} tarot--${size}`}>
      <svg className="tarot__frame" viewBox="0 0 200 300" preserveAspectRatio="none" aria-hidden="true">
        <rect x="4" y="4" width="192" height="292" rx="10" />
        <rect x="11" y="11" width="178" height="278" rx="6" className="tarot__frame-inner" />
        <path d="M100 11 l 8 8 l -8 8 l -8 -8 Z M100 289 l 8 -8 l -8 -8 l -8 8 Z" className="tarot__jewel" />
        <path d="M11 40 Q 30 30 30 11 M189 40 Q 170 30 170 11 M11 260 Q 30 270 30 289 M189 260 Q 170 270 170 289" className="tarot__vine" />
      </svg>
      <div className="tarot__numeral">{arcana}</div>
      <div className="tarot__face">
        {showImage ? (
          <img src={image} alt="" className="tarot__img" onError={() => setBroken(true)} draggable={false} />
        ) : (
          <span className="tarot__glyph" aria-hidden="true">{glyph}</span>
        )}
        {children}
      </div>
      <figcaption className="tarot__banner">
        <span className="tarot__title">{title}</span>
        {subtitle && <span className="tarot__subtitle">{subtitle}</span>}
      </figcaption>
    </figure>
  );
}

export function CharacterCard({ character, size }: { character: Character; size?: 'md' | 'lg' }) {
  return (
    <TarotCard
      arcana={character.arcana}
      title={character.name}
      subtitle={character.title}
      image={character.image}
      consent={character.consent}
      glyph={character.glyph}
      hue={character.hue}
      size={size}
    />
  );
}
