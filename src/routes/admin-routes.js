import express from 'express';
import passport from 'passport';
import {deleteGameById, getGames, insertGame} from '../lib/db.js';
import {logoutUser} from "../lib/users.js";

export const adminRouter = express.Router();

const games = await getGames();

async function loginRoute(req, res) {
  return res.render('login', {
    title: 'Innskráning',
  });
}


async function adminRoute(req, res) {
  const user = req.user ?? null;
  const loggedIn = req.isAuthenticated();
  return res.render('admin', {
    loggedIn: req.isAuthenticated(),
    title: 'Admin upplýsingar, mjög leynilegt',
    user,
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



function skraRoute(req, res, next) {
  return res.render('skra', {
    title: 'Skrá leik',

  });
}

function skraRouteInsert(req, res, next) {
  // TODO mjög hrátt allt saman, vantar validation!
  const { home_name, home_score, away_name, away_score } = req.body;

  //const result = insertGame(home_name, home_score, away_name, away_score);
  insertGame(home_name, home_score, away_name, away_score);
  res.redirect('/leikir');
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
adminRouter.post('/skra', skraRouteInsert);





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

// whenn i press the logout button it will redirect me to the home page
adminRouter.post('/logout', async (req, res) => {
  try {
    await logoutUser(req);
    res.redirect('/');
  } catch (err) {
    console.error('Error logging out:', err);
    res.redirect('/'); // Redirecting to home page even if logout fails
  }
});



