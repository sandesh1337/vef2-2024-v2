import pg from 'pg';
import { readFile } from 'fs/promises';
import { environment } from './environment.js';
import { logger } from './logger.js';


const env = environment(process.env, logger);

const SCHEMA_FILE = './src/sql/schema.sql';
const DROP_SCHEMA_FILE = './src/sql/drop.sql';

if (!env?.connectionString) {
  process.exit(-1);
}

const { connectionString } = env;

const pool = new pg.Pool({ connectionString });

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

export function insertGame(home_name, home_score, away_name, away_score) {
  const q =
    'insert into games (home, away, home_score, away_score) values ($1, $2, $3, $4);';

  const result = query(q, [home_name, home_score, away_name, away_score]);
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


