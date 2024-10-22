/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import fs from 'fs'
import ConlluUtil from './Util'

const corpusFile = './test_data/test_sentences.conllu'
//const corpusFile = '../../ud-treebanks-v2.14/UD_English-GUM/' + 'en_gum-ud-dev.conllu'


// Read the test set
const text = fs.readFileSync(corpusFile, 'utf-8')

// Parse the test set
const sentences = ConlluUtil.parseConllu(text)

let nrProjective = 0
let nrNonprojective = 0
// Iterate through the sentences
sentences.forEach(s => {
    if (ConlluUtil.hasNonProjectiveStructure(s)) {
        nrNonprojective++
    } else {
        nrProjective++
    }
})

console.log('Number of projective sentences: ' + nrProjective)
console.log('Number of non-projective sentences: ' + nrNonprojective)
console.log('Percentage of non-projective sentences: ' + (nrNonprojective / sentences.length) * 100 + '%')
