import fs from 'fs';
import * as tf from '@tensorflow/tfjs-node';  // Import TensorFlow.js for Node.js
import PatternSet from './PatternSet.js';
import config from './Config.js';

export default () => {
  const patterns = new PatternSet()
  patterns.load(config.patternsFile, (patterns) => {
    console.log('Patterns loaded from ' + config.patternsFile)
    trainTensorFlow(patterns)
  })
}

function trainTensorFlow (patterns) {
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
  model.add(tf.layers.dense({ units: config.TensorFlow.layers[0].units, inputShape: [inputLength], activation: config.TensorFlow.layers[0].activation }))

  // Hidden layers (optional)
  model.add(tf.layers.dense({ units: config.TensorFlow.layers[1].units, activation: config.TensorFlow.layers[1].activation }))

  // Output layer for multi-class classification (e.g., 4 classes)
  model.add(tf.layers.dense({ units: config.TensorFlow.layers[2].units, activation: config.TensorFlow.layers[2].activation }))  // 4 output neurons

  // Compile the model with categorical crossentropy
  model.compile({
    optimizer: config.TensorFlow.optimizer,
    loss: config.TensorFlow.loss,
    metrics: config.TensorFlow.metrics
  })
  
  model.summary()

  model.fit(X_train, y_train, {
    epochs: config.TensorFlow.epochs,
    batchSize: config.TensorFlow.batchSize
  }).then((history) => {
    config.history = history
    fs.writeFileSync(config.trainResultsFile, JSON.stringify(config, null, 2))
    model.save(config.modelDir)
  })


}