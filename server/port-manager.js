const { exec } = require('child_process');
const os = require('os');

const isPortTaken = (port) => {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port}`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Command might fail if port is not found, which is fine.
        // Or if lsof is not installed on Linux/macOS.
        // For now, we'll assume it means port is not taken if command fails.
        // A more robust solution would check error.code or stderr.
        resolve(false);
        return;
      }
      if (stdout.includes(`:${port}`)) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

const getPidByPort = (port) => {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port} | grep LISTEN`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve(null);
        return;
      }

      let pid = null;
      if (platform === 'win32') {
        const lines = stdout.trim().split('\n');
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1];
          const parts = lastLine.trim().split(/\s+/);
          pid = parts[parts.length - 1];
        }
      } else {
        const match = stdout.match(/\s+(\d+)\s+node/); // Adjust regex if process name is different
        if (match && match[1]) {
          pid = match[1];
        }
      }
      resolve(pid);
    });
  });
};

const killProcess = (pid) => {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      command = `taskkill /F /PID ${pid}`;
    } else {
      command = `kill -9 ${pid}`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to kill process ${pid}: ${stderr}`);
        reject(error);
      } else {
        console.log(`Process ${pid} killed successfully.`);
        resolve();
      }
    });
  });
};

const ensurePortAvailable = async (port) => {
  const isTaken = await isPortTaken(port);
  if (isTaken) {
    console.warn(`Port ${port} is already in use.`);
    const pid = await getPidByPort(port);
    if (pid) {
      console.log(`Attempting to kill process ${pid} occupying port ${port}...`);
      try {
        await killProcess(pid);
        console.log(`Port ${port} is now available.`);
        return true; // Successfully made available
      } catch (error) {
        console.error(`Could not free port ${port}. Please close the process manually.`);
        return false; // Failed to make available
      }
    } else {
      console.error(`Could not find PID for port ${port}. Please close the process manually.`);
      return false; // Failed to make available
    }
  } else {
    console.log(`Port ${port} is available.`);
    return true; // Already available
  }
};

module.exports = {
  ensurePortAvailable,
};