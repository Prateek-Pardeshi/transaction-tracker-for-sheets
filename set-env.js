const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/environments/environment.prod.ts');

const googleClientId = process.env.googleClientId;
const googleClientSecret = process.env.googleClientSecret;

const envConfigFile = `
export const environment = {
  production: true,
  googleClientId: '${googleClientId}',
  googleClientSecret: '${googleClientSecret}'
};
`;

fs.writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });
console.log(`Environment file ${targetPath} generated successfully.`);
