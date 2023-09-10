import './app'
import fs from 'fs';

//recursively import all files
function importFiles(directory: string) {
  const files = fs.readdirSync(`src/${directory}`);

  for (const file of files) {
    if (!file.endsWith('.ts')) return importFiles(directory + `/${file}`);
    import(`./${directory}/${file.slice(0, -3)}`);
  }
}

importFiles('routes');