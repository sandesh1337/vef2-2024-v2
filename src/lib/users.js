/**
 * "Static notendagrunnur"
 * Notendur eru harðkóðaðir og ekkert hægt að breyta þeim.
 * Ef við notum notendagagnagrunn, t.d. í postgres, útfærum við leit að notendum
 * hér, ásamt því að passa upp á að lykilorð séu lögleg.
 */


import bcrypt from 'bcrypt';
import {getUsers} from "./db.js";


import logout from 'passport';


export async function logoutUser(req) {
  return new Promise((resolve, reject) => {
    // Using Passport.js logout function to clear the login session
    req.logout((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

const records = await getUsers();
//console.log(records);

export async function comparePasswords(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (e) {
    console.error('Gat ekki borið saman lykilorð', e);
  }

  return false;
}

// Merkjum sem async þó ekki verið að nota await, þar sem þetta er notað í
// app.js gerir ráð fyrir async falli
export async function findByUsername(username) {
  const found = records.find((u) => u.username === username);

  if (found) {
    console.log("Found User:", found);  // Log the entire user object

    const { password, ...userWithoutPassword } = found;

    if (password) {
      return { password, ...userWithoutPassword };
    } else {
      console.error("User password is undefined");
    }
  }

  return null;
}

// Merkjum sem async þó ekki verið að nota await, þar sem þetta er notað í
// app.js gerir ráð fyrir async falli
export async function findById(id) {
  const found = records.find((u) => u.id === id);

  if (found) {
    return found;
  }

  return null;
}
