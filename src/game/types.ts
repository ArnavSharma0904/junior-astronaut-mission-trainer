/**
 * Pure game model. All resource numbers are GAME units (0-100), not physical quantities.
 * `spaceWeather` is an educational indicator and never a radiation dose.
 */
export type Weather = 'quiet' | 'watch' | 'storm' | 'clearing';
export type Crew = 'working' | 'sheltered';
export type TurnPhase = 'situation' | 'inspecting' | 'resolving' | 'explained' | 'ended';
export type Outcome = 'in-progress' | 'success' | 'partial' | 'paused';
export type PauseReason = 'power' | 'oxygen' | 'safety-rule';

export interface Delta {
  power?: number;
  oxygen?: number;
  samples?: number;
}

export type Requirement =
  | { kind: 'minPower'; value: number }
  | { kind: 'shelterStocked' }
  | { kind: 'shelterNotStocked' };

export interface ActionDef {
  id: string;
  /** Change applied before upkeep. */
  delta: Delta;
  /** Replaces `delta` when the shelter was not stocked beforehand (a rushed move). */
  deltaIfUnstocked?: Delta;
  sets?: { shelterStocked?: true; crew?: Crew };
  requires?: Requirement[];
  /** Working outside during a particle storm breaks the mission safety rule and pauses the mission. */
  breaksSafetyRule?: true;
  principleId: string;
  sourceIds: string[];
}

export interface TurnDef {
  id: string;
  weather: Weather;
  /** Ids of archived records or game assumptions shown for this turn. */
  evidenceIds: string[];
  actions: ActionDef[];
}

export interface MissionDef {
  id: string;
  start: { power: number; oxygen: number };
  /** Applied after every action: the base idles and the crew breathes. */
  upkeep: { power: number; oxygen: number };
  goalSamples: number;
  /** Reserves that must remain at the end for a full success. */
  reserve: { power: number; oxygen: number };
  turns: TurnDef[];
}

export interface Decision {
  turnIndex: number;
  actionId: string;
  applied: Required<Delta>;
  rushed: boolean;
  after: { power: number; oxygen: number; samples: number };
}

export interface GameState {
  schemaVersion: 1;
  missionId: string;
  snapshotVersion: string;
  turnIndex: number;
  phase: TurnPhase;
  inspecting: string | null;
  resources: { power: number; oxygen: number };
  samples: number;
  shelterStocked: boolean;
  crew: Crew;
  spaceWeather: Weather;
  decisionLog: Decision[];
  outcome: Outcome;
  pauseReason: PauseReason | null;
}

export type GameEvent =
  | { type: 'INSPECT'; actionId: string }
  | { type: 'COMMIT'; actionId: string }
  | { type: 'RESOLUTION_SHOWN' }
  | { type: 'NEXT' };

export type ConsequenceEvent =
  | { kind: 'resource'; resource: 'power' | 'oxygen'; from: number; to: number; actionPart: number; upkeepPart: number }
  | { kind: 'samples'; from: number; to: number }
  | { kind: 'shelter-stocked' }
  | { kind: 'crew'; to: Crew }
  | { kind: 'weather'; to: Weather }
  | { kind: 'ended'; outcome: Outcome; pauseReason: PauseReason | null };

export type RejectionReason =
  | { code: 'wrong-phase' }
  | { code: 'unknown-action' }
  | { code: 'requirement'; requirement: Requirement };

export interface Resolution {
  state: GameState;
  events: ConsequenceEvent[];
  rejected?: RejectionReason;
}
