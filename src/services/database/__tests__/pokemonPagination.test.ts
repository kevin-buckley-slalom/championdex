import * as SQLite from 'expo-sqlite';
import { getPokemonPage, PaginationOptions } from '../pokemonRepository';

// Mock the database module
jest.mock('../initializeDatabase', () => ({
  getDatabase: jest.fn(),
}));

describe('getPokemonPage', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getAllAsync: jest.fn(),
    };

    const { getDatabase } = require('../initializeDatabase');
    getDatabase.mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a page of pokemon with default sort', async () => {
    const mockPokemon = [
      {
        id: 1,
        national_dex: 1,
        pokeapi_id: 1,
        name: 'Bulbasaur',
        display_name: 'Bulbasaur',
        form_type: 'default',
        form_name: null,
        primary_type: 'Grass',
        secondary_type: 'Poison',
        sprite_url: 'url',
        generation: 1,
        hp: 45,
        attack: 49,
        defense: 49,
        special_attack: 65,
        special_defense: 65,
        speed: 45,
      },
    ];

    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    const result = await getPokemonPage({
      limit: 50,
      offset: 0,
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bulbasaur');
    expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY national_dex ASC'),
      expect.arrayContaining([50, 0])
    );
  });

  it('should apply generation filter', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 0,
      generation: 1,
    });

    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('generation = ?'),
      expect.arrayContaining([1])
    );
  });

  it('should apply single type filter (OR mode)', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 0,
      types: ['fire'] as any,
      typeFilterMode: 'or',
    });

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[0]).toContain('LOWER(primary_type)');
    expect(call[0]).toContain('LOWER(secondary_type)');
  });

  it('should apply dual type filter (AND mode)', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 0,
      types: ['fire', 'flying'] as any,
      typeFilterMode: 'and',
    });

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[0]).toContain('AND');
  });

  it('should apply search filter', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 0,
      search: 'bulba',
    });

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[0]).toContain('LOWER(name) LIKE ?');
    expect(call[1]).toContain('%bulba%');
  });

  it('should sort by name', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 0,
      sortBy: 'name',
      sortDirection: 'asc',
    });

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[0]).toContain('ORDER BY display_name ASC');
  });

  it('should sort by total stats', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 0,
      sortBy: 'total',
      sortDirection: 'desc',
    });

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[0]).toContain('(hp + attack + defense + special_attack + special_defense + speed)');
    expect(call[0]).toContain('DESC');
  });

  it('should sort by individual stats', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 0,
      sortBy: 'speed',
      sortDirection: 'desc',
    });

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[0]).toContain('ORDER BY speed DESC');
  });

  it('should apply pagination with offset', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 100,
    });

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[1]).toContain(50); // limit
    expect(call[1]).toContain(100); // offset
  });

  it('should handle multiple filters together', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 0,
      generation: 1,
      types: ['fire'] as any,
      search: 'char',
      sortBy: 'dex',
      sortDirection: 'asc',
    });

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[0]).toContain('generation = ?');
    expect(call[0]).toContain('LOWER(primary_type)');
    expect(call[0]).toContain('LIKE ?');
  });

  it('should properly escape search queries', async () => {
    const mockPokemon: any[] = [];
    mockDb.getAllAsync.mockResolvedValue(mockPokemon);

    await getPokemonPage({
      limit: 50,
      offset: 0,
      search: "Pikachu's",
    });

    const call = mockDb.getAllAsync.mock.calls[0];
    expect(call[1]).toContain("%pikachu's%");
  });

  it('should return empty array for no results', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);

    const result = await getPokemonPage({
      limit: 50,
      offset: 0,
    });

    expect(result).toEqual([]);
  });
});
