import pg from 'pg';
import { readFile } from 'fs/promises';
import { environment } from './environment.js';
import { logger } from './logger.js';

const SCHEMA_FILE = './src/sql/schema.sql';
const DROP_SCHEMA_FILE = './src/sql/drop.sql';



const env = environment(process.env, logger);

if (!env?.connectionString) {
  logger.error('Connection string is missing in environment configuration');
  process.exit(-1);
}

const pool = new pg.Pool({
  connectionString: env.connectionString,
  ssl: {
    rejectUnauthorized: false // Set to false for development or trusted server environments
  }
});

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(q, values = []) {
  let client;
  try {
    client = await pool.connect();
  } catch (e) {
    console.error('unable to get client from pool', e);
    return null;
  }

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    console.error('unable to query', e);
    console.info(q, values);
    return null;
  } finally {
    client.release();
  }
}

export async function getTeams() {
  const q = `
    SELECT
      id,
      name
    FROM
      teams
  `;

  const result = await query(q);

  const teams = [];
  if (result && (result.rows?.length ?? 0) > 0) {
    for (const row of result.rows) {
      const team = {
        id: row.id,
        name: row.name,
      };
      teams.push(team);
    }
  }
  return teams;
}

export async function getGames() {
  const q = `
    SELECT
      games.id,
      date,
      home_team.name AS home_name,
      home_score,
      away_team.name AS away_name,
      away_score
    FROM
      games
        LEFT JOIN
      teams AS home_team ON home_team.id = games.home
        LEFT JOIN
      teams AS away_team ON away_team.id = games.away
  `;

  const result = await query(q);

  const games = [];
  if (result && (result.rows?.length ?? 0) > 0) {
    for (const row of result.rows) {
      const game = {
        id: row.id,
        date: row.date,
        home: {
          name: row.home_name,
          score: row.home_score,
        },
        away: {
          name: row.away_name,
          score: row.away_score,
        },
      };
      games.push(game);
    }
  }
  return games;
}


export async function createSchema(schemaFile = SCHEMA_FILE) {
  const data = await readFile(schemaFile);

  return query(data.toString('utf-8'));
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
  const data = await readFile(dropFile);

  return query(data.toString('utf-8'));
}

export async function insertGame(home, away, homeScore, awayScore) {
  const q = 'INSERT INTO games (home, away, home_score, away_score) VALUES ($1, $2, $3, $4);';
  try {
    const result = await query(q, [home, away, homeScore, awayScore]);
    console.info('Game inserted successfully');
    return result;
  } catch (e) {
    console.error('Error inserting game:', e);
    throw e;
  }
}

export async function end() {
  await pool.end();
}


export async function getUsers() {
  const q = `
    SELECT *
    FROM
      users
  `;

  const result = await query(q);

  const users = [];
  if (result && (result.rows?.length ?? 0) > 0) {
    for (const row of result.rows) {
      const user = {
        id: row.id,
        username: row.username,
        name: row.name,
        admin: row.admin,
        password: row.password,
      };
      users.push(user);
    }
  }
  return users;
}

export async function deleteGameById(gameId) {
  const q = `
    DELETE FROM games
    WHERE id = $1
  `;

  try {
    const result = await query(q, [gameId]);
    console.info(`Game with ID ${gameId} deleted successfully`);

    return result.rowCount;
  } catch (e) {
    console.error(`Error deleting game with ID ${gameId}:`, e.message);
    throw e;
  }
}



export async function updateGameById(gameId, newHomeScore, newAwayScore) {
  const q = `
    UPDATE games
    SET home_score = $2,
        away_score = $3
    WHERE id = $1
  `;

  try {
    await query(q, [gameId, newHomeScore, newAwayScore]);
    console.info(`Game with ID ${gameId} updated successfully`);
  } catch (e) {
    console.error(`Error updating game with ID ${gameId}`, e);
  }
}


