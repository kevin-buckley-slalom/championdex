export type StatLevel = 50 | 100;

export interface EVs {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface IVs {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface TeamMember {
  id: string;
  pokemonId: number;
  nickname: string | null;
  abilityId: number | null;
  heldItemId: number | null;
  moveIds: [number | null, number | null, number | null, number | null];
  evs: EVs;
  ivs: IVs;
  statLevel: StatLevel;
  nature: string | null;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_EVS: EVs = {
  hp: 0, attack: 0, defense: 0,
  specialAttack: 0, specialDefense: 0, speed: 0,
};

export const DEFAULT_IVS: IVs = {
  hp: 31, attack: 31, defense: 31,
  specialAttack: 31, specialDefense: 31, speed: 31,
};
