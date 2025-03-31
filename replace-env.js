import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log the values (for debugging)
console.log('Environment variables:', {
  TRIPLIT_DB_URL: process.env.TRIPLIT_DB_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
});

// List of environment files to update
const environmentFiles = [
  'src/environments/environment.ts',
  'src/environments/environment.development.ts',
  'src/environments/environment.production.ts'
];

environmentFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  const replacements = {
    '__TRIPLIT_SERVER_URL__': process.env.TRIPLIT_DB_URL || '',
    '__SUPABASE_URL__': process.env.SUPABASE_URL || '',
    '__SUPABASE_KEY__': process.env.SUPABASE_KEY || ''
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    if (!value) {
      console.error(`Warning: No value found for ${placeholder}`);
    }
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });

  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${filePath}`);
});

