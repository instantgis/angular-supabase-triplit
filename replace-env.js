import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ONLY write to .generated directory
const tempEnvPath = path.join(__dirname, 'src/environments/.generated');
if (!fs.existsSync(tempEnvPath)) {
  fs.mkdirSync(tempEnvPath, { recursive: true });
}

// Read from template file
const templatePath = path.join(__dirname, 'src/environments/environment.template.ts');
const template = fs.readFileSync(templatePath, 'utf8');

// Generate files ONLY in .generated directory
const environments = {
  'environment.ts': { production: false },
  'environment.development.ts': { production: false },
  'environment.production.ts': { production: true }
};

Object.entries(environments).forEach(([fileName, config]) => {
  let content = template;
  
  // Replace environment-specific values
  content = content.replace('production: false', `production: ${config.production}`);
  
  // Replace environment variables
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

  // Write ONLY to .generated directory
  const outputPath = path.join(tempEnvPath, fileName);
  fs.writeFileSync(outputPath, content);
  console.log(`Generated ${fileName}`);
});


