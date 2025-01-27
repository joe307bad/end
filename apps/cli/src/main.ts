import { allDocuments } from 'contentlayer/generated';
import * as fs from 'fs';
import path from 'path';

const docs = allDocuments.map((d) => ({
  title: d.title,
  url: d.url,
  type: d.type,
}));

const dataArray = {
  routes: [
    ...[
      { title: 'Explore', url: '/app/home', type: 'app' },
      { title: 'Conquest', url: '/app/conquest', type: 'app' },
      { title: 'Citadel', url: '/app/citadel', type: 'app' },
      { title: 'Logout', type: 'app' },
      { title: 'Index', type: 'Page', url: '/' },
    ],
    ...docs,
  ],
};

const writeArrayToJsonFile = (filePath: string, data: any): void => {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf8');
    console.log(`Data successfully written to ${filePath}`);
  } catch (error) {
    console.error('Error writing to file:', error);
  }
};

const directoryPath = 'dist'

if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath, { recursive: true });
  console.log(`Directory created: ${directoryPath}`);
} else {
  console.log(`Directory already exists: ${directoryPath}`);
}

const filePaths = ['./routes.json', './dist/routes.json'];

filePaths.forEach((p) => {
  writeArrayToJsonFile(p, dataArray);
});
