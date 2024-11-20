/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import * as ConlluUtil from './Util.js'
import Pattern from './Pattern.js';
import config from './Config.js';

const DEBUG = false

class FeatureExtractor {
  constructor (corpus, word2vecModel) {
    this.word2vecModel = word2vecModel
    this.corpus = corpus
  }

  // Extract features and correct actions from sentences based on the gold-standard dependency tree
  extractTrainingData () {
    let trainingPatterns = []
    let nrSucces = 0
    let nrError = 0
    const failedSentences = []

    this.corpus.getSentences().forEach((sentence, index) => {
      let stack = [];
      let buffer = [...sentence.getTokens()]; // Copy the sentence tokens into buffer
      const sentenceTrainingPatterns = []
      let action = null
      const arcs = []

      try {
        while (buffer.length > 0 || stack.length > 1) {
          const trainingPattern = new Pattern()
          trainingPattern.buildInputVector(stack, buffer, {
            formVocab: this.corpus.formVocab,
            upostagVocab: this.corpus.upostagVocab,
            word2vecModel: this.word2vecModel
          })

          const top = stack[stack.length - 1]
          if (top && this.hasDependentsInBuffer(top, buffer)) {
            action = 'shift'
            this.shift(buffer, stack)
          } else if (stack.length > 1) {
            const below = stack[stack.length - 2]
            if (top.head === below.id) {
                action = 'leftArc'
                arcs.push(this.leftArc(stack))
            } else if (below.head === top.id) {
                action = 'rightArc'
                arcs.push(this.rightArc(stack))
            } else {
              action = 'shift'
              this.shift(buffer, stack)
            }
          } else {
            action = 'shift'
            this.shift(buffer, stack)
          }
          DEBUG && ConlluUtil.logState(sentence, stack, buffer, action, hasDependentsInBuffer)
          trainingPattern.buildOutputVector(action)
          sentenceTrainingPatterns.push(trainingPattern)
          DEBUG && console.log(trainingPattern)
        }
      } catch (error) {
        console.log(error.message)
      }
      const success = sentence.recallPrecision(arcs)
      if (success.recall === 1 && success.precision === 1) {
        nrSucces++
        trainingPatterns = trainingPatterns.concat(sentenceTrainingPatterns)
        console.log('Sentence: ' + index)
      } else {
        failedSentences.push(index)
        nrError++
      }
      DEBUG && ConlluUtil.logResult(success, sentenceTrainingPatterns)
    });

    console.log('Total number of sentences: ' + this.corpus.getSentences().length)
    console.log(`Succesfully processed ${nrSucces} sentences, ${nrError} failed.`)
    console.log('Percentage of successful sentences: ' + (nrSucces / this.corpus.getSentences().length * 100).toFixed(2) + '%')  
    console.log('Number of training patterns: ' + trainingPatterns.length)
    console.log('Vector size: ' + trainingPatterns[0].input.length)

    this.corpus.saveSubset(config.failedSentences, failedSentences)

    return trainingPatterns
  }

  // Method to check if the top of the stack has dependents in the buffer
  hasDependentsInBuffer(stackTop, buffer) {
    // Check if any token in the buffer is a dependent of the top of the stack
    return buffer.some(token => (token.head === stackTop.id));
  }

  // Shift method to move a token from buffer to stack
  shift(buffer, stack) {
      if (buffer.length === 0) {
          throw new Error('Shift operation failed: Buffer is empty');
      }
      stack.push(buffer.shift());
  }

  // LeftArc method to attach the top of the stack to the element below it (dependent ← head)
  leftArc(stack) {
      if (stack.length > 1) {
          const top = stack.pop();  // Pop top of the stack (dependent)
          const below = stack[stack.length - 1];  // The token below the top (head)
          return { head: below.id, dependent: top.id }
      }
  }

  // RightArc method to attach the element below the top to the top of the stack (head → dependent)
  rightArc(stack) {
      if (stack.length > 1) {
          const top = stack[stack.length - 1];   // Top of the stack (head)
          const below = stack.splice(stack.length - 2, 1)[0];  // Remove below (dependent)
          return { head: top.id, dependent: below.id }
      }
  }

  // Swap method to swap tokens in buffer
  swap(stack, buffer) {
    if (buffer.length > 1) {
        const tmp = buffer[0]
        buffer[0] = buffer[1]
        buffer[1] = tmp
    }  
  }

  nextBufferItemIsRelated(top, buffer) {
    if (buffer.length > 1 ) {
      return buffer[1].head === top.id || top.head === buffer[1].id
    }
    return false
  }

  // Detect which indices in the stack and buffer should be swapped
  detectSwapIndices(stack, buffer) {
    if (stack.length > 1) {
      // Step 1: Check for crossing dependencies with the top of the stack
      const firstBufferToken = buffer[0];
      const belowIndex = stack.length - 2;  // Index of S2 (second-top of the stack)
      const below = stack[belowIndex];      // S2 (second-top of the stack)
      if (firstBufferToken && (firstBufferToken.head === below.id || below.head === firstBufferToken.id)) {
        return { stackIndex: belowIndex, bufferIndex: 0 };  // Swap S2 and B1
      }
      // Step 2: Iterate over buffer 
      for (let sIndex = stack.length - 1; sIndex >= 0; sIndex--) {
        // Check for crossing dependencies with deeper buffer tokens
        for (let bIndex = 1; bIndex < buffer.length; bIndex++) {
          const stackToken = stack[sIndex]
          const bufferToken = buffer[bIndex]

          // If the dependency is crossing, return these indices for swapping
          if (this.crosses(stackToken, bufferToken)) {
            return { stackIndex: sIndex, bufferIndex: bIndex }
          }
        }
      }
    }
    return null
  }

  crosses(token1, token2) {
    const min1 = Math.min(token1.id, token1.head);
    const max1 = Math.max(token1.id, token1.head);
    
    const min2 = Math.min(token2.id, token2.head);
    const max2 = Math.max(token2.id, token2.head);

    // The arcs cross if the ranges [min1, max1] and [min2, max2] overlap but are not fully contained within each other
    return (min1 < min2 && max1 > min2 && max1 < max2) || (min2 < min1 && max2 > min1 && max2 < max1);
  }

}

export default FeatureExtractor
