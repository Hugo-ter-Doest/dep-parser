const fs = require('fs')
const tf = require('@tensorflow/tfjs-node')
const ConlluUtil = require('./ConlluUtil')
const Corpus = require('./Corpus')
const ShiftReduceParser = require('./ShiftReduceParser')

const config = require('./Config')

// Load the model
tf.loadLayersModel(config.modelFile)
  .then(model => {
    console.log('Model loaded!');
    test(model)
  })
  .catch(err => {
    console.error(err)
  })

function test (classifier) {
  // Test the model on a new sentence
  const corpus = new Corpus()
  corpus.load(config.corpusTest, false)
  corpus.loadVocabularies(config.formFile, config.lemmaFile, config.upostagFile)
  
  // Instantiate the parser with the trained model
  const parser = new ShiftReduceParser(classifier, corpus)

  let nrSuccess = 0
  let recallSum = 0
  let precisionSum = 0
  // Parse the test sentence
  corpus.getSentences().forEach(s => {
    const { stack, buffer, arcs } = parser.parse(s)
    if (ConlluUtil.succesfullyProcessed(stack, buffer)) {
      nrSuccess++
    }
    const result = ConlluUtil.recallPrecision(s, arcs)
    if (result) {
      recallSum += result.recall
      precisionSum += result.precision
      console.log('Recall:', result.recall, 'Precision:', result.precision)
    }
  })

  const nrSentences = corpus.getSentences().length
  const percentageSuccess = (nrSuccess / nrSentences * 100).toFixed(2)
  const averageRecall = (recallSum / nrSentences * 100).toFixed(2)
  const averagePrecision = (precisionSum / nrSentences * 100).toFixed(2)

  config.results = {
    successRate: percentageSuccess,
    averageRecall: averageRecall,
    averagePrecision: averagePrecision
  }

  // Save the results
  fs.writeFileSync(config.testResultsFile, JSON.stringify(config, null, 2))

  console.log('Percentage of successful parses: ', percentageSuccess + '%')
  console.log('Average recall:', averageRecall + '%')
  console.log('Average precision:', averagePrecision + '%')
}