// The cast. To swap a person: drop an image in public/assets/characters/ and edit this file only.
// Images are processed into tarot faces (560×640, the card-face aspect) — see docs §10.
// Everyone depicted gave consent (2026-09-29). Set `consent: false` to fall back to the
// illustration instantly if anyone changes their mind.

import type { CostumeKind } from './Costume';

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
  /** Ritual costume drawn over the portrait. */
  costume: CostumeKind;
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
    costume: 'architect',
  },
  moise: {
    name: 'Moïse',
    title: 'The Forbidden Engineer',
    arcana: 'XIII',
    image: 'assets/characters/moise.webp',
    consent: true,
    glyph: '🔌',
    hue: 'violet',
    costume: 'engineer',
  },
  ceo: {
    name: 'The CEO',
    title: 'The Emperor of OKRs',
    arcana: 'IV',
    image: 'assets/characters/ceo.webp',
    consent: true,
    glyph: '👔',
    hue: 'gold',
    costume: 'emperor',
  },
  priestess: {
    name: 'The High Priestess',
    title: 'of Telemetry',
    arcana: 'II',
    image: 'assets/characters/priestess.webp',
    consent: true,
    glyph: '✨',
    hue: 'teal',
    costume: 'priestess',
  },
};
