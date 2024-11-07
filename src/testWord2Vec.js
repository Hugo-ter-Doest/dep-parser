import path from 'path'
import Word2VecToTensorFlow from './Word2VecToTensorFlow.js'

const modelPath = path.resolve('data/models/GoogleNews-vectors-negative300.bin')
const outputPath = path.resolve('data/models/word2vec_vectors.json')
const converter = new Word2VecToTensorFlow(modelPath)

converter
  .loadModel(outputPath)
  .then( ( model, error ) => { 
    console.log("Conversion complete!")
    console.log('Conso5435le: ' + JSON.stringify(model.getVector('Console')))
  })
  .catch(console.error)
