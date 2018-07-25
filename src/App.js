import React, { Component } from 'react';
import './App.css';
import {buildNT} from './read_data.js';
import { buildLemmaTree } from './readConcordance.js';

function listKeys(obj) {
  var keys = [];
  for (var k in obj) if (obj.hasOwnProperty(k)) keys.push(k);
  return keys;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.nt = buildNT();
    this.searchTree = buildLemmaTree();
    this.state = {
      value: '',
      output: '',
      title: 'Enter a biblical reference (New Testament)',
      searchTerm: null,
      wordInfo: null,
      references: [],
      lemmas: [],
      wordInstructions: 0,
      referenceInstructions: 0};
    this.onRefInputChange = this.onRefInputChange.bind(this);
    this.onRefSubmit = this.onRefSubmit.bind(this);
    this.onPriorVerseClick = this.onPriorVerseClick.bind(this);
    this.onNextVerseClick = this.onNextVerseClick.bind(this);
    this.onWordClick = this.onWordClick.bind(this);
    this.onClearClick = this.onClearClick.bind(this);
    this.onReferenceClick = this.onReferenceClick.bind(this);
  }
  render() {
    var browse_buttons = "";
    var wordInstructions = "";
    var referenceInstructions = "";
    // If there's already a verse selected show prior and next puttons
    if (this.state.verse) {
      browse_buttons = (<div>
        <SimpleButton value='◀' onClick={this.onPriorVerseClick}></SimpleButton>
         &ensp;
        <SimpleButton value='▶' onClick={this.onNextVerseClick}></SimpleButton>
      </div>)
    }
    // Once a verse is selected, show instructions for clicking on words
    // Stop displaying once the feature has been used a few times
    if (this.state.wordInstructions < 4 && this.state.wordInstructions > 0) {
      wordInstructions = (<div className="attribution">Click on a word to see its parse and other references with the same lemma.</div>)
    }
    // Once a word, show instructions for clicking on references
    // Stop displaying once the feature has been used a few times
    if (this.state.referenceInstructions < 4 && this.state.referenceInstructions > 0) {
      referenceInstructions = (<div className="attribution">Click a reference below to see other verses containing {this.state.lemmas.join(", ")}.</div>)
    }
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">{this.state.title}</h1>
          {wordInstructions}
          {referenceInstructions}
        </header>
        <RefForm className="form" onInputChange={this.onRefInputChange}
                 onSubmission={this.onRefSubmit}>
                 value={''}
                 </RefForm>
      {browse_buttons}
        <div className="percentage-width">{this.formatVerse(this.state.verse, this.state.lemmas)}</div>
        <div className="search-section">
          <WordInfo info = {this.state.wordInfo} word={this.state.searchTerm} lemmas={this.state.lemmas} onClick={this.onClearClick}></WordInfo>
          <div>{this.formatRefs(this.state.references)}</div>
          <div className="footer">
            <p className="attribution">
              Scripture quotations marked <a
              className="attribution" href="http://sblgnt.com">SBLGNT
              </a> are from the <a
              className="attribution" href="http://sblgnt.com">SBL Greek New Testament
              </a>. Copyright © 2010 <a
              className="attribution" href="http://www.sbl-site.org">Society of Biblical Literature
              </a> and <a
              className="attribution" href="http://www.logos.com">Logos Bible Software</a>.</p>
            <p className="attribution">Morphological parsing and lemmatization is made available under a <a
              className="attribution" href="http://creativecommons.org/licenses/by-sa/3.0/">
              CC-BY-SA License</a> by: Tauber, J. K., ed. (2017) <i
               className="attribution">MorphGNT: SBLGNT Edition
               </i>. Version 6.12 [Data set]. <a
               className="attribution" href="https://github.com/morphgnt/sblgnt">
               https://github.com/morphgnt/sblgnt
               </a> DOI: 10.5281/zenodo.376200</p>
          </div>
        </div>
      </div>
    );
  }
  getVerse(bookInput, chapterInput, verseInput) {
    if (!bookInput || !chapterInput || !verseInput) {
      return null;
    }
    var bookID = this.nt.getBookID(bookInput);
    if (!bookID) {
      return null;
    }
    var chapter = this.nt.books[bookID].chapters[chapterInput];
    if (!chapter) {
      return null;
    }
    var verse = chapter.verses[verseInput];
    if (!verse) {
      return null;
    }
    return verse;
  }

  formatVerse(verse, lemmas) {
    if (!verse) return [];
    var output = [];
    var keyCount = 0;

    for (var word of verse.words) {
      var token = word.getTokenWithPunct();
      var highlight = false;
      var wordLemmas = this.searchTree.getLemmas(token);
      for (var i = 0; i < lemmas.length; i++) {
        if (wordLemmas.includes(lemmas[i])) {
          highlight = true;
          break;
        }
      }
      var info = {};
      var hover = word.getPos();
      var parse = word.getParseInfo();
      for (var k in parse) if (parse.hasOwnProperty(k)) {
        info[k] = parse[k];
      }
      output.push(
        <Word
          key={keyCount}
          highlight={highlight}
          hover={hover}
          text={token}
          moreInfo={info}
          onClick={this.onWordClick}></Word>);
      keyCount += 1;
    }
    output.push(<div key={keyCount}> <a className="attribution" href="http://sblgnt.com">(SBLGNT)</a></div>)
    return output;
  }

  formatRefs(refs) {
    var listItems = [];
    for (var i = 0; i < refs.length; i++) {
      var referenceString = this.searchTree.referenceString(refs[i]);
      listItems.push(<li className='li' key={i}><Reference
        referenceID={refs[i]}
        referenceText={referenceString}
        onClick={this.onReferenceClick}></Reference></li>);
    }
    return (<ul className="ref-list">{listItems}</ul>);
  }

  onPriorVerseClick() {
    if (this.state.verse) {
      if (this.state.verse.priorVerse) {
        var newVerse = this.state.verse.priorVerse;
        this.setState({
          verse: newVerse,
          title: newVerse.book.name + " " + newVerse.chapter.id + ":" + newVerse.id
        });
      }
    }
  }

  onNextVerseClick() {
    if (this.state.verse) {
      if (this.state.verse.nextVerse) {
        var newVerse = this.state.verse.nextVerse;
        this.setState({
          verse: newVerse,
          title: newVerse.book.name + " " + newVerse.chapter.id + ":" + newVerse.id
        });
      }
    }
  }

  onWordClick(wordClicked, info) {
    var word = this.searchTree.cleanToken(wordClicked);
    var searchResult = this.searchTree.findReferencesByLemma(word);
    this.setState({
      searchTerm: word,
      wordInfo: info,
      references: searchResult.references,
      lemmas: searchResult.lemmas,
      wordInstructions: this.state.wordInstructions + 1,
      referenceInstructions: this.state.referenceInstructions === 0 ?
                             1 : this.state.referenceInstructions
    });
  }

  onReferenceClick(reference) {
    this.setVerse(reference);
    this.setState({referenceInstructions: this.state.referenceInstructions + 1});
  }

  onClearClick() {
    this.setState({
      searchTerm: null,
      wordInfo: null,
      references: [],
      lemmas: []
    });
  }

  onRefInputChange(input) {
    this.setState({value: input})
  }

  onRefSubmit(event) {
    this.setVerse(this.state.value);
    // Mark the first display of a verse
    if (this.state.wordInstructions === 0) {
      this.setState({wordInstructions: 1});
    }
  }

  setVerse(textReference) {
    var refRegex = /(\d)?\s*(nd|st|rd)?\s*([A-Za-z]+)\.?\s*(\d+)\s*(:\s*(\d+))?/;
    var result = refRegex.exec(textReference);
    var book_num = result[1] ? result[1] + " " : "";
    var book = book_num + result[3];
    var chapter = result[4];
    var verse_num = result[6] ? result[6] : "1";
    if (!result) {
      alert('Must be in the form: book_name x:x');
    }
    else {
      var verse = this.getVerse(book, chapter, verse_num);
      if (verse) {
        this.setState({
          verse: verse,
          output: this.nt.wordsToString(verse.words),
          title: verse.book.name + " " + verse.chapter.id + ":" + verse.id
        });
      }
    }
  }
}

class SimpleButton extends React.Component {
  render () {
    return (
      <button className="button" onClick={this.props.onClick}>
        {this.props.value}
      </button>
    );
  }
}

class RefForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.props.onInputChange(event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onSubmission();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          <input type="text" value={this.props.value} onChange={this.handleChange} />
        </label>
        <input className="button" type="submit" value="Submit" onSubmit={this.handleSubmit} />
      </form>
    );
  }
}

class Word extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    if (this.props.highlight) {
      return (<div className="tooltip" onClick={this.handleClick}>
        <a className="highlight">{this.props.text}</a>&nbsp;
        <span className="tooltiptext">{this.props.hover}</span>
      </div>)
    }
    else {
      return (<div className="tooltip" onClick={this.handleClick}>
        {this.props.text}&nbsp;
        <span className="tooltiptext">{this.props.hover}</span>
      </div>)
    }
  }
  handleClick(event) {
    this.props.onClick(this.props.text, this.props.moreInfo);
  }
}

class Reference extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    this.props.onClick(this.props.referenceText);
  }

  render() {
      return (<SimpleButton
          value={this.props.referenceText}
          onClick={this.handleClick}></SimpleButton>);
  }
}

class WordInfo extends React.Component {
  formatTable() {
    var order = ["tense", "voice", "mood", "person", "gender", "number", "case", "degree"];
    var keys = listKeys(this.props.info);
    if (keys.length === 0) {
      return (<p></p>);
    }
    let rows = [];
    let rowCount = 0;
    for (var i = 0; i < order.length; i++) {
      if (keys.includes(order[i])) {
        let cells = [];
        let title = order[i];
        let info = this.props.info[title];
        cells.push(<td className="td" key={0}>{title + ":"}</td>);
        cells.push(<td className="td" key={1}>{info}</td>);
        rows.push(<tr className="tr" key={rowCount}>{cells}</tr>);
        rowCount += 1;
      }
    }
    return (<table><tbody className="tableBody">{rows}</tbody></table>);
  }

  render() {
    if (!this.props.word) {
      return (<div className="invisible-info-block" ></div>);
    }
    else {
      return (<div className="info-block" >
        <p>{this.props.word}</p>
        <p>{"Lemma: " + this.props.lemmas.join(", ")}</p>
            {this.formatTable()}
        <SimpleButton value='Clear' onClick={this.props.onClick}></SimpleButton></div>);
    }
  }
}

export default App;
