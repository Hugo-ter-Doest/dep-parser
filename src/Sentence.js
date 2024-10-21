/**
 * Copyright (c) 2024 Hugo W.L. ter Doest, Ugo Software
 *
 * This software is distributed under the European Union Public Licence (EUPL) v1.2.
 * See: https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 */

// This class is used to represent Connll-U format sentences

class Sentence {
  constructor (sentence) {
    this.sentence = sentence || []
    this.arcs = null
  }

  addToken (token) {
    this.sentence.push(token)
  }

  length () {
    return this.sentence.length
  }

  getTokens () {
    return this.sentence
  }

  extractArcs () {
    // Create a list of all dependency arcs in the sentence
    this.arcs = []
    
    // For each token, get the head and its dependent (the token itself)
    this.sentence.forEach(token => {
      const head = token.head  // ID of the head (parent) of this token
      const dependent = token.id  // ID of the token (dependent)
      
      // Ignore root tokens (head == 0)
      if (head !== 0) {
        const arc = { head: head, dependent: dependent }
        this.arcs.push(arc)
      }
    })
  }

  getArcs () {
    if (!this.arcs) {
      this.extractArcs()
    }
    return this.arcs
  }
  
  hasNonProjectiveStructure () {
    // Create a list of all dependency arcs in the sentence
    const arcs = this.getArcs()
    
    // Compare all pairs of arcs to see if any cross
    for (let i = 0; i < arcs.length; i++) {
      for (let j = i + 1; j < arcs.length; j++) {
        const arc1 = arcs[i];
        const arc2 = arcs[j];
        
        // Check if arc1 and arc2 cross
        if (arcsCross(arc1, arc2)) {
          // The sentence has a non-projective structure
          // Return the arcs
          return {arc1, arc2}
        }
      }
    }
    
    // No crossing arcs found, so the sentence is projective
    return null
  }

  // Calculates recall and precision of recognized arcs
  recallPrecision (parsedArcs) {
  // determine arcs of sentence
  const sentenceArcs = this.getArcs()

  // Log the sentence and parsed arcs
  console.log('Sentence:', sentenceArcs)
  console.log('Parsed:', parsedArcs)

  let correctArcsInParse = 0
  // Compare arcs of sentence with arcs of parsed sentence
  sentenceArcs.forEach(sentArc => {
    parsedArcs.forEach(parsedArc => {
      if (sentArc.head === parsedArc.head &&
        sentArc.dependent === parsedArc.dependent) {
        correctArcsInParse++
      }
    })
  })
  if (sentenceArcs.length === 0 || parsedArcs.length === 0) {
    return({
      precision: 0,
      recall: 0
    })
  }
  return {
    precision: correctArcsInParse / parsedArcs.length,
    recall: correctArcsInParse / sentenceArcs.length
    }
  }

  // Prints the dependency tree of the sentence
  printDependencyTree () {
    const tree = {};
    const parsedSentence = this.sentence

    // Step 1: Build a tree structure where each head has an array of dependents
    parsedSentence.forEach(token => {
        const head = token.head;  // The governing word (head)
        const dependent = token.id;  // The dependent word (current token)

        if (!tree[head]) {
            tree[head] = [];
        }
        tree[head].push(dependent);  // Add this token as a dependent of the head
    });

    // Step 2: Recursive function to print the tree
    const printTree = (nodeId, level = 0) => {
        const indent = '  '.repeat(level);  // Indentation for tree levels
        const token = parsedSentence.find(t => t.id === nodeId);  // Get the token by its ID
        console.log(`${indent}${token.form} (${token.deprel})`);  // Print the word and its dependency relation

        // If the current node has dependents, recursively print them
        if (tree[nodeId]) {
            tree[nodeId].forEach(childId => printTree(childId, level + 1));
        }
    };

    // Step 3: Start by finding the root (the token whose head is 0)
    const root = parsedSentence.find(token => token.head === 0);
    printTree(root.id);
  }

}

// Helper function to check if two arcs cross
function arcsCross (arc1, arc2) {
  const [A1, B1] = [Math.min(arc1.head, arc1.dependent), Math.max(arc1.head, arc1.dependent)];
  const [A2, B2] = [Math.min(arc2.head, arc2.dependent), Math.max(arc2.head, arc2.dependent)];

  // Arcs cross if they overlap but are not nested
  return (A1 < A2 && A2 < B1 && B1 < B2) || (A2 < A1 && A1 < B2 && B2 < B1);
}

export default Sentence
