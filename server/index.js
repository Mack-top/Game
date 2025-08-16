const { initDatabase } = require('./database'); // Ensure database is initialized
const { ensurePortAvailable } = require('./port-manager');
const startPlayerServer = require('./player-server');
const startAdminServer = require('./admin-server');

const PLAYER_PORT = 3001;
const ADMIN_PORT = 3002;

async function startServers() {
  const db = await initDatabase();

  console.log('Ensuring player server port is available...');
  const playerPortAvailable = await ensurePortAvailable(PLAYER_PORT);
  if (!playerPortAvailable) {
    console.error(`Failed to ensure player server port ${PLAYER_PORT} is available. Exiting.`);
    process.exit(1);
  }

  console.log('Ensuring admin server port is available...');
  const adminPortAvailable = await ensurePortAvailable(ADMIN_PORT);
  if (!adminPortAvailable) {
    console.error(`Failed to ensure admin server port ${ADMIN_PORT} is available. Exiting.`);
    process.exit(1);
  }

  // Start the player server
  startPlayerServer(db, PLAYER_PORT);

  // Start the admin server
  startAdminServer(db, ADMIN_PORT);

  console.log('All backend services are starting...');
}

startServers();
