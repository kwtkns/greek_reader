import { Component } from 'react';
import bookDict from './data/book.json';
import lemmaTree from './data/by_lemma.json';

function listKeys(obj) {
  var keys = [];
  for (var k in obj) if (obj.hasOwnProperty(k)) keys.push(k);
  return keys;
}

class LemmaTree extends Component {
  constructor(props) {
    super(props);
    this.root = new Node("ROOT");
    this.allNodes = [];
    this.buildTree(this.root, lemmaTree);
  }

  buildTree(node, dictionary) {
    var keys = listKeys(dictionary);
    for (var i = 0; i < keys.length; i++) {
      var lemma = keys[i];
      var newNode = this.addChild(node, lemma, dictionary[lemma].r);
      this.allNodes.push(newNode);
      if (dictionary[lemma].c) {
        this.buildTree(newNode, dictionary[lemma].c);
      }
    }
  }
  addChild(node, childToken, childRefs) {
    var child = new Node(childToken, node, childRefs);
    node.children.push(child);
    return child;
  }

  findExactReferences(token) {
    token = this.cleanToken(token);
    var results = [];
    for (var i = 0; i < this.allNodes.length; i++) {
      if (this.allNodes[i].token.toLowerCase() === token.toLowerCase()) {
        results = results.concat(this.allNodes[i].references);
      }
    }
    return Array.from(new Set(results)).sort();
  }

  findReferencesByLemma(token) {
    token = this.cleanToken(token);
    var results = null;
    var lemmaTokens = [];
    for (var i = 0; i < this.allNodes.length; i++) {
      if (this.allNodes[i].token.toLowerCase() === token.toLowerCase()) {
        var lemmaNode = this.walkToLemma(this.allNodes[i]);
        if (lemmaTokens.length > 0 && !lemmaTokens.includes(lemmaNode.token)) {
          var newResults =  this.collectChildReferences(lemmaNode, new Set());
          results = new Set(Array.from(results).concat(Array.from(newResults)));
          lemmaTokens.push(lemmaNode.token);
        }
        else if (lemmaTokens.length === 0) {
          results = this.collectChildReferences(lemmaNode, new Set());
          lemmaTokens.push(lemmaNode.token);
        }
      }
    }
    return {references: Array.from(results).sort(), lemmas: lemmaTokens};
  }

  getLemmas(word) {
    word = this.cleanToken(word);
    var lemmaTokens = [];
    for (var i = 0; i < this.allNodes.length; i++) {
      if (this.allNodes[i].token.toLowerCase() === word.toLowerCase()) {
        lemmaTokens.push(this.walkToLemma(this.allNodes[i]).token);
      }
    }
    return lemmaTokens
  }

  collectChildReferences(node, currentRefs) {
    this.addListToSet(currentRefs, node.references);
    if (currentRefs.length > 200) {
      return currentRefs;
    }
    for (var i = 0; i < node.children.length; i++) {
      this.addSetToSet(currentRefs, this.collectChildReferences(node.children[i], currentRefs));
    }
    return currentRefs;
  }

  addListToSet(mySet, myList) {
    for (var i = 0; i < myList.length; i++) {
      mySet.add(myList[i]);
    }
  }

  addSetToSet(setKept, setToAdd) {
    for (var item in setToAdd.values()) {
      setKept.add(item);
    }
  }

  walkToLemma(node, currentRefs) {
    if (node.parent.token !== "ROOT") {
      return this.walkToLemma(node.parent);
    }
    return node;
  }

  cleanToken(token) {
    var punctuation = ['(', ')', ',', '.', '1', '2', ';', '[', ']', '·', '—', '⟦', '⟧', '⸀', '⸁', '⸂', '⸃', '⸄', '⸅']
    token = token.trim();
    for (var i = 0; i < punctuation.length; i++) {
      token = token.replace(punctuation[i], '');
    }
    return token;
  }

  referenceString(reference) {
    var book = bookDict[parseInt(reference.slice(0, 2), 10)][0];
    var chapter = parseInt(reference.slice(2, 4), 10);
    var verse = parseInt(reference.slice(4, 6), 10);
    return book + " " + chapter + ":" + verse;
  }

}

function Node(token, parent, references) {
  this.children = [];
  this.token = token;
  this.parent = parent;
  this.references = references ? references : [];
}

export function buildLemmaTree() {
  var tree = new LemmaTree();
  return tree;
}
