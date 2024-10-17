/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import fs from 'fs';
import  config from './Config.js';

const DEBUG = true

// Two use cases are foreseen:

// 1. If you load a corpus for extracting features:
// - Create a Corpus
// - Load a corpus with extracting set to true
// - Save vocabularies for use in testing
// - Get sentences
// - Get vocabularies as need in creating feature vectors

// 2. If you load a corpus for testing a model:
// - Create a Corpus
// - Load a corpus with extracting set to false (no vocabularies are built)
// - Load vocabularies
// - Get sentences
// - Get vocabularies as needed in creating feature vectors

// Class for parsing and serializing Conllu dependency format
class Corpus {
  constructor() { 
    this.nrLemmas = 1
    this.lemmaVocab = { 'NULL': 0}
    this.nrUpostags = 1
    this.upostagVocab = { 'NULL': 0 }
    this.nrForms = 1
  	this.formVocab = { 'NULL': 0 }
    this.sentences = null
  }

  getSentences() {
    return this.sentences
  }

  getFormVoca() {
    return this.formVocab
  }

  getLemmaVoca() {
    return this.lemmaVocab
  }

  getUpostagVoca() {
    return this.upostagVocab
  }

  loadVocabularies (formsVocaFile, lemmaVocaFile, upostagVocaFile) {
    let text = null
    if (fs.existsSync(formsVocaFile)) {
      text = fs.readFileSync(formsVocaFile, 'utf-8')
      this.formVocab = JSON.parse(text)
    } else {
      throw new Error('Could not find ' + formsVocaFile)
    }
    if (fs.existsSync(lemmaVocaFile)) {
      text = fs.readFileSync(lemmaVocaFile, 'utf-8')
      this.lemmaVocab = JSON.parse(text)
    } else {
      throw new Error('Could not find ' + lemmaVocaFile)
    }
    if (fs.existsSync(upostagVocaFile)) {
      text = fs.readFileSync(upostagVocaFile, 'utf-8')
      this.upostagVocab = JSON.parse(text)
    } else {
      throw new Error('Could not find ' + upostagVocaFile)
    }
  }
  
  saveVocabularies (formsVocaFile, lemmaVocaFile, upostagVocaFile) {
    let text = JSON.stringify(this.formVocab, null, 2)
    fs.writeFileSync(formsVocaFile, text)
    text = JSON.stringify(this.lemmaVocab, null, 2)
    fs.writeFileSync(lemmaVocaFile, text)
    text = JSON.stringify(this.upostagVocab, null, 2)
    fs.writeFileSync(upostagVocaFile, text)
  }

  // Load the corpus from a CoNLL-U file
  // If extracting is true the vocabularies are built up from the corpus,
  // otherwise the vocabularies are left untouched
  load (corpusFile, extracting) {
    const fileContent = fs.readFileSync(corpusFile, 'utf-8')
    this.parse(fileContent, extracting)
  }

  // Save the corpus to a CoNLL-U file
  save (corpusFile) {
    const text = this.serialize(this.sentences)
    fs.writeFileSync(corpusFile, text)
  }

  saveSubset(corpusFile, indexes) {
    const text = this.serialize(this.sentences, indexes)
    fs.writeFileSync(config.failedSentencesFile, text)
  }

  updateVocabularies (token) {
    const form = token.form.toLowerCase()
    if (this.formVocab[form] === undefined) {
      this.formVocab[form] = this.nrForms++
    }
    if (this.lemmaVocab[token.lemma] === undefined) {
      this.lemmaVocab[token.lemma] = this.nrLemmas++
    }
    if (this.upostagVocab[token.upostag] === undefined) {
      this.upostagVocab[token.upostag] = this.nrUpostags++
    }
  }

  // Serialize the sentences that are in indexes
  // If indexes is not provided, all sentences are serialized
  serialize (sentences, indexes) {
    if (!indexes) {
      indexes = sentences.map((elt, i) => i)
    }
    const text = indexes.map(index => {
      const sentence = sentences[index]
      const tokens = sentence.map(token => {
        return `${token.id}\t${token.form}\t${token.lemma}\t${token.upostag}\t${token.head}\t${token.deprel}`
      });
      return `# Sentence: ${index + 1}\n${tokens.join('\n')}`
    }).join('\n\n')
    return text
  }

  parse (text, extracting) {
    this.sentences = []
    let sentence = []

    text.split('\n').forEach((line, index) => {
        if (line.startsWith('#') || line.trim() === '') {
            // Skip comments and empty lines
            if (sentence.length > 0) {
                this.sentences.push(sentence);
                sentence = [];
            }
        } else {
            const parts = line.split('\t');
            if (parts.length >= 8) {
              // Check if the token is not a combined token
              if (!parts[0].includes('-') && !parts[0].includes('.')) {
                // Add the token to the current sentence
                const token = {
                    id: parseInt(parts[0]),
                    form: parts[1],
                    lemma: parts[2],
                    upostag: parts[3],
                    head: parseInt(parts[6]),
                    deprel: parts[7]
                };
                sentence.push(token)

                if (extracting) {
                  this.updateVocabularies(token)
                }
              }
            }
        }
    })
    // Add this line to push the last sentence to the sentences array
    if (sentence.length > 0) {
        this.sentences.push(sentence)
    }
    DEBUG && console.log(`Parsed ${this.sentences.length} sentences.`);
    DEBUG && console.log('Number of forms: ', Object.keys(this.formVocab).length)
    DEBUG && console.log('Number of lemmas: ', Object.keys(this.lemmaVocab).length)
    DEBUG && console.log('Number of POS tags: ', Object.keys(this.upostagVocab).length)
  }
}

export default Corpus
