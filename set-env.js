const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/environments/environment.prod.ts');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleProjectId = process.env.GOOGLE_PROJECT_ID;

const envConfigFile = `
export const environment = {
  production: true,
  googleClientId: '${googleClientId}',
  googleClientSecret: '${googleClientSecret}',
  googleProjectId: '${googleProjectId}'
};
`;

fs.writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });
console.log(`Environment file ${targetPath} generated successfully.`);
