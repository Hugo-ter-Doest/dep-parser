# Introduction
This package offers a shift-reduce parser for dependency grammar that can be trained on corpora from Universal Dependencies. It uses a back propagation network from TensorFlow to train the model.

# Installation
```bash
npm install dep-parser
```

# Usage
The scripts for extracting feature patterns, training and testing the model are configured in `Config.js`. It allows configuration of all input and output files, configuration of the neural network itself, and training.

There are three scripts for extracting feature patterns, training and testing the model resp.:
```bash
npm run extract
npm run train
npm run test
```

# Conllu Format
The package parses Universal Dependencies Conllu format. The Corpus class is used to load and save corpora in CoNLL-U format.
```javascript
import Corpus from './Corpus.js';
import config from './Config.js';

const corpus = new Corpus()
// Second parameter tells the class to build vocabularies from the corpus
corpus.load(config.corpusTrain, true)
```

# Algorithm
Basically, the shift-reduce algorithm is as follows:
```pseudo
arcs = []
while not buffer.isEmpty() or stack.size() > 1:
    action = getBestAction(stack, buffer)
    switch action:
        case 'shift':
            shift(buffer, stack)
        case 'leftArc':
            newArc = leftArc(stack, arcs)
            arcs.push(newArc)
        case 'rightArc':
            newArc = rightArc(stack, buffer, arcs)
            arcs.push(newArc)
        default:
            error('Unknown action: ' + action)
return arcs
```
The ML component is in the getBestAction function that uses the pretrained model to predict the best action.

# Feature extraction
The feature extraction is done with the `extractFeatures` function. Currently it extracts the form and upostag of the tokens in the stack and buffer. Both are extracted two deep. The word forms are normalized (values between 0 and 1) and the POS tags are one-hot encoded.


# Dependencies
- [tensorflow/tfjs-node](https://www.npmjs.com/package/@tensorflow/tfjs-node) for the neural network
- [Jasmine](https://www.npmjs.com/package/jasmine) for testing with Jasmine


# License
This package is licensed under the [EUPL-1.2](https://spdx.org/licenses/EUPL-1.2.html) license.