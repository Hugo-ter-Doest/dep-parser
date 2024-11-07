/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

// Configuration file to steer the extraction, training and testing process from one config
// file
// DEV = true: use the dev set
// DEV = false: use the train and test sets
const DEV = true

// ========================================================================================
// If you set these three parameters, the rest of the filenames are automatically generated
const UDTreebankBase = '../ud-treebanks-v2.14/'
const language = 'English'
const project = 'GUM'
// ========================================================================================

const languageDir = 'UD_' + language + '-' + project + '/'
const UDPath = UDTreebankBase + languageDir

const extension = '.conllu'
const baseFilename = 'en_' + project.toLowerCase() + '-ud-'

const devFilename = baseFilename + 'dev' +    extension

let trainFilename = baseFilename + 'train' +  extension
let testFilename = baseFilename + 'test' +   extension

if (DEV) { // Override train and test corpora with dev
  trainFilename = devFilename
  testFilename =  devFilename
}

const trainFilePath = UDPath + trainFilename
const testFilePath =  UDPath + testFilename

// =============================================================================
// These directories are used for all inputs, models and outputs of the extract,
// train and test processes
const dataDir = './data/output/'
const modelDir = './data/models/'
// =============================================================================

const tensorFlowModelPath = 'file://' + modelDir + baseFilename + 'model/'
const tensorFlowModelFilePath = tensorFlowModelPath + 'model.json'

const lemmaFile = baseFilename + 'lemma' + '.json'
const lemmaFilePath = dataDir + lemmaFile

const upostagFile = baseFilename + 'upostag' + '.json'
const upostagFilePath = dataDir + upostagFile

const formFile = baseFilename + 'form' + '.json'
const formFilePath = dataDir + formFile

const patternsFile = baseFilename + 'patterns' + '.json'
const patternsFilePath = dataDir + patternsFile

const failedSentencesFile = baseFilename + 'failed.conllu'
const failedSentencesFilePath = dataDir + failedSentencesFile

const testResultsfile = baseFilename + 'testResults.json'
const testResultsFilePath = dataDir + testResultsfile

const trainResultsfile = baseFilename + 'trainResults.json'
const trainResultsFilePath = dataDir + trainResultsfile

const extractResultsfile = baseFilename + 'extractResults.json'
const extractResultsFilePath = dataDir + extractResultsfile

const word2vecFilePath = modelDir + 'GoogleNews-vectors-negative300.bin'

const config = {
  outputDir: dataDir,

  corpusTrain: process.env.CORPUS_TRAIN || trainFilePath,
  corpusTest: process.env.CORPUS_TEST || testFilePath,
  failedSentencesFile: process.env.FAILED_SENTENCES_FILE || failedSentencesFilePath,
  formFile: process.env.FORM_FILE || formFilePath,
  lemmaFile: process.env.LEMMA_FILE || lemmaFilePath,
  upostagFile: process.env.UPOSTAG_FILE || upostagFilePath,
  patternsFile: process.env.PATTERNS_FILE || patternsFilePath,
  // Use modelDir when saving
  modelDir: process.env.MODEL_DIR || tensorFlowModelPath,
  // Use modelFile when loading
  modelFile: process.env.MODEL_FILE || tensorFlowModelFilePath,
  testResultsFile: process.env.TEST_RESULTS_FILE || testResultsFilePath,
  trainResultsFile: process.env.TRAIN_RESULTS_FILE || trainResultsFilePath,
  extractResultsFile: process.env.EXTRACT_RESULTS_FILE || extractResultsFilePath,
  word2vecFile: process.env.WORD2VEC_FILE || word2vecFilePath,

  extraction: {
    // Stack and buffer depth for feature construction
    stackDepth: parseInt(process.env.STACK_DEPTH, 10) || 2,
    bufferDepth: parseInt(process.env.BUFFER_DEPTH, 10) || 3,
    // Word conversion method: word2vec or hash
    wordConversion: process.env.WORD_CONVERSION || 'hash',
  },

  // Parameters for training TensorFlow
  TensorFlow: {
    layers: [
      {
        units: parseInt(process.env.TENSORFLOW_INPUTLAYER_UNITS, 10) || 128,
        activation: process.env.TENSORFLOW_INPUTLAYER_ACTIVATION || 'relu' 
      },
      {
        units: parseInt(process.env.TENSORFLOW_HIDDENLAYER_UNITS, 10) || 128,
        activation: process.env.TENSORFLOW_HIDDENLAYER_ACTIVATION || 'relu'
      },
      {
        units: parseInt(process.env.TENSORFLOW_OUTPUTLAYER_UNITS, 10) || 3,
        activation: process.env.TENSORFLOW_OUPUTLAYER_ACTIVATION || 'softmax'
      }
    ],
    optimizer: process.env.TENSORFLOW_OPTIMIZER || 'adam',
    loss: process.env.TENSORFLOW_LOSS || 'categoricalCrossentropy',
    metrics: process.env.TENSORFLOW_METRICS || ['accuracy'],
    // batchSize: parseInt(process.env.TENSORFLOW_BATCH_SIZE, 10) || 301648,
    epochs: parseInt(process.env.TENSORFLOW_EPOCHS, 10) || 80
  },
  // Parameters for iterating: main iterate will use these values
  iterate: {
    commands: ['train', 'test'],
    configItem: ['TensorFlow', 'batchSize'],
    values: [10000, 15000, 20000]
  }
}

export default config
