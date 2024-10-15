const Corpus = require('../src/Corpus')
const fs = require('fs')

// Some constants 
const corpusFile = './src/data/test_sentences.conllu'
const anotherFile = './src/data/test_sentences2.conllu'
formVoca = './data/forms.json'
lemmaVoca = './data/lemmas.json'
upostagVoca = './data/upostag.json'

describe('Corpus', () => {
    let corpus;
  
    beforeEach(() => {
      corpus = new Corpus();
    });
  
    it('should load a corpus from a CoNLL-U file', () => {
      corpus.load(corpusFile, true)
      expect(corpus.getSentences()).toBeDefined();
    });

    it('should save vocabularies', () => {
      // Remove the vocabulary files
      fs.unlinkSync(formVoca);
      fs.unlinkSync(lemmaVoca);
      fs.unlinkSync(upostagVoca);
      corpus.load(corpusFile, true)
      corpus.saveVocabularies(formVoca, lemmaVoca, upostagVoca)
      expect(fs.existsSync(formVoca)).toBe(true);
      expect(fs.existsSync(lemmaVoca)).toBe(true);
      expect(fs.existsSync(upostagVoca)).toBe(true);
    });
    
    it('should save the corpus to a CoNLL-U file', () => {
      corpus.load(corpusFile, true);
      corpus.save(anotherFile);
      expect(fs.existsSync(anotherFile)).toBe(true);
    });

  })