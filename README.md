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

# Algorithm
Basically, the shift-reduce algorithm is as follows:
```
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
The feature extraction is done with the `extractFeatures` function.


# Dependencies
- [tensorflow/tfjs-node](https://www.npmjs.com/package/@tensorflow/tfjs-node)

# License
This package is licensed under the [EUPL-1.2](https://spdx.org/licenses/EUPL-1.2.html) license.