/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import { actionVocab } from './Util.js'
import crypto from 'crypto'
import config from './Config.js'
const DEBUG = false

function oneHotEncode(value, dictionary) {
  const dictionarySize = Object.keys(dictionary).length
  const vector = new Array(dictionarySize).fill(0);
  const index = dictionary[value] || dictionary['NULL']
  vector[index] = 1
  return vector
}

// Hash function that normalizes the word encoding to a range between 0 and 1
function hashWordToNormalized(word, dictionary) {
  const vocabSize = Object.keys(dictionary).length;
  const hash = crypto.createHash('md5').update(word.toLowerCase()).digest('hex');
  // Convert the large hash string to a BigInt
  const hashedBigInt = BigInt('0x' + hash);  // '0x' denotes a hexadecimal number

  // Perform the modulo operation using BigInt
  const normalizedValue = Number(hashedBigInt % BigInt(vocabSize));  // Convert back to Number if needed
  DEBUG && console.log(word, normalizedValue);
  return normalizedValue / vocabSize;
}

// stackDepth can be 1, 2 or 3
// bufferDepth can be 1, 2 or 3
class Pattern {
  buildInputVector(stack, buffer, formVocab, upostagVocab) {
    const stackTop = stack[stack.length - 1] || { form: 'NULL', upostag: 'NULL' }
    const stackBelow = stack[stack.length - 2] || { form: 'NULL', upostag: 'NULL' }
    const stack2Below = stack[stack.length - 3] || { form: 'NULL', upostag: 'NULL' }
    const bufferFirst = buffer[0] || { form: 'NULL', upostag: 'NULL' }
    const bufferSecond = buffer[1] || { form: 'NULL', upostag: 'NULL' }
    const buffer3rd = buffer[2] || { form: 'NULL', upostag: 'NULL' }
    const buffer4th = buffer[3] || { form: 'NULL', upostag: 'NULL' }

    
    // Normalized hash for word form encoding (value between 0 and 1)
    const stackTopWord = hashWordToNormalized(stackTop.form, formVocab)
    const stackBelowWord = hashWordToNormalized(stackBelow.form, formVocab)
    const stack2BelowWord = hashWordToNormalized(stack2Below.form, formVocab)
    const bufferFirstWord = hashWordToNormalized(bufferFirst.form, formVocab)
    const bufferSecondWord = hashWordToNormalized(bufferSecond.form, formVocab)
    const buffer3rdWord = hashWordToNormalized(buffer3rd.form, formVocab)
    const buffer4thWord = hashWordToNormalized(buffer4th.form, formVocab)
    
    // One-hot encoding for POS tags (example for a small tag set)
    const stackTopPOSTag = oneHotEncode(stackTop.upostag, upostagVocab)
    const stackBelowPOSTag = oneHotEncode(stackBelow.upostag, upostagVocab)
    const stack2BelowPOSTag = oneHotEncode(stack2Below.upostag, upostagVocab)
    const bufferFirstPOSTag = oneHotEncode(bufferFirst.upostag, upostagVocab)
    const bufferSecondTag = oneHotEncode(bufferSecond.upostag, upostagVocab)
    const buffer3rdTag = oneHotEncode(buffer3rd.upostag, upostagVocab)
    const buffer4thTag = oneHotEncode(buffer4th.upostag, upostagVocab)
  
    // Combine all features into a single vector depending on depth parameters
    // Base is depth 1 for both stack and buffer
    this.input = [
      stackTopWord, ...stackTopPOSTag,
      bufferFirstWord, ...bufferFirstPOSTag
    ]
    if (config.stackDepth > 1) {
      this.input = this.input.concat([stackBelowWord, ...stackBelowPOSTag])
    }
    if (config.stackDepth > 2) {
      this.input = this.input.concat([stack2BelowWord, ...stack2BelowPOSTag])
    }
    if (config.bufferDepth > 1) {
      this.input = this.input.concat([bufferSecondWord, ...bufferSecondTag])
    }
    if (config.bufferDepth > 2) {
      this.input = this.input.concat([buffer3rdWord, ...buffer3rdTag])
    }
    if (config.bufferDepth > 3) {
      this.input = this.input.concat([buffer4thWord, ...buffer4thTag])
    }
  }

  buildOutputVector(action) {
    DEBUG && console.log(action)
    this.output = oneHotEncode(action, actionVocab)
  }
}

export default Pattern
