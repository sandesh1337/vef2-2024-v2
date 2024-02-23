import express from 'express';
import { getGames } from '../lib/db.js';
import {calculateStandings} from '../lib/score.js';



export const indexRouter = express.Router();


async function indexRoute(req, res) {
  return res.render('index', {
    loggedIn: req.isAuthenticated(), // This should return true if the user is authenticated
    user: req.user,
    title: 'Forsíða',
    time: new Date().toISOString(),
  });
}


async function leikirRoute(req, res) {
  const games = await getGames();

  return res.render('leikir', {
    loggedIn: req.isAuthenticated(), // This should return true if the user is authenticated
    user: req.user,
    title: 'Leikir',
    games,
    time: new Date().toISOString(),
  });
}

async function stadaRoute(req, res) {
  const games = await getGames();
  const stada = calculateStandings(games);

  return res.render('stada', {
    loggedIn: req.isAuthenticated(), // This should return true if the user is authenticated
    user: req.user,
    title: 'Staðan',
    stada,
    time: new Date().toISOString(),
  });
}



indexRouter.get('/', indexRoute);
indexRouter.get('/leikir', leikirRoute);

indexRouter.get('/stada', stadaRoute);
// indexRouter.get('/admin', ensureLoggedIn, adminRoute);
