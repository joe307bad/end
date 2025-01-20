const fs = require('fs');
const path = require('path');

const directoryPath = '/Users/joebad/Source/end/node_modules/@tamagui'; // Change this to your directory path

function getVersions(dirPath) {
  fs.readdir(dirPath, (err, folders) => {
    if (err) {
      console.error('Unable to scan directory:', err);
      return;
    }

    folders.forEach((folder) => {
      const packageJsonPath = path.join(dirPath, folder, 'package.json');

      fs.readFile(packageJsonPath, 'utf8', (err, data) => {
        if (err) {
          // Ignore if package.json doesn't exist or can't be read
          return;
        }

        try {
          const packageJson = JSON.parse(data);
          const version = packageJson.version || 'No version specified';
          console.log(`${folder}: ${version}`);
        } catch (parseErr) {
          console.error(`Error parsing ${packageJsonPath}:`, parseErr);
        }
      });
    });
  });
}

getVersions(directoryPath);
