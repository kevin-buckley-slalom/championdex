import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './initializeDatabase';
import { Team, TeamMember, EVs, IVs, DEFAULT_EVS, DEFAULT_IVS } from '@/types';

export async function getAllTeams(): Promise<Team[]> {
  const db = await getDatabase();

  const teamResults = await db.getAllAsync<any>(
    `SELECT * FROM teams ORDER BY updated_at DESC`
  );

  const teams: Team[] = [];
  for (const teamRow of teamResults) {
    const members = await getTeamMembers(db, teamRow.id);
    teams.push({
      id: teamRow.id,
      name: teamRow.name,
      members,
      createdAt: teamRow.created_at,
      updatedAt: teamRow.updated_at,
    });
  }

  return teams;
}

export async function getTeamById(id: string): Promise<Team | null> {
  const db = await getDatabase();

  const teamRow = await db.getFirstAsync<any>(
    `SELECT * FROM teams WHERE id = ?`,
    [id]
  );

  if (!teamRow) return null;

  const members = await getTeamMembers(db, id);

  return {
    id: teamRow.id,
    name: teamRow.name,
    members,
    createdAt: teamRow.created_at,
    updatedAt: teamRow.updated_at,
  };
}

export async function createTeam(name: string = 'My Team'): Promise<Team> {
  const db = await getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO teams (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
    [id, name, now, now]
  );

  return {
    id,
    name,
    members: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateTeam(id: string, name: string): Promise<Team | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE teams SET name = ?, updated_at = ? WHERE id = ?`,
    [name, now, id]
  );

  return getTeamById(id);
}

export async function deleteTeam(id: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `DELETE FROM teams WHERE id = ?`,
    [id]
  );
}

export async function addTeamMember(
  teamId: string,
  slot: number,
  pokemonId: number,
  nickname?: string,
  abilityId?: number,
  heldItemId?: number
): Promise<TeamMember> {
  const db = await getDatabase();
  const memberId = uuidv4();

  await db.runAsync(
    `INSERT INTO team_members
     (id, team_id, slot, pokemon_id, nickname, ability_id, held_item_id,
      ev_hp, ev_attack, ev_defense, ev_sp_attack, ev_sp_defense, ev_speed,
      iv_hp, iv_attack, iv_defense, iv_sp_attack, iv_sp_defense, iv_speed,
      stat_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      memberId,
      teamId,
      slot,
      pokemonId,
      nickname || null,
      abilityId || null,
      heldItemId || null,
      0, 0, 0, 0, 0, 0, // EVs
      31, 31, 31, 31, 31, 31, // IVs
      50, // stat_level
    ]
  );

  return {
    id: memberId,
    pokemonId,
    nickname: nickname || null,
    abilityId: abilityId || null,
    heldItemId: heldItemId || null,
    moveIds: [null, null, null, null],
    evs: DEFAULT_EVS,
    ivs: DEFAULT_IVS,
    statLevel: 50,
    nature: null,
  };
}

export async function updateTeamMember(
  memberId: string,
  updates: Partial<TeamMember>
): Promise<void> {
  const db = await getDatabase();

  const parts: string[] = [];
  const values: any[] = [];

  if (updates.nickname !== undefined) {
    parts.push('nickname = ?');
    values.push(updates.nickname);
  }
  if (updates.abilityId !== undefined) {
    parts.push('ability_id = ?');
    values.push(updates.abilityId);
  }
  if (updates.heldItemId !== undefined) {
    parts.push('held_item_id = ?');
    values.push(updates.heldItemId);
  }
  if (updates.moveIds) {
    parts.push('move_1_id = ?, move_2_id = ?, move_3_id = ?, move_4_id = ?');
    values.push(
      updates.moveIds[0],
      updates.moveIds[1],
      updates.moveIds[2],
      updates.moveIds[3]
    );
  }
  if (updates.evs) {
    parts.push('ev_hp = ?, ev_attack = ?, ev_defense = ?, ev_sp_attack = ?, ev_sp_defense = ?, ev_speed = ?');
    values.push(
      updates.evs.hp,
      updates.evs.attack,
      updates.evs.defense,
      updates.evs.specialAttack,
      updates.evs.specialDefense,
      updates.evs.speed
    );
  }
  if (updates.ivs) {
    parts.push('iv_hp = ?, iv_attack = ?, iv_defense = ?, iv_sp_attack = ?, iv_sp_defense = ?, iv_speed = ?');
    values.push(
      updates.ivs.hp,
      updates.ivs.attack,
      updates.ivs.defense,
      updates.ivs.specialAttack,
      updates.ivs.specialDefense,
      updates.ivs.speed
    );
  }
  if (updates.statLevel !== undefined) {
    parts.push('stat_level = ?');
    values.push(updates.statLevel);
  }
  if (updates.nature !== undefined) {
    parts.push('nature = ?');
    values.push(updates.nature);
  }

  if (parts.length === 0) return;

  values.push(memberId);
  const query = `UPDATE team_members SET ${parts.join(', ')} WHERE id = ?`;

  await db.runAsync(query, values);
}

export async function removeTeamMember(memberId: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `DELETE FROM team_members WHERE id = ?`,
    [memberId]
  );
}

async function getTeamMembers(
  db: any,
  teamId: string
): Promise<TeamMember[]> {
  const results = await db.getAllAsync(
    `SELECT * FROM team_members WHERE team_id = ? ORDER BY slot ASC`,
    [teamId]
  );

  return (results as any[]).map(dbRowToTeamMember);
}

function dbRowToTeamMember(row: any): TeamMember {
  return {
    id: row.id,
    pokemonId: row.pokemon_id,
    nickname: row.nickname,
    abilityId: row.ability_id,
    heldItemId: row.held_item_id,
    moveIds: [row.move_1_id, row.move_2_id, row.move_3_id, row.move_4_id],
    evs: {
      hp: row.ev_hp,
      attack: row.ev_attack,
      defense: row.ev_defense,
      specialAttack: row.ev_sp_attack,
      specialDefense: row.ev_sp_defense,
      speed: row.ev_speed,
    },
    ivs: {
      hp: row.iv_hp,
      attack: row.iv_attack,
      defense: row.iv_defense,
      specialAttack: row.iv_sp_attack,
      specialDefense: row.iv_sp_defense,
      speed: row.iv_speed,
    },
    statLevel: row.stat_level,
    nature: row.nature,
  };
}
