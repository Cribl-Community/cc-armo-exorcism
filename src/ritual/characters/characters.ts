// The cast. To swap a person: drop an image in public/assets/characters/ and edit this file only.
// Card faces are 560×640 (the card-face aspect). Arno and Moïse are illustrated wizards with
// transparent backgrounds; the CEO and Priestess are processed photos (tools/tarotize.py) with a
// drawn costume layer — see docs §10.
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
  /** Ritual costume drawn over the portrait. Omit for images that are already illustrated. */
  costume?: CostumeKind;
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
    // Illustrated wizard portrait (2026-09-30): it brings its own costume and magic.
  },
  moise: {
    name: 'Moïse',
    title: 'The Forbidden Engineer',
    arcana: 'XIII',
    image: 'assets/characters/moise.webp',
    consent: true,
    glyph: '🔌',
    hue: 'violet',
    // Illustrated wizard portrait (2026-09-30): it brings its own costume and magic.
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
