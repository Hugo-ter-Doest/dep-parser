/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import fs from 'fs';
import * as tf from '@tensorflow/tfjs-node';
import PatternSet from './PatternSet.js';
import config from './Config.js';

export default async () => {
  console.log(config)
  const patterns = new PatternSet()
  await patterns.load(config.patternsFile)
  console.log('Patterns loaded from ' + config.patternsFile)
  return trainTensorFlow(patterns.getPatterns())
}

async function trainTensorFlow (patterns) {
  const X = patterns.map(pattern => pattern.input)
  const y = patterns.map(pattern => pattern.output)

  const nrPatterns = X.length
  const inputLength = X[0].length
  const outputLength = y[0].length

  const X_train = tf.tensor2d(X, [nrPatterns, inputLength]);  // Input should match model input shape
  const y_train = tf.tensor2d(y, [nrPatterns, outputLength]);   // Labels should match output shape for one-hot encoding

  console.log(X[X.length - 1].length)
  console.log(y[y.length - 1].length)

  const model = tf.sequential()

  // Input layer
  model.add(tf.layers.dense({ inputShape: [inputLength], units: inputLength, activation: config.TensorFlow.layers[0].activation }))

  // Hidden layers (optional)
  model.add(tf.layers.dense({ units: config.TensorFlow.layers[1].units, activation: config.TensorFlow.layers[1].activation }))

  // Output layer for multi-class classification (e.g., 4 classes)
  model.add(tf.layers.dense({ units: config.TensorFlow.layers[2].units, activation: config.TensorFlow.layers[2].activation }))

  // Compile the model with categorical crossentropy
  model.compile({
    optimizer: config.TensorFlow.optimizer,
    loss: config.TensorFlow.loss,
    metrics: config.TensorFlow.metrics
  })
  
  model.summary()

  let trainConfig = null
  if (config.TensorFlow.batchSize) {
    trainConfig = {
      epochs: config.TensorFlow.epochs,
      batchSize: config.TensorFlow.batchSize
    }
  } else {
    trainConfig = {
      epochs: config.TensorFlow.epochs
    }
  }
  return model.fit(X_train, y_train, {
    epochs: config.TensorFlow.epochs,
    batchSize: config.TensorFlow.batchSize
  }).then(async (history) => {
    config.trainResults = history

    const timestamp = new Date();
    const options = {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    const localizedTimestamp = timestamp.toLocaleString('nl-NL', options).replace(/:/g, '-').replace(/,/g, '--').replace(/\s+/g, '');

    config.trainResultsFile = config.outputDir + `trainResults-${localizedTimestamp}.json`;
    fs.writeFileSync(config.trainResultsFile, JSON.stringify(config, null, 2))
    config.trainResults = null
    await model.save(config.modelDir)
  })
}