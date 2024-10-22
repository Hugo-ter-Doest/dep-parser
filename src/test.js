/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import fs from 'fs';
import * as tf from '@tensorflow/tfjs-node';
import { completelyParsed } from './Util.js';
import Corpus from './Corpus.js';
import ShiftReduceParser from './ShiftReduceParser.js';
import config from './Config.js';

export default async () => {
  return new Promise((resolve, reject) => {
    tf.loadLayersModel(config.modelFile)
      .then(model => {
        console.log('Model loaded!');
        test(model)
        resolve()
      })
      .catch(err => {
        reject(err);
      });
  });
}

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
    if (completelyParsed(stack, buffer)) {
      nrSuccess++
    }
    const result = s.recallPrecision(arcs)
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

  config.testResults = {
    successRate: percentageSuccess,
    averageRecall: averageRecall,
    averagePrecision: averagePrecision
  }

  // Save the results
  config.testResultsFile = config.outputDir + `testResults-${new Date().toISOString().replace(/:/g, '-')}.json`;
  fs.writeFileSync(config.testResultsFile, JSON.stringify(config, null, 2))
  config.testResults = null

  console.log('Percentage of complete parses: ', percentageSuccess + '%')
  console.log('Average recall:', averageRecall + '%')
  console.log('Average precision:', averagePrecision + '%')
}
