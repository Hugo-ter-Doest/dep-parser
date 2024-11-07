/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import fs from 'fs'
import word2vec from 'word2vec'
import Corpus from './Corpus.js'
import FeatureExtractor from './FeatureExtractor.js'
import PatternSet from './PatternSet.js'
import config from './Config.js'

export default () => {
  // If word2vec model is specified, load it
  if (config.extraction.wordConversion === 'word2vec') {
    const models = {}
    models.word2vecModel = word2vec.loadModel(config.word2vecFile, (error, model) => {
      if (error) {
        throw error
      }
      console.log("Word2Vec model loaded!")
      processCorpus(model)
    })
  } else {
    processCorpus()
  }
}

function processCorpus (word2vecModel) {

  // Extract training patterns
  const corpus = new Corpus(null)
  corpus.load(config.corpusTrain, true)
  const extractor = new FeatureExtractor(corpus, word2vecModel)
  const trainingPatterns = extractor.extractTrainingData()

  // Save training patterns
  const patternSet = new PatternSet(trainingPatterns)
  patternSet.save(config.patternsFile, () => {
    console.log('Patterns saved to ' + config.patternsFile)
    extractor.corpus.saveVocabularies(config.formFile, config.lemmaFile, config.upostagFile)  
  })

  config.extractResults = {
    numberOfSentences: corpus.getSentences().length,
    numberOfPatterns: patternSet.getPatterns().length,
    inputLength: patternSet.getPatterns()[0].input.length,
    outputLength: patternSet.getPatterns()[0].output.length,
  }

  const timestamp = new Date();
  const options = {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const localizedTimestamp = timestamp.toLocaleString('nl-NL', options).replace(/:/g, '-').replace(/,/g, '--').replace(/\s+/g, '');

  config.extractResultsFile = config.outputDir + `extractResults-${localizedTimestamp}.json`;
  fs.writeFileSync(config.extractResultsFile, JSON.stringify(config, null, 2))
  config.extractResults = null
}
