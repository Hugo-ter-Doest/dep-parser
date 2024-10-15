const tf = require('@tensorflow/tfjs-node')

const { extractFeatures,
  actionVocab,
  logState
} = require('./ConlluUtil')

const DEBUG = true

class ShiftReduceParser {

  constructor(model, corpus) {
      this.stack = [];
      this.buffer = []
      this.arcs = []
      this.model = model
      this.corpus = corpus
  }

  /**
   * Initializes the parser with a sentence.
   * The sentence is shallow copied to avoid modifying the original.
   * The stack and arcs are reset to empty arrays.
   * @param {Object[]} sentence - The sentence to parse.
   */
  initialize (sentence) {
      this.stack = [];
      this.buffer = [...sentence];  // Shallow copy of the sentence to avoid modifying the original
      this.arcs = [];
      // this.shift()
      // this.shift()
  }

  /**
   * Shifts the first element of the buffer onto the stack.
   * @returns {boolean} True if a token was shifted, false otherwise.
   */
  shift () {
    if (this.buffer.length > 0) {
      this.stack.push(this.buffer.shift())
      return true
    }
    return false
  }

  leftArc () {
    if (this.stack.length > 1) {
      const below = this.stack[this.stack.length - 1]
      const top = this.stack.pop()
      this.arcs.push({ head: below.head, dependent: top.id })
      return true
    }
    return false
  }

  rightArc () {
    if (this.stack.length > 1) {
      const top = this.stack[this.stack.length - 1]
      const below = this.stack[this.stack.length - 2]
      this.arcs.push({ head: top.head, dependent: below.id })
      // Pop the token below the top of the stack
      this.stack.splice(this.stack.length - 2, 1)
      return true
    }
    return false
  }

  getAction (stack, buffer) {
    const features = extractFeatures(stack, buffer, this.corpus.getFormVoca(), this.corpus.getUpostagVoca())
    const actions = Object.keys(actionVocab)

    const inputSample = tf.tensor2d(features, [1, features.length])

    const scores = this.model.predict(inputSample).dataSync()
    console.log(scores)

    const { maxValue, maxIndex } = scores.reduce((acc, current, index) => {
      if (current > acc.maxValue) {
        return { maxValue: current, maxIndex: index }
      }
      return acc
    }, { maxValue: -Infinity, maxIndex: -1 })
    return actions[maxIndex]
  }

  // A method that returns the four possible actions sorted by probability
  getSortedActions (stack, buffer) {
    const actions = Object.keys(actionVocab)
    const features = extractFeatures(stack, buffer, this.corpus.getFormVoca(), this.corpus.getUpostagVoca())
    const inputSample = tf.tensor2d(features, [1, features.length])
    const scores = this.model.predict(inputSample).dataSync()
    // Return the four possible actions sorted by probability
    return actions
      .map((action, index) => ({ action, score: scores[index] }))
      .sort((a, b) => b.score - a.score)
  }

  ExecAction(action) {
    switch (action) {
      case 'shift':
        return this.shift()
      case 'leftArc':
        return this.leftArc()
      case 'rightArc':
        return this.rightArc()
      case 'swap':
        return false
      default:
        throw new Error('Invalid action: ' + action)
    }
  }

  parse (sentence) {
    this.initialize(sentence);
    while (this.buffer.length > 0 || this.stack.length > 1) {
      let actions = null
      let action = null
      if (this.stack.length < 2 && this.buffer.length > 0) {
        action = 'shift'
      } else {
        actions = this.getSortedActions(this.stack, this.buffer)
        DEBUG && console.log(actions)
        action = actions[0].action
      }

      if (!this.ExecAction(action)) {
        // Try the next best action
        action = actions[1].action
        if (!this.ExecAction(action)) {
          // try the next best action
          action = actions[2].action
          if (!this.ExecAction(action)) {
            // try the next best action
            action = actions[3].action
            if (!this.ExecAction(action)) {
              return({
                stack: this.stack, 
                buffer: this.buffer, 
                arcs: this.arcs})
              }
            }
          }
        }
      DEBUG && logState(sentence, this.stack, this.buffer, action)
    }
    return({
      stack: this.stack, 
      buffer: this.buffer, 
      arcs: this.arcs})
  }
}

module.exports = ShiftReduceParser
