const fs = require('fs')

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
  load (patternsFile, callback) {
      
    // Create a read stream
    const readStream = fs.createReadStream(patternsFile, {
      highWaterMark: 1024 * 1024, // Read 1MB chunks
      encoding: 'utf8'
    });

    const patterns = []
    // Handle each chunk of data
    let buffer = ''

    readStream.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep the last line, which may be incomplete
      lines.forEach((line) => {
        if (line === '[' || line === ']') {
          return
        }
        let lineStripped = line
        if (line[line.length - 1] === ',') {
          lineStripped = line.slice(0, -1)
        }
        const pattern = JSON.parse(lineStripped)
        patterns.push(pattern)
        if (!pattern.input || !pattern.output) {
          throw error 
        }
      })
    })

    readStream.on('end', () => {
      if (buffer) {
        console.log(patterns.length)
      }
      this.patterns = patterns
      callback(patterns)
    })
  
    // Handle any errors
    readStream.on('error', (err) => {
      console.error(err)
    })
  }

}

module.exports = PatternSet
