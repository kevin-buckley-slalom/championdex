import { PokemonType } from './pokemon';

export type MoveCategory = 'physical' | 'special' | 'status';
export type MoveLearnMethod = 'level-up' | 'tm' | 'egg' | 'tutor';

export interface Move {
  id: number;
  name: string;
  displayName: string;
  type: PokemonType;
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  description: string;
  shortDescription: string;
  generation: number;
  makesContact: boolean;
}

export interface PokemonMove {
  moveId: number;
  moveName: string;
  moveDisplayName: string;
  moveType: PokemonType;
  moveCategory: MoveCategory;
  learnMethod: MoveLearnMethod;
  learnLevel: number | null;
  power: number | null;
  accuracy: number | null;
  pp: number;
}
