// Function to parse a CoNLL-U file and return sentences as arrays of token objects
import crypto from 'crypto';
const DEBUG = false

// Vocabularies for encoding
let actionVocab = { 'shift': 0, 'leftArc': 1, 'rightArc': 2, 'swap': 3 };

function printDependencyTree(parsedSentence) {
    const tree = {};

    // Step 1: Build a tree structure where each head has an array of dependents
    parsedSentence.forEach(token => {
        const head = token.head;  // The governing word (head)
        const dependent = token.id;  // The dependent word (current token)

        if (!tree[head]) {
            tree[head] = [];
        }
        tree[head].push(dependent);  // Add this token as a dependent of the head
    });

    // Step 2: Recursive function to print the tree
    const printTree = (nodeId, level = 0) => {
        const indent = '  '.repeat(level);  // Indentation for tree levels
        const token = parsedSentence.find(t => t.id === nodeId);  // Get the token by its ID
        console.log(`${indent}${token.form} (${token.deprel})`);  // Print the word and its dependency relation

        // If the current node has dependents, recursively print them
        if (tree[nodeId]) {
            tree[nodeId].forEach(childId => printTree(childId, level + 1));
        }
    };

    // Step 3: Start by finding the root (the token whose head is 0)
    const root = parsedSentence.find(token => token.head === 0);
    printTree(root.id);
}

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

// Calculates recall and precision of recognized arcs
function recallPrecision (sentence, parsedArcs) {
  // determine arcs of sentence
  const sentenceArcs = getArcs(sentence)

  // Log the sentence and parsed arcs
  console.log('Sentence:', sentenceArcs)
  console.log('Parsed:', parsedArcs)

  let correctArcsInParse = 0
  // Compare arcs of sentence with arcs of parsed sentence
  sentenceArcs.forEach(sentArc => {
    parsedArcs.forEach(parsedArc => {
      if (sentArc.head === parsedArc.head &&
        sentArc.dependent === parsedArc.dependent) {
        correctArcsInParse++
      }
    })
  })
  if (sentenceArcs.length === 0 || parsedArcs.length === 0) {
    return({
      precision: 0,
      recall: 0
    })
  }
  return {
    precision: correctArcsInParse / parsedArcs.length,
    recall: correctArcsInParse / sentenceArcs.length
  }
}

function getArcs (sentence) {
  // Create a list of all dependency arcs in the sentence
  const arcs = []
  
  // For each token, get the head and its dependent (the token itself)
  sentence.forEach(token => {
    const head = token.head  // ID of the head (parent) of this token
    const dependent = token.id  // ID of the token (dependent)
    
    // Ignore root tokens (head == 0)
    if (head !== 0) {
      const arc = { head: head, dependent: dependent }
      arcs.push(arc)
    }
  })
  return arcs
}

function hasNonProjectiveStructure(sentence) {
    // Create a list of all dependency arcs in the sentence
    const arcs = getArcs(sentence)
    
    // Compare all pairs of arcs to see if any cross
    for (let i = 0; i < arcs.length; i++) {
      for (let j = i + 1; j < arcs.length; j++) {
        const arc1 = arcs[i];
        const arc2 = arcs[j];
        
        // Check if arc1 and arc2 cross
        if (arcsCross(arc1, arc2)) {
          // The sentence has a non-projective structure
          // Return the arcs
          return {arc1, arc2}
        }
      }
    }
    
    // No crossing arcs found, so the sentence is projective
    return null
}

// Method to check if two arcs cross
function arcsCross(arc1, arc2) {
    const [A1, B1] = [Math.min(arc1.head, arc1.dependent), Math.max(arc1.head, arc1.dependent)];
    const [A2, B2] = [Math.min(arc2.head, arc2.dependent), Math.max(arc2.head, arc2.dependent)];

    // Arcs cross if they overlap but are not nested
    return (A1 < A2 && A2 < B1 && B1 < B2) || (A2 < A1 && A1 < B2 && B2 < B1);
}

const green = '\x1b[32m'
const red = '\x1b[31m'
const reset = '\x1b[0m'

function logState (sentence, stack, buffer, action, swapIndexes, hasDependentsInBuffer) {
    const flag = '=========================================================================================';
    // const sentenceString =    'SENTENCE: [' + (sentence.map(token => token.form).join(' ')) +']'
    const sentenceString =    'SENTENCE: ' + red + '[' + reset + (sentence.map(token => token.form).join(' ')) + red + ']' + reset
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
  printDependencyTree,
  completelyParsed,
  hasNonProjectiveStructure,
  logState,
  logResult,
  extractFeatures,
  encodeAction,
  actionVocab,
  recallPrecision
}
