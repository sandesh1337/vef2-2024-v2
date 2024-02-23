/**
 * "Reiknum út stöðuna í gagnabankanum"
 */

// þarf að forrita þetta

/**
 * @typedef {Object} TeamStanding
 * @property {string} name Name of team.
 * @property {number} points Number of points.
 */

const POINTS_WIN = 3;
const POINTS_DRAW = 1;
const POINTS_LOSS = 0;

/**
 * Create an empty standing for a team.
 * @param {string} name Name of team to create standing for.
 * @returns Team standing.
 */
function setStanding(name) {
  return {
    name,
    points: 0,
  };
}

/**
 * Calculate team standings from games.
 * //@param {Array<import('./parse').Game>} games
 * @returns {Array<TeamStanding>} Ordered array of team standings.
 */
export function calculateStandings(games) {
  if (games.length === 0) {
    return [];
  }

  // Set the type of our object to be a record of name and standing, i.e.
  // `{ teamName: { name: string; points: number; } }`
  /** @type Record<string, TeamStanding> */
  const standings = {};

  for (const game of games) {
    const {
      home: { name: homeName, score: homeScore },
      away: { name: awayName, score: awayScore },
    } = game;

    if (!standings[homeName]) {
      standings[homeName] = setStanding(homeName);
    }

    if (!standings[awayName]) {
      standings[awayName] = setStanding(awayName);
    }

    if (homeScore > awayScore) {
      standings[homeName].points += POINTS_WIN;
      standings[awayName].points += POINTS_LOSS;
    } else if (homeScore < awayScore) {
      standings[homeName].points += POINTS_LOSS;
      standings[awayName].points += POINTS_WIN;
    } else {
      standings[homeName].points += POINTS_DRAW;
      standings[awayName].points += POINTS_DRAW;
    }
  }

  // `standings` will be an object of format:
  // `{ teamName: { name: string; points: number; } }`
  // but we want to return a sorted array so we need to convert
  const standingsAsArray = Object.values(standings);

  return standingsAsArray.sort((a, b) => b.points - a.points);
}



