// Configuration file to steer the extraction, training and testing process from one config
const DEV = false

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

const devFilename =   baseFilename + 'dev' +    extension

let trainFilename = baseFilename + 'train' +  extension
let testFilename = baseFilename + 'test' +   extension

if (DEV) { // Override train and test corpora with dev
  trainFilename = devFilename
  testFilename =  devFilename
}

const trainFilePath = UDPath + trainFilename
const testFilePath =  UDPath + testFilename

const dataDir = './data/'

const modelPath = 'file://' + dataDir + baseFilename + 'model/'
const modelFilePath = modelPath + 'model.json'

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

module.exports = {
  corpusTrain: trainFilePath,
  corpusTest: testFilePath,
  failedSentencesFile: failedSentencesFilePath,
  formFile: formFilePath,
  lemmaFile: lemmaFilePath,
  upostagFile: upostagFilePath,
  patternsFile: patternsFilePath,
  // Use modelDir when saving
  modelDir: modelPath,
  // Use modelFile when loading
  modelFile: modelFilePath,
  testResultsFile: testResultsFilePath,
  trainResultsFile: trainResultsFilePath,

  // Parameters for training TensorFlow
  TensorFlow: {
    layers: [
      {
        units: 128,
        activation: 'relu' 
      }, 
      {
        units: 64,
        activation: 'relu'
      },
      {
        units: 4,
        activation: 'softmax'
      }
    ],
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
    batchSize: 2000,
    epochs: 30
  }
}
