/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import crypto from 'crypto';
const DEBUG = false

let actionVocab = { 'shift': 0, 'leftArc': 1, 'rightArc': 2 };

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

export {
  completelyParsed,
  logState,
  logResult,
  actionVocab
}
