/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

// Function to parse a CoNLL-U file and return sentences as arrays of token objects
import crypto from 'crypto';
const DEBUG = false

// Vocabularies for encoding
let actionVocab = { 'shift': 0, 'leftArc': 1, 'rightArc': 2, 'swap': 3 };

/**
 * Checks whether the parser has succesfully processed the sentence.
 * A parse is considered succesful if the stack contains only one element (the root),
 * the buffer is empty and the root has no head.
 * @param {Array} stack - The stack of tokens.
 * @param {Array} buffer - The buffer of tokens.
 * @returns {boolean} True if the parse was succesful, false otherwise.
 */
function completelyParsed(stack, buffer) {
    return ((stack.length === 1) && // Only one element is the root
    (buffer.length === 0) && // Buffer is fully processed
    (stack[0].head === 0)) // The root had no head
}

const green = '\x1b[32m'
const red = '\x1b[31m'
const reset = '\x1b[0m'

function logState (sentence, stack, buffer, action, swapIndexes, hasDependentsInBuffer) {
    const flag = '=========================================================================================';
    // const sentenceString =    'SENTENCE: [' + (sentence.map(token => token.form).join(' ')) +']'
    const sentenceString =    'SENTENCE: ' + red + '[' + reset + (sentence.getTokens().map(token => token.form).join(' ')) + red + ']' + reset
    // const stackString =       'STACK:    ' + '[' + stack.map(token => "\"" + token.form + "\"").join(', ') + '>'
    const stackString =       'STACK:    ' + red +  '[' + reset + stack.map(token => "\"" + token.form + "\"").join(', ') + red + '>' + reset
    // const bufferString =      'BUFFER:   ' + '<' + buffer.map(token => "\"" + token.form + "\"").join(', ') + ']'
    const bufferString =      'BUFFER:   ' + red + '<' + reset + buffer.map(token => "\"" + token.form + "\"").join(', ') + red +']' + reset
    const actionString =      'ACTION:   ' + action + (hasDependentsInBuffer ? ' (HAS DEPENDENTS IN BUFFER)' : '')
    const swapIndexesString = ((swapIndexes !== null) ? ' | SWAP: ' + JSON.stringify(swapIndexes) : '')
    console.log(`${flag}\n${sentenceString}\n${actionString}${swapIndexesString}\n${stackString}\n${bufferString}`)
}

function logResult (success, actions) {
    const flag = '=========================================================================================';
    console.log(`${flag}\n${success ? 'SUCCESS' : 'FAILURE'}\nPARSE: ${actions}`)
}

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

function extractFeatures(stack, buffer, formVocab, upostagVocab) {
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
  return [
    stackTopWord, stackBelowWord, 
    ...stackTopPOSTag, ...stackBelowPOSTag,  // Stack features (normalized word encoding + POS tag)
    bufferFirstWord, bufferSecondWord, 
    ...bufferFirstPOSTag, ...bufferSecondTag // Buffer features (normalized word encoding + POS tag)
  ]
}

function encodeAction (action) {
  DEBUG && console.log(action)
  return oneHotEncode(action, actionVocab);
}

export {
  completelyParsed,
  logState,
  logResult,
  extractFeatures,
  encodeAction,
  actionVocab
}
