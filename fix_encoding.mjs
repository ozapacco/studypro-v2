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

function fixMojibake(filePath) {
  const ext = path.extname(filePath);
  if (!['.tsx', '.ts', '.md', '.json'].includes(ext)) return;
  
  let original = fs.readFileSync(filePath, 'utf8');
  let current = original;

  // We loop to fix cases of triple encoding
  for (let i = 0; i < 3; i++) {
    // If it contains "Ã", try to decode it
    if (current.includes('Ã')) {
      try {
        // Convert the string's characters to latin1 bytes, then read back as UTF-8
        let candidate = Buffer.from(current, 'latin1').toString('utf8');
        // A successful decode won't have replacement characters (ï¿½) 
        if (!candidate.includes('')) {
          current = candidate;
        } else {
          // If decoding introduces replacement chars, we stop decoding further
          break;
        }
      } catch (e) {
        break;
      }
    } else {
      break;
    }
  }
  
  // Specific fallback for cases where Latin1 conversion drops bytes or fails
  // Mapping common corruptions back to their original characters manually if still present
  const mappings = {
    'Ã£': 'ã', 'Ã¡': 'á', 'Ã¢': 'â', 'Ã': 'à', 'Ã©': 'é', 
    'Ãª': 'ê', 'Ã­': 'í', 'Ã³': 'ó', 'Ã´': 'ô', 'Ãµ': 'õ', 
    'Ãº': 'ú', 'Ã§': 'ç', 'Ãƒ': 'Ã', 'Ã': 'Á', 'Ã‚': 'Â', 
    'Ã‰': 'É', 'ÃŠ': 'Ê', 'Ã': 'Í', 'Ã“': 'Ó', 'Ã”': 'Ô', 
    'Ã•': 'Õ', 'Ãš': 'Ú', 'Ã‡': 'Ç', 'ðŸ‘‹': '👋', 'Â': '',
    'Ã”': 'Ô', 'AÃ‡ÃƒO': 'AÇÃO', 'MÃ£o': 'Mão'
  };

  for (const [bad, good] of Object.entries(mappings)) {
    if (current.includes(bad)) {
      current = current.split(bad).join(good);
    }
  }

  // Also replace weird trailing `Â` that often appear when Latin1 is converted
  current = current.replace(/Â/g, ''); 

  // Fix "CONSTÂNCNCIA" -> "CONSTÂNCIA" as seen on the screenshot user reported
  current = current.replace(/CONST.?NCIA/ig, 'CONSTÂNCIA');
  current = current.replace(/M..?DIO/g, 'MÉDIO');
  current = current.replace(/REFOR..?O/g, 'REFORÇO');
  current = current.replace(/Gl..ria/g, 'Glória');

  if (current !== original) {
    fs.writeFileSync(filePath, current, 'utf8');
    console.log('Fixed encoding in:', filePath);
  }
}

console.log('Searching and fixing Mojibake encoding...');
walkDir('./web/src', fixMojibake);
walkDir('./docs', fixMojibake);
walkDir('./@docs', fixMojibake);
console.log('Done.');
