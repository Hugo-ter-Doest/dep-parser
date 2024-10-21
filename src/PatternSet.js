/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import fs from 'fs'

class PatternSet {
  constructor (patterns) {
    if (patterns) {
      this.patterns = patterns
    }
  }

  getPatterns () {
    return this.patterns
  }

  save (patternsFile,callback) {
    const fileStream = fs.createWriteStream(patternsFile, {
      encoding: 'utf8'
    })
  
    fileStream.write('[\n')
    this.patterns.forEach( (pattern, index) => {
      fileStream.write(JSON.stringify(pattern))
      if (index !== this.patterns.length - 1 ) {
          fileStream.write(',\n')
      }
    })
    fileStream.write('\n]')
    fileStream.end()
  
    fileStream.on('finish', () => {
      // trainer.corpus.saveVocabularies(config.formFile, config.lemmaFile, config.upostagFile)
      console.log('Data appended to file successfully.')
      callback()
    });
  
    fileStream.on('error', (err) => {
      console.error('Error appending to file:', err)
    });    
  }

  // Read the file with patterns
  async load(patternsFile) {
    // Create a read stream
    const readStream = fs.createReadStream(patternsFile, {
      highWaterMark: 1024 * 1024, // Read 1MB chunks
      encoding: 'utf8'
    });
  
    const patterns = [];
    let buffer = '';
  
    return new Promise((resolve, reject) => {
      readStream.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep the last line, which may be incomplete
        lines.forEach((line) => {
          if (line === '[' || line === ']') {
            return;
          }
          let lineStripped = line;
          if (line[line.length - 1] === ',') {
            lineStripped = line.slice(0, -1);
          }
          const pattern = JSON.parse(lineStripped);
          patterns.push(pattern);
          if (!pattern.input || !pattern.output) {
            reject(new Error('Invalid pattern'));
          }
        });
      });
  
      readStream.on('end', () => {
        if (buffer) {
          console.log(patterns.length);
        }
        this.patterns = patterns;
        resolve(patterns);
      });
  
      readStream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export default PatternSet
