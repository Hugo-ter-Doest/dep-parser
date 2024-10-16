import * as ConlluUtil from './ConlluUtil.js'
import config from './Config.js'

const DEBUG = false

class FeatureExtractor {
  constructor (corpus) {
    this.corpus = corpus
  }

  // Extract features and correct actions from sentences based on the gold-standard dependency tree
  extractTrainingData () {
    let trainingPatterns = []
    let nrSucces = 0
    let nrError = 0
    let nrNonProjectiveSentences = 0
    let nrNonProjective = 0
    const failedSentences = []

    this.corpus.getSentences().forEach((sentence, index) => {
        if (ConlluUtil.hasNonProjectiveStructure(sentence)) {
          nrNonProjectiveSentences++
          // return
        }
        let stack = [];
        let buffer = [...sentence]; // Copy the sentence tokens into buffer
        const sentenceTrainingPatterns = []
        let action = null
        const arcs = []
        let hasDependentsInBuffer = false

        try {
            while (buffer.length > 0 || stack.length > 1) {
                const trainingPattern = {}
                trainingPattern.input = ConlluUtil.extractFeatures(stack, buffer, this.corpus.formVocab, this.corpus.upostagVocab)
                const swapIndexes = this.detectSwapIndices(stack, buffer);
                if (swapIndexes) {
                  nrNonProjective++
                }
                // Prioritize leftArc, rightArc, and shift before swap
                if (stack.length > 1) {
                  const top = stack[stack.length - 1];   // Top of the stack (dependent)
                  const below = stack[stack.length - 2]; // Below the top (head)

                  // If there are dependents of the top of the stack in the buffer, keep shifting
                  hasDependentsInBuffer = this.hasDependentsInBuffer(top, buffer);
                  if (hasDependentsInBuffer) {
                    action = 'shift'
                    this.shift(buffer, stack);  // Shift token from buffer to stack
                  }
                  // Prioritize leftArc
                  else if (top.head === below.id) {
                      action = 'leftArc'  // Label as leftArc
                      this.leftArc(stack, arcs);  // Perform leftArc
                  }
                  // Prioritize rightArc
                  else if (below.head === top.id) {
                      action = 'rightArc'  // Label as rightArc
                      this.rightArc(stack, arcs);  // Perform rightArc
                  }
                  // Otherwise, shift from the buffer
                  else if (buffer.length > 0) {
                      action = 'shift'  // Label as shift
                      this.shift(buffer, stack);  // Shift token from buffer to stack
                  }
                  // If none of the above can be applied, check for swap
                  else {
                      if (swapIndexes) {
                          const { stackIndex, bufferIndex } = swapIndexes;
                          action = 'swap' // Label as swap action
                          this.swap(stackIndex, bufferIndex, stack, buffer);
                      } else {
                          // Handle edge case if no valid actions are left
                          throw new Error('No valid actions available');
                      }
                  }
                } else {
                  // When stack has 1 or fewer elements, prioritize shift
                  action = 'shift'  // Label as shift
                  this.shift(buffer, stack);
                }
                DEBUG && ConlluUtil.logState(sentence, stack, buffer, action, swapIndexes, hasDependentsInBuffer)
                trainingPattern.output = ConlluUtil.encodeAction(action)
                sentenceTrainingPatterns.push(trainingPattern)
                DEBUG && console.log(trainingPattern)
            }
          } catch (error) {
            console.error(`Error while parsing sentence ${index}: ${error.message}`);
          }
          const success = ConlluUtil.succesfullyProcessed(stack, buffer)
          // Only record features and actions for successful sentences
          if (success) {
            nrSucces++
            trainingPatterns = trainingPatterns.concat(sentenceTrainingPatterns)
            !DEBUG && console.log('Sentence: ' + index)
          } else {
            failedSentences.push(index)
            nrError++
          }
          DEBUG && ConlluUtil.logResult(success, sentenceTrainingPatterns)
    });

    DEBUG && console.log('Total number of sentences: ' + this.corpus.getSentences().length)
    DEBUG && console.log(`Succesfully processed ${nrSucces} sentences, ${nrError} failed.`)
    DEBUG && console.log('Number of non-projective sentences: ' + nrNonProjectiveSentences)
    DEBUG && console.log('Number of non-projective constructs detected: ' + nrNonProjective)
    DEBUG && console.log('Percentage of successful sentences: ' + (nrSucces / this.corpus.getSentences().length * 100).toFixed(2) + '%')  
    DEBUG && console.log('Number of training patterns: ' + trainingPatterns.length)
    DEBUG && console.log('Vector size: ' + trainingPatterns[0].input.length)

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
  leftArc(stack, arcs) {
      if (stack.length > 1) {
          const top = stack.pop();  // Pop top of the stack (dependent)
          const below = stack[stack.length - 1];  // The token below the top (head)
          arcs.push({ head: below.id, dependent: top.id });  // Create left arc
      }
  }

  // RightArc method to attach the element below the top to the top of the stack (head → dependent)
  rightArc(stack, arcs) {
      if (stack.length > 1) {
          const top = stack[stack.length - 1];   // Top of the stack (head)
          const below = stack.splice(stack.length - 2, 1)[0];  // Remove below (dependent)
          arcs.push({ head: top.id, dependent: below.id });  // Create right arc
      }
  }

  // Swap method to swap tokens in the stack and buffer
    swap(stackIndex, bufferIndex, stack, buffer) {
        if (stack.length > 1 && buffer.length > 0) {
            const tmp = stack[stackIndex];  // Temporarily hold the stack element
            stack[stackIndex] = buffer[bufferIndex];  // Move buffer element to stack
            buffer[bufferIndex] = tmp;  // Move stack element to buffer
        } else {
            throw new Error('Swap operation failed: Stack or buffer does not have enough elements');
        }
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
