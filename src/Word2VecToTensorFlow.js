/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

import word2vec from 'word2vec';
import fs from 'fs';

class Word2VecToTensorFlow {
  constructor(modelPath) {
    this.modelPath = modelPath;
    this.vectors = {};
  }

  async loadModel() {
    return new Promise((resolve, reject) => {
      word2vec.loadModel(this.modelPath, (error, model) => {
        if (error) reject(error);
        else resolve(model);
      });
    });
  }

  async transformToJSON(outputPath) {
    const model = await this.loadModel();
    console.log(model)
    model.words.forEach((word) => {
      this.vectors[word] = model.getVector(word).values;
    });

    fs.writeFileSync(outputPath, JSON.stringify(this.vectors));
    console.log(`Model saved to ${outputPath}`);
  }
}

export default Word2VecToTensorFlow
