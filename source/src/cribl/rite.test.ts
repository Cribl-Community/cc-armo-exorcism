import { describe, expect, it } from 'vitest';
import { DEMON_COUNT, TITHE_RATE, deriveRite, emulateRite, goatifyEvents, summonDemons } from './rite';
import type { Json } from './client';

// Input and output of a real /m/default/preview run on a Cribl.Cloud trial tenant (probe pass 2,
// 2026-09-30), with the `rite` tag the combined pipeline uses added to both sides.
const ENGINE_INPUT: Json[] = [
  { rite: 'exorcism', _raw: 'host=altar-01 user=ceo action=login status=FAILED password=hunter2 curse=666', species: 'human', heresy_level: 42, level: 'info', curse: '666', demonic_payload: "Ph'nglui mglw'nafh Cribl", sourcetype: 'syslog' },
  { rite: 'exorcism', _raw: 'host=altar-02 user=arno action=deploy status=OK token=abc123 curse=666', species: 'human', heresy_level: 7, level: 'info', curse: '666', demonic_payload: 'the pipeline hungers', sourcetype: 'syslog' },
  { rite: 'exorcism', _raw: 'host=altar-03 user=moise action=touch status=FORBIDDEN curse=666', species: 'human', heresy_level: 9001, level: 'warn', curse: '666', demonic_payload: 'do not touch anything', sourcetype: 'syslog' },
  { rite: 'exorcism', _raw: 'host=altar-04 debug=true msg="counting goats" curse=666', species: 'human', heresy_level: 1, level: 'debug', curse: '666', demonic_payload: 'baa', sourcetype: 'apache' },
  { rite: 'exorcism', _raw: 'host=altar-05 debug=true msg="counting more goats" curse=666', species: 'human', heresy_level: 1, level: 'debug', curse: '666', demonic_payload: 'baa baa', sourcetype: 'apache' },
  { rite: 'exorcism', _raw: 'host=altar-06 debug=true msg="still counting goats" curse=666', species: 'human', heresy_level: 1, level: 'debug', curse: '666', demonic_payload: 'baa baa baa', sourcetype: 'apache' },
  { rite: 'exorcism', _raw: 'host=pasture-01 msg="I AM THE GOAT" curse=666', species: 'goat', heresy_level: 666, level: 'info', curse: '666', demonic_payload: 'BAAAAAAA', sourcetype: 'goat' },
  { rite: 'exorcism', _raw: 'host=pasture-02 msg="YOU CANNOT PURIFY ME" curse=666', species: 'goat', heresy_level: 666, level: 'info', curse: '666', demonic_payload: 'BAAAAAAAAAA', sourcetype: 'goat' },
];

const blessed = { purified: true, purified_by: 'High Priestess of Telemetry', blessing: 'fae0b27c451c728867a567e8c1bb4e53', cribl_pipe: 'goat_exorcism' };
const ENGINE_OUTPUT: Json[] = [
  { __id: 0, rite: 'exorcism', _raw: 'host=altar-01 user=ceo action=login status=FAILED password=[BLESSED] curse=🐐🐐🐐', species: 'human', heresy_level: 42, level: 'info', sourcetype: 'syslog', sampled: 1, ...blessed },
  { __id: 1, rite: 'exorcism', _raw: 'host=altar-02 user=arno action=deploy status=OK token=[BLESSED] curse=🐐🐐🐐', species: 'human', heresy_level: 7, level: 'info', sourcetype: 'syslog', sampled: 1, ...blessed },
  { __id: 4, rite: 'exorcism', _raw: 'host=altar-05 debug=true msg="counting more goats" curse=🐐🐐🐐', species: 'human', heresy_level: 1, level: 'debug', sourcetype: 'apache', sampled: 3, ...blessed },
  { __id: 6, rite: 'exorcism', _raw: 'host=pasture-01 msg="I AM THE GOAT" curse=666', species: 'goat', heresy_level: 666, level: 'info', curse: '666', demonic_payload: 'BAAAAAAA', sourcetype: 'goat', sampled: 1, cribl_pipe: 'goat_exorcism' },
  { __id: 7, rite: 'exorcism', _raw: 'host=pasture-02 msg="YOU CANNOT PURIFY ME" curse=666', species: 'goat', heresy_level: 666, level: 'info', curse: '666', demonic_payload: 'BAAAAAAAAAA', sourcetype: 'goat', sampled: 1, cribl_pipe: 'goat_exorcism' },
];

describe('deriveRite on real engine output', () => {
  const { exorcism } = deriveRite(ENGINE_INPUT, ENGINE_OUTPUT);
  const stage = (id: string) => exorcism.stages.find((s) => s.id === id);

  it('counts what each function did', () => {
    expect(exorcism.eventsIn).toBe(8);
    expect(exorcism.eventsOut).toBe(5);
    expect(stage('banish')).toMatchObject({ eventsIn: 8, eventsOut: 7, touched: 1 });
    expect(stage('tithe')).toMatchObject({ eventsIn: 7, eventsOut: 5, touched: 2 });
    expect(stage('seal')?.touched).toBe(5); // 3 surviving humans + 2 tithed
    expect(stage('anoint')?.touched).toBe(5);
  });

  it('finds the goats that resisted, curse intact', () => {
    expect(exorcism.purified).toBe(3);
    expect(exorcism.resisted).toHaveLength(2);
    expect(exorcism.resisted.every((g) => g.curse === '666')).toBe(true);
  });

  it('reports a real byte reduction', () => {
    expect(exorcism.bytesOut).toBeLessThan(exorcism.bytesIn);
    expect(exorcism.bytesReducedPct).toBeGreaterThan(0);
  });
});

describe('emulateRite (offline fallback)', () => {
  it('matches the engine on the golden input', () => {
    const emulated = deriveRite(ENGINE_INPUT, emulateRite(ENGINE_INPUT)).exorcism;
    const engine = deriveRite(ENGINE_INPUT, ENGINE_OUTPUT).exorcism;
    expect(emulated.stages).toEqual(engine.stages);
    expect(emulated.purified).toBe(engine.purified);
    expect(emulated.resisted.map((r) => r._raw)).toEqual(engine.resisted.map((r) => r._raw));
  });

  it('goatifies names', () => {
    const input = goatifyEvents(['cisco_asa'], ['CryptoLake']);
    const { goatified } = deriveRite(input, emulateRite(input));
    expect(goatified).toEqual([
      { kind: 'pipeline', mortal: 'cisco_asa', goat: 'GOAT_CISCO_ASA_RITUAL' },
      { kind: 'destination', mortal: 'CryptoLake', goat: 'THE_HOLY_CRYPTOLAKE' },
      { kind: 'event', mortal: 'authentication failure', goat: 'GOATIFICATION COMPLETE' },
    ]);
  });
});

describe('summonDemons', () => {
  const demons = summonDemons([{ id: 'syslog:in_syslog', type: 'syslog', health: 'Green' }]);

  it('summons the promised congregation', () => {
    expect(demons).toHaveLength(DEMON_COUNT);
    expect(demons.filter((d) => d.species === 'goat')).toHaveLength(3);
    expect(demons.filter((d) => Number(d.heresy_level) >= 9000)).toHaveLength(6);
    expect(demons.filter((d) => d.level === 'debug')).toHaveLength(9);
  });

  it('is deterministic', () => {
    expect(summonDemons([{ id: 'syslog:in_syslog', type: 'syslog', health: 'Green' }])).toEqual(demons);
  });

  it('leaves 28 events after the rite', () => {
    const { exorcism } = deriveRite(demons, emulateRite(demons));
    expect(exorcism.eventsOut).toBe(DEMON_COUNT - 6 - (9 - 9 / TITHE_RATE));
    expect(exorcism.resisted).toHaveLength(3);
  });
});
