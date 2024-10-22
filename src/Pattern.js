/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import { actionVocab } from './Util.js';
import crypto from 'crypto';
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

class Pattern {
  buildInputVector(stack, buffer, formVocab, upostagVocab) {
    const stackTop = stack[stack.length - 1] || { form: 'NULL', upostag: 'NULL' }
    const stackBelow = stack[stack.length - 2] || { form: 'NULL', upostag: 'NULL' }
    const bufferFirst = buffer[0] || { form: 'NULL', upostag: 'NULL' }
    const bufferSecond = buffer[1] || { form: 'NULL', upostag: 'NULL' }
  
    // Normalized hash for word form encoding (value between 0 and 1)
    const stackTopWord = hashWordToNormalized(stackTop.form, formVocab)
    const stackBelowWord = hashWordToNormalized(stackBelow.form, formVocab)
    const bufferFirstWord = hashWordToNormalized(bufferFirst.form, formVocab)
    const bufferSecondWord = hashWordToNormalized(bufferSecond.form, formVocab)
  
    // One-hot encoding for POS tags (example for a small tag set)
    const stackTopPOSTag = oneHotEncode(stackTop.upostag, upostagVocab)
    const stackBelowPOSTag = oneHotEncode(stackBelow.upostag, upostagVocab)
    const bufferFirstPOSTag = oneHotEncode(bufferFirst.upostag, upostagVocab)
    const bufferSecondTag = oneHotEncode(bufferSecond.upostag, upostagVocab)
  
    // Combine all features into a single vector
    this.input = [
      stackTopWord, stackBelowWord, 
      ...stackTopPOSTag, ...stackBelowPOSTag,  // Stack features (normalized word encoding + POS tag)
      bufferFirstWord, bufferSecondWord, 
      ...bufferFirstPOSTag, ...bufferSecondTag // Buffer features (normalized word encoding + POS tag)
    ]
  }

  buildOutputVector(action) {
    DEBUG && console.log(action)
    this.output = oneHotEncode(action, actionVocab)
  }
}

  export default Pattern
  