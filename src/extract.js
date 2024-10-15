const fs = require('fs')
const Corpus = require('./Corpus')
const FeatureExtractor = require('./FeatureExtractor')
const PatternSet = require('./PatternSet')

const config = require('./Config');

// Extract training patterns
const corpus = new Corpus()
corpus.load(config.corpusTrain, true)
const extractor = new FeatureExtractor(corpus);
const trainingPatterns = extractor.extractTrainingData()

// Save training patterns
const patternSet = new PatternSet(trainingPatterns)
patternSet.save(config.patternsFile, () => {
  console.log('Patterns saved to ' + config.patternsFile)
  extractor.corpus.saveVocabularies(config.formFile, config.lemmaFile, config.upostagFile)  
})
