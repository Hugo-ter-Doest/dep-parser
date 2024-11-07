/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import { actionVocab } from './Util.js'
import crypto from 'crypto'
import config from './Config.js'
import { error } from 'console'
const DEBUG = false

/*
function oneHotEncode(value, dictionary) {
  const dictionarySize = Object.keys(dictionary).length
  const vector = new Array(dictionarySize).fill(0);
  let index = dictionary[value]
  // If we find a POS tag that is not in the dictionary, use the index of NULL
  if (index === undefined) {
    index = dictionary['NULL']
  }
  DEBUG && console.log('Value: ', value, ' Index: ', index)
  vector[index] = 1
  return vector
}
*/

function oneHotEncode(value, dictionary) {
  const dictionarySize = Object.keys(dictionary).length
  const vector = new Array(dictionarySize).fill(0);
  let index = dictionary[value]
  if (index === undefined) {
    index = dictionary['NULL']
  }
  vector[index] = 1
  return vector
}

// Precondition: value is in the keys of the action vocabulary
function actionEncode(value, dictionary) {
  DEBUG && console.log('Action: ', value)
  const dictionarySize = Object.keys(dictionary).length
  const vector = new Array(dictionarySize).fill(0);
  vector[dictionary[value]] = 1
  DEBUG && console.log('Vector: ', vector)
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

const word2VecZeroVector = new Array(300).fill(0)
function word2vecVector(word, word2vecModel) {
  const vector = word2vecModel.getVector(word)
  if (vector !== null && vector.values !== undefined) {
    DEBUG && console.log(word, vector.values)
    return vector.values
  }
  return word2VecZeroVector
}

function getVector(word, models) {
  if (config.extraction.wordConversion === 'word2vec') {
    return word2vecVector(word, models.word2vecModel)
  } else if (config.extraction.wordConversion === 'hash') {
    return hashWordToNormalized(word, models.formVocab)
  }
}

// stackDepth can be 1 to 3
// bufferDepth can be 1 to 4
class Pattern {
  buildInputVector(stack, buffer, models) {
    const stackTop = stack[stack.length - 1] || { form: 'NULL', upostag: 'NULL' }
    const bufferFirst = buffer[0] || { form: 'NULL', upostag: 'NULL' }

    // Normalized hash for word form encoding (value between 0 and 1)
    const stackTopWord = getVector(stackTop.form, models)
    const bufferFirstWord = getVector(bufferFirst.form, models)
    
    // One-hot encoding for POS tags (example for a small tag set)
    const stackTopPOSTag = oneHotEncode(stackTop.upostag, models.upostagVocab)
    const bufferFirstPOSTag = oneHotEncode(bufferFirst.upostag, models.upostagVocab)
  
    // Combine all features into a single vector depending on depth parameters
    // Base is depth 1 for both stack and buffer
    this.input = [
      stackTopWord, ...stackTopPOSTag,
      bufferFirstWord, ...bufferFirstPOSTag
    ]
    if (config.extraction.stackDepth > 1) {
      const stackBelow = stack[stack.length - 2] || { form: 'NULL', upostag: 'NULL' }
      const stackBelowWord = getVector(stackBelow.form, models)
      const stackBelowPOSTag = oneHotEncode(stackBelow.upostag, models.upostagVocab)
      this.input = this.input.concat([stackBelowWord, ...stackBelowPOSTag])
    }
    if (config.extraction.stackDepth > 2) {
      const stack2Below = stack[stack.length - 3] || { form: 'NULL', upostag: 'NULL' }
      const stack2BelowWord = getVector(stack2Below.form, models)
      const stack2BelowPOSTag = oneHotEncode(stack2Below.upostag, models.upostagVocab)
      this.input = this.input.concat([stack2BelowWord, ...stack2BelowPOSTag])
    }
    if (config.extraction.bufferDepth > 1) {
      const bufferSecond = buffer[1] || { form: 'NULL', upostag: 'NULL' }
      const bufferSecondWord = getVector(bufferSecond.form, models)
      const bufferSecondTag = oneHotEncode(bufferSecond.upostag, models.upostagVocab)
      this.input = this.input.concat([bufferSecondWord, ...bufferSecondTag])
    }
    if (config.extraction.bufferDepth > 2) {
      const buffer3rd = buffer[2] || { form: 'NULL', upostag: 'NULL' }
      const buffer3rdWord = getVector(buffer3rd.form, models)
      const buffer3rdTag = oneHotEncode(buffer3rd.upostag, models.upostagVocab)
      this.input = this.input.concat([buffer3rdWord, ...buffer3rdTag])
    }
    if (config.extraction.bufferDepth > 3) {
      const buffer4th = buffer[3] || { form: 'NULL', upostag: 'NULL' }
      const buffer4thWord = getVector(buffer4th.form, models)
      const buffer4thTag = oneHotEncode(buffer4th.upostag, models.upostagVocab)
      this.input = this.input.concat([buffer4thWord, ...buffer4thTag])
    }
  }

  buildOutputVector(action) {
    DEBUG && console.log(action)
    this.output = actionEncode(action, actionVocab)
  }
}

export default Pattern
