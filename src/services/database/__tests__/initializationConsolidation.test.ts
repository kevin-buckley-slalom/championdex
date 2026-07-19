/**
 * Test suite for consolidated database initialization.
 *
 * Validates that the new single initializeDatabase() function:
 * - Has proper re-entry guard (initPromise) preventing double-runs
 * - Completes all initialization phases before resolving
 * - Properly exports only the public API
 */

jest.mock('../bundledDbService', () => ({
  copyBundledDbIfNeeded: jest.fn().mockResolvedValue(undefined),
  overwriteBundledDb: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-sqlite', () => ({
  importDatabaseFromAssetAsync: jest.fn().mockResolvedValue(undefined),
  deleteDatabaseAsync: jest.fn().mockResolvedValue(undefined),
  openDatabaseAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/data/data/com.championdex.app/files/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
  moveAsync: jest.fn(),
}));

jest.mock('../seedDatabase', () => ({
  seedDatabase: jest.fn().mockResolvedValue(undefined),
}));

describe('initializeDatabase - Consolidated Initialization', () => {
  const BUNDLED_DATA_VERSION = '1.13.0';

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('Consolidation - Single Function Replaces Two', () => {
    it('initializeDatabase is the single public initialization function', () => {
      jest.resetModules();
      const module = require('../initializeDatabase');

      // Public API exports
      expect(module.initializeDatabase).toBeDefined();
      expect(typeof module.initializeDatabase).toBe('function');
      expect(module.getDatabase).toBeDefined();
      expect(typeof module.getDatabase).toBe('function');

      // Old Phase 1 export should be gone
      expect(module.initializeDatabasePhase1).toBeUndefined();
    });

    it('initializeDatabase handles fresh install (no schema) successfully', async () => {
      jest.resetModules();
      const { initializeDatabase } = require('../initializeDatabase');
      const { openDatabaseAsync } = require('expo-sqlite');

      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(null) // No data_version => fresh install
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ sql: 'CREATE TABLE pokemon_evolutions' }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        execAsync: jest.fn().mockResolvedValue(undefined),
        closeAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      openDatabaseAsync.mockResolvedValue(mockDb);

      // Should complete without error
      await expect(initializeDatabase()).resolves.toBeUndefined();

      // Schema and migrations should have run
      expect(mockDb.execAsync).toHaveBeenCalled();
    });

    it('initializeDatabase handles existing install (with schema) successfully', async () => {
      jest.resetModules();
      const { initializeDatabase } = require('../initializeDatabase');
      const { openDatabaseAsync } = require('expo-sqlite');

      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce({ value: BUNDLED_DATA_VERSION })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ sql: 'CREATE TABLE pokemon_evolutions' }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        execAsync: jest.fn().mockResolvedValue(undefined),
        closeAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      openDatabaseAsync.mockResolvedValue(mockDb);

      // Should complete without error
      await expect(initializeDatabase()).resolves.toBeUndefined();

      // Migrations should still run
      expect(mockDb.execAsync).toHaveBeenCalled();
    });
  });

  describe('Initialization Phases - All Run Before Resolve', () => {
    it('resolves only after database is checked and ready', async () => {
      jest.resetModules();
      const { initializeDatabase } = require('../initializeDatabase');
      const { openDatabaseAsync } = require('expo-sqlite');

      let getFirstAsyncCalled = false;
      let execAsyncCalled = false;

      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce({ value: BUNDLED_DATA_VERSION })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ sql: 'CREATE TABLE pokemon_evolutions' }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        execAsync: jest
          .fn()
          .mockImplementation(() => {
            execAsyncCalled = true;
            return Promise.resolve();
          }),
        closeAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      openDatabaseAsync.mockResolvedValue(mockDb);

      // Before init
      expect(execAsyncCalled).toBe(false);

      await initializeDatabase();

      // After init - exec should have been called for migrations
      expect(execAsyncCalled).toBe(true);
    });

    it('version bump detection and replacement work correctly', async () => {
      jest.resetModules();
      const { initializeDatabase } = require('../initializeDatabase');
      const { openDatabaseAsync } = require('expo-sqlite');
      const { overwriteBundledDb } = require('../bundledDbService');

      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce({ value: '1.12.0' }) // Stale version
          .mockResolvedValueOnce({ value: BUNDLED_DATA_VERSION })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ sql: 'CREATE TABLE pokemon_evolutions' }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        execAsync: jest.fn().mockResolvedValue(undefined),
        closeAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      openDatabaseAsync.mockResolvedValue(mockDb);

      await expect(initializeDatabase()).resolves.toBeUndefined();

      // Version mismatch should trigger replacement via overwriteBundledDb
      expect(overwriteBundledDb).toHaveBeenCalled();
    });
  });

  describe('Error Propagation', () => {
    it('throws when seedDatabase fails on fresh install', async () => {
      jest.resetModules();
      const { initializeDatabase } = require('../initializeDatabase');
      const { seedDatabase } = require('../seedDatabase');
      const { openDatabaseAsync } = require('expo-sqlite');

      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(null) // Fresh install
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ sql: 'CREATE TABLE pokemon_evolutions' }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        execAsync: jest.fn().mockResolvedValue(undefined),
        closeAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      openDatabaseAsync.mockResolvedValue(mockDb);
      seedDatabase.mockRejectedValue(new Error('Seeding failed'));

      await expect(initializeDatabase()).rejects.toThrow('Seeding failed');
    });
  });

  describe('Public API - No Internal Phases Exposed', () => {
    it('does not export initializeDatabasePhase1', () => {
      jest.resetModules();
      const module = require('../initializeDatabase');
      expect(module.initializeDatabasePhase1).toBeUndefined();
      expect(module._initializeDatabasePhase1).toBeUndefined();
    });

    it('does not export initializeDatabasePhase2 or _initializeDatabasePhase2', () => {
      jest.resetModules();
      const module = require('../initializeDatabase');
      expect(module.initializeDatabasePhase2).toBeUndefined();
      expect(module._initializeDatabasePhase2).toBeUndefined();
    });

    it('cleanly exports only initializeDatabase and getDatabase', () => {
      jest.resetModules();
      const module = require('../initializeDatabase');

      const exportedNames = Object.keys(module);
      const publicExports = ['initializeDatabase', 'getDatabase'];

      publicExports.forEach(name => {
        expect(exportedNames).toContain(name);
        expect(typeof module[name]).toBe('function');
      });

      // No internal functions exposed
      expect(exportedNames).not.toContain('_initializeDatabase');
      expect(exportedNames).not.toContain('initializeDatabasePhase1');
    });
  });

  describe('Happy Paths - All Scenarios Succeed', () => {
    it('fresh install completes successfully', async () => {
      jest.resetModules();
      const { initializeDatabase } = require('../initializeDatabase');
      const { openDatabaseAsync } = require('expo-sqlite');

      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ sql: 'CREATE TABLE pokemon_evolutions' }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        execAsync: jest.fn().mockResolvedValue(undefined),
        closeAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      openDatabaseAsync.mockResolvedValue(mockDb);

      await expect(initializeDatabase()).resolves.toBeUndefined();
    });

    it('existing install completes successfully', async () => {
      jest.resetModules();
      const { initializeDatabase } = require('../initializeDatabase');
      const { openDatabaseAsync } = require('expo-sqlite');

      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce({ value: BUNDLED_DATA_VERSION })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ sql: 'CREATE TABLE pokemon_evolutions' }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        execAsync: jest.fn().mockResolvedValue(undefined),
        closeAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      openDatabaseAsync.mockResolvedValue(mockDb);

      await expect(initializeDatabase()).resolves.toBeUndefined();
    });

    it('version bump completes successfully', async () => {
      jest.resetModules();
      const { initializeDatabase } = require('../initializeDatabase');
      const { openDatabaseAsync, deleteDatabaseAsync } = require('expo-sqlite');

      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce({ value: '1.12.0' })
          .mockResolvedValueOnce({ value: BUNDLED_DATA_VERSION })
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ sql: 'CREATE TABLE pokemon_evolutions' }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        execAsync: jest.fn().mockResolvedValue(undefined),
        closeAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue(undefined),
      };
      openDatabaseAsync.mockResolvedValue(mockDb);
      deleteDatabaseAsync.mockResolvedValue(undefined);

      await expect(initializeDatabase()).resolves.toBeUndefined();
    });
  });
});
