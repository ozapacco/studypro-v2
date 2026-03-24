import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function fixEncoding(filePath) {
  const ext = path.extname(filePath);
  if (!['.tsx', '.ts', '.md', '.json'].includes(ext)) return;
  
  const content = fs.readFileSync(filePath, 'binary'); // read as binary string (latin1 mapped to 0-255)
  // Check if it has suspicious sequences like 'Ã£' (which is 0xC3 0xA3 in binary string)
  if (content.includes('Ã')) {
     try {
       // Convert from "binary" string back to authentic UTF-8
       const fixedContent = Buffer.from(content, 'binary').toString('utf8');
       // Only write if there are valid Portuguese accents resulting from it
       if (fixedContent.match(/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/)) {
          fs.writeFileSync(filePath, fixedContent, 'utf8');
          console.log('Fixo o encoding em:', filePath);
       }
     } catch (e) {
       console.log('Skipping due to decode error:', filePath);
     }
  }
}

console.log('Buscando e arrumando encoding defeituoso no repositório...');
walkDir('./web/src', fixEncoding);
walkDir('./docs', fixEncoding);
walkDir('./@docs', fixEncoding);
console.log('Concluído.');
