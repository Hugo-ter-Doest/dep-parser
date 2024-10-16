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
