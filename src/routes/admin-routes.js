import express, {query} from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';
import {getGames, getTeams, insertGame} from '../lib/db.js';
import {logoutUser} from '../lib/users.js';



const gameValidationRules = () =>[
    // Validate and sanitize the home_name
    body('home_name').trim().escape().isLength({ min: 1 }).withMessage('Home team name required.'),

    // Validate and sanitize the home_score
    body('home_score').isInt({ min: 0 }).withMessage
    ('Home score must be non-negative integer.').toInt(),

    // Validate and sanitize the away_name
    body('away_name').trim().escape().isLength({ min: 1 }).withMessage
    ('Away team name required.'),

    // Validate and sanitize the away_score
    body('away_score').isInt({ min: 0 }).withMessage
    ('Away score must be non-negative integer.').toInt(),
  ];

export const adminRouter = express.Router();

const games = await getGames();

async function loginRoute(req, res) {
  return res.render('login', {
    title: 'Innskráning',
  });
}





async function adminRoute(req, res) {
  const user = req.user ?? null;
  let teams = await getTeams();
  return res.render('admin', {
    loggedIn: req.isAuthenticated(),
    title: 'Admin upplýsingar, mjög leynilegt',
    user,
    teams,
    games,
  });
}



// TODO færa á betri stað
// Hjálpar middleware sem athugar hvort notandi sé innskráður og hleypir okkur
// þá áfram, annars sendir á /login
export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}



function skraRoute(req, res) {
  return res.render('skra', {
    title: 'Skrá leik',

  });
}

function skraRouteInsert(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // There are validation errors. Handle them accordingly.
    return res.status(400).json({ errors: errors.array() });
  }

  const { home_name, home_score, away_name, away_score } = req.body;
  insertGame(home_name, home_score, away_name, away_score);
  res.redirect('/leikir');
  return res.status(200).json({ success: true });
}

adminRouter.get('/login',loginRoute);
adminRouter.get('/admin', ensureLoggedIn, adminRoute);


adminRouter.post('/login', passport.authenticate('local', {
  failureRedirect: '/login', // Make sure this redirects to the login page
  failureMessage: 'Invalid username or password',
}), (req, res) => {
  res.redirect('/admin'); // Redirect to admin page upon successful login
});

adminRouter.get('/skra', skraRoute);
adminRouter.post('/skra', gameValidationRules(), skraRouteInsert);





adminRouter.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login', // Redirect back to the login page if there's an error
    failureMessage: 'Invalid username or password', // Optional: Flash message for the login failure
  }),
  (req, res) => {
    // Redirect to the admin page upon successful login
    res.redirect('/admin');
  }
);

// whenn i press thedynamically update pages after deletion logout button it will redirect me to the home page
adminRouter.post('/logout', async (req, res) => {
  try {
    await logoutUser(req);
    res.redirect('/');
  } catch (err) {
    console.error('Error logging out:', err);
    res.redirect('/'); // Redirecting to home page even if logout fails
  }
});

adminRouter.post('/admin/add-game', ensureLoggedIn, async (req, res) => {
  const {  home, away } = req.body;
  // Parse scores as integers
  const home_score = parseInt(req.body.home_score, 10);
  const away_score = parseInt(req.body.away_score, 10);

  // Check for NaN values in scores
  if (isNaN(home_score) || isNaN(away_score)) {
    // Redirect back to the form with a message
    return res.status(400).send('Invalid scores provided.');
  }

  try {
    await insertGame( home, away, home_score, away_score);
    // Redirect to the games list page or wherever appropriate
    res.redirect('/leikir');
  } catch (error) {
    console.error('Error inserting game:', error);
    // Handle the error appropriately
    res.status(500).send('An error occurred while adding the game.');
  }
});


