const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/environments/environment.prod.ts');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const envConfigFile = `
export const environment = {
  production: true,
  GOOGLE_CLIENT_ID: '${googleClientId}',
  GOOGLE_CLIENT_SECRET: '${googleClientSecret}'
};
`;

fs.writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });
console.log(`Environment file ${targetPath} generated successfully.`);
