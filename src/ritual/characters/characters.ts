// The cast. To swap a person: drop an image in public/assets/characters/ and edit this file only.
// Everyone depicted gave consent (2026-09-29). Set `consent: false` to fall back to the
// illustration instantly if anyone changes their mind.

export type CharacterId = 'arno' | 'moise' | 'ceo' | 'priestess';

export interface Character {
  name: string;
  title: string;
  arcana: string;
  /** Path under public/ (relative, so it works under the app's base path). */
  image: string;
  consent: boolean;
  /** Shown when there is no image (or no consent): a big glyph over the card's gradient. */
  glyph: string;
  hue: 'teal' | 'blood' | 'gold' | 'violet';
}

export const CHARACTERS: Record<CharacterId, Character> = {
  arno: {
    name: 'Arno',
    title: 'The Architect',
    arcana: 'I',
    image: 'assets/characters/arno.webp',
    consent: true,
    glyph: '📐',
    hue: 'teal',
  },
  moise: {
    name: 'Moïse',
    title: 'The Forbidden Engineer',
    arcana: 'XIII',
    image: 'assets/characters/moise.webp',
    consent: true,
    glyph: '🔌',
    hue: 'violet',
  },
  ceo: {
    name: 'The CEO',
    title: 'The Emperor of OKRs',
    arcana: 'IV',
    image: 'assets/characters/ceo.webp',
    consent: true,
    glyph: '👔',
    hue: 'gold',
  },
  priestess: {
    name: 'The High Priestess',
    title: 'of Telemetry',
    arcana: 'II',
    image: 'assets/characters/priestess.webp',
    consent: true,
    glyph: '✨',
    hue: 'teal',
  },
};
