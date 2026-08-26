/**
 * Scelle les données de la caisse avant qu'elles n'entrent dans le dépôt.
 *
 *   npm run seal
 *
 * Lit `data/fund.seed.json` — le fichier en clair, jamais versionné — et écrit
 * `src/data/sealedFund.ts`, qui ne contient que du chiffré et peut donc partir
 * sur un dépôt public.
 *
 * La phrase est demandée à la saisie, ou passée par la variable
 * d'environnement FAMILI_PASSPHRASE pour un usage automatisé.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { webcrypto } from 'node:crypto';
import { stdin, stdout, exit } from 'node:process';

const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

const SEED = new URL('../data/fund.seed.json', import.meta.url);
const OUTPUT = new URL('../src/data/sealedFund.ts', import.meta.url);

// Déstructurer `webcrypto` détacherait les méthodes de leur objet (ERR_INVALID_THIS).
const { subtle } = webcrypto;
const randomBytes = (length) => webcrypto.getRandomValues(new Uint8Array(length));

async function askPassphrase() {
  if (process.env.FAMILI_PASSPHRASE) return process.env.FAMILI_PASSPHRASE;

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question('Phrase de la famille : ');
    return answer.trim();
  } finally {
    rl.close();
  }
}

async function deriveKey(passphrase, salt) {
  const material = await subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

const passphrase = await askPassphrase();
if (passphrase.length < 4) {
  console.error('Phrase trop courte : au moins 4 caractères.');
  exit(1);
}

const seed = JSON.parse(await readFile(SEED, 'utf8'));

const salt = randomBytes(SALT_BYTES);
const iv = randomBytes(IV_BYTES);
const key = await deriveKey(passphrase, salt);

const payload = new Uint8Array(
  await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(seed))),
);

// sel + vecteur d'initialisation + chiffré, dans cet ordre : tout tient en une chaîne.
const sealed = Buffer.concat([salt, iv, payload]).toString('base64');

await writeFile(
  OUTPUT,
  `/*
 * Données de la caisse, scellées. Fichier ENGENDRÉ — ne pas modifier à la main.
 *
 * Régénérer après toute modification de \`data/fund.seed.json\` :
 *
 *   npm run seal
 *
 * Le clair vit dans \`data/\`, qui n'est pas versionné. Ici il n'y a que du
 * chiffré : ce fichier peut partir sur un dépôt public sans rien révéler.
 */
export const SEALED_FUND =
  '${sealed}';
`,
  'utf8',
);

const { members = [], contributions = [], expenses = [] } = seed;
console.log(
  `Scellé : ${members.length} membres, ${contributions.length} entrées, ${expenses.length} sorties`,
);
console.log(`→ ${OUTPUT.pathname} (${sealed.length} caractères)`);
