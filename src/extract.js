/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import Corpus from './Corpus.js';
import FeatureExtractor from './FeatureExtractor.js';
import PatternSet from './PatternSet.js';
import config from './Config.js';

export default () => {
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
}
