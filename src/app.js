import express from 'express';
import session from 'express-session';
import passport from 'passport';
import {Strategy} from 'passport-local';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {environment} from './lib/environment.js';
import {handler404, handlerError} from './lib/handlers.js';
import {logger} from './lib/logger.js';
import {adminRouter} from './routes/admin-routes.js';
import {indexRouter} from './routes/index-routes.js';

import {comparePasswords, findById, findByUsername, logoutUser} from './lib/users.js';
import {deleteGameById, getGames} from "./lib/db.js";
import {calculateStandings} from "./lib/score.js";



const env = environment(process.env, logger);

if (!env) {
  process.exit(1);
}

const {port, sessionSecret} = env;
const path = dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('views', join(path, '../views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));

// Passport will be used with sessions
const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
};
app.use(session(sessionOptions));

// Strategy for checking username and password
async function strat(username, password, done) {
  try {
    const user = await findByUsername(username);

    if (!user) {
      return done(null, false, {message: 'Incorrect username.'});
    }

    const hashedPassword = user.password;

    const result = await comparePasswords(password, hashedPassword);

    if (result) {
      console.log("Authentication successful");
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    console.error(err);
    return done(err, {message: 'Error authenticating user.'});
  }
}

// Use local strategy with our authentication strategy
passport.use(new Strategy(strat));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Fetch user based on ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Let express use passport with sessions
app.use(passport.initialize());
app.use(passport.session());

app.delete('/games/:gameId', async (req, res) => {
  const { gameId } = req.params;
  try {
    await deleteGameById(gameId);
    res.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete game with ID ${gameId}:`, error);
    res.status(500).json({ success: false, message: 'Error deleting game' });
  }
});


app.post('/delete-game/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const deletionCount = await deleteGameById(gameId);

    if (deletionCount > 0) {
      console.info(`Game with ID ${gameId} deleted successfully`);

      // Fetch updated games and calculate new standings
      let games = await getGames();
      let stada = calculateStandings(games);

      // Convert standings data to HTML table rows
      const tableRows = stada.map(team => `<tr><td>${team.name}</td><td>${team.points}</td></tr>`).join('');

      // Send only the updated table rows as JSON response
      res.json({ success: true, stada: tableRows });
    } else {
      res.json({ success: false, error: 'Game not found' });
    }
  } catch (e) {
    console.error(`Error deleting game:`, e.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Logout route
app.post('/logout', async (req, res) => {
  try {
    await logoutUser(req);
    res.redirect('/');
  } catch (err) {
    console.error('Error logging out:', err);
    res.redirect('/'); // Redirecting to home page even if logout fails
  }
});


// Set up your other routes and middleware here
app.use('/', indexRouter);
app.use('/', adminRouter);
app.use(express.static(join(path, '../public')));
app.use(handler404);
app.use(handlerError);

app.use((req, res, next) => {
  res.locals.loggedIn = req.isAuthenticated();
  res.locals.user = req.user;
  next();
});








app.listen(port, () => {
  console.info(`🚀 Server running at http://localhost:${port}/`);
  process.on('SIGINT', () => process.exit(1));
});
