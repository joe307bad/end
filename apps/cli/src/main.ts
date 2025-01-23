import { allDocuments } from 'contentlayer/generated';
import * as fs from 'fs';

// Example array to write
const dataArray = {
  routes: allDocuments.map((d) => ({
    title: d.title,
    url: d.url,
  })),
};

// Function to write the array to a JSON file
const writeArrayToJsonFile = (filePath: string, data: any): void => {
  try {
    const jsonContent = JSON.stringify(data, null, 2); // Pretty-print with 2 spaces
    fs.writeFileSync(filePath, jsonContent, 'utf8');
    console.log(`Data successfully written to ${filePath}`);
  } catch (error) {
    console.error('Error writing to file:', error);
  }
};

// Specify the file path
const filePath = './routes.json';

// Call the function
writeArrayToJsonFile(filePath, dataArray);
