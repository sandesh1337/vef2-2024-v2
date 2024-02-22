import express from 'express';
import { getGames } from '../lib/db.js';
import {calculateStandings} from "../lib/score.js";
import {ensureLoggedIn} from "./admin-routes.js";

export const indexRouter = express.Router();
const games = await getGames();

async function indexRoute(req, res) {
  return res.render('index', {
    title: 'Forsíða',
    time: new Date().toISOString(),
  });
}


async function adminRoute(req, res) {
  return res.render('admin', {
    title: 'Stjórnborð',
    games,
    time: new Date().toISOString(),
  });

}
async function leikirRoute(req, res) {

  return res.render('leikir', {
    title: 'Leikir',
    games,
    time: new Date().toISOString(),
  });
}

async function stadaRoute(req, res) {
  const stada = await calculateStandings(games);

  return res.render('stada', {
    title: 'Staðan',
    stada,
    time: new Date().toISOString(),
  });
}

indexRouter.get('/', indexRoute);
indexRouter.get('/leikir', leikirRoute);

indexRouter.get('/stada', stadaRoute);
indexRouter.get('/admin', ensureLoggedIn, adminRoute);
