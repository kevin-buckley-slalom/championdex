export type ItemCategory =
  | 'held' | 'berry' | 'medicine' | 'pokeball' | 'battle' | 'key' | 'other';

export interface Item {
  id: number;
  name: string;
  displayName: string;
  category: ItemCategory;
  description: string;
  shortDescription: string;
  spriteUrl: string | null;
  cost: number | null;
}
