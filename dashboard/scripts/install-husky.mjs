import path from 'node:path';
import { fileURLToPath } from 'node:url';
import husky from 'husky';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

process.chdir(repoRoot);

const result = husky('.husky');

if (result) {
  console.log(result);
}
