import bookDict from './data/book.json';
import parseOrderDict from './data/parse_order.json';
import parseDict from './data/parse.json';
import posDict from './data/pos.json';
import tokenWithPunctDict from './data/token_punct.json';
import word_data from './data/words.json';

var BOOK = 0;
var CHAPTER = 1;
var VERSE = 2;
var POS = 3;
var PARSE = 4;
var TOKEN_WITH_PUNCT = 5;
var TOKEN = 6;
var NORMALIZED_TOKEN = 7;
var LEMMA = 8;

function listKeys(obj) {
  var keys = [];
  for (var k in obj) if (obj.hasOwnProperty(k)) keys.push(k);
  return keys;
}

function Book(id) {
  var bookName = bookDict[id][0];
  this.name = bookName;
  this.id = id;
  this.chapters = {};
}

function Chapter(book, id) {
  this.book = book;
  this.id = id;
  this.verses = {};
}

function Verse(book, chapter, id) {
  this.book = book;
  this.chapter = chapter;
  this.id = id;
  this.words = [];
  this.priorVerse = null;
  this.nextVerse = null;
}

function Word(book, chapter, verse, data) {
  this.book = book;
  this.chapter = chapter;
  this.verse = verse;
  this.pos = data[POS];
  this.parse = data[PARSE];
  this.lemmaID = data[LEMMA];
  this.tokenID = data[TOKEN];
  this.normalizedTokenID = data[NORMALIZED_TOKEN];
  this.tokenWtihPunctID = data[TOKEN_WITH_PUNCT];

  this.getPos = function () {return posDict[this.pos]};
  this.getTokenWithPunct = function () {
    return tokenWithPunctDict[this.tokenWtihPunctID];
  };
  this.getParseInfo = function () {
    var parseInfo = {};
    var parseKeys = listKeys(this.parse);
    for (var i = 0; i < parseKeys.length; i++) {
      var info_type = parseOrderDict[parseKeys[i]];
      var info = parseDict[this.parse[parseKeys[i]]];
      parseInfo[info_type] = info;
    }
    return parseInfo;
  };

}

function NT() {
  this.books = {};
  this.verseLinkedList= [];
  this.bookDict = bookDict;
  this.addWord = function (word) {
    var bookID = word[BOOK];
    var chapterID = word[CHAPTER];
    var verseID = word[VERSE];

    if (!this.books.hasOwnProperty(bookID)) {
      this.books[bookID] = new Book(bookID);
    }
    var book = this.books[bookID];
    if (!book.chapters.hasOwnProperty(chapterID)) {
      book.chapters[chapterID] = new Chapter(book, chapterID);
    }
    var chapter = book.chapters[chapterID];
    if (!chapter.verses.hasOwnProperty(verseID)) {
      var newVerse = new Verse(book, chapter, verseID);
      chapter.verses[verseID] = newVerse;
      if (this.verseLinkedList.length > 0) {
        this.verseLinkedList[this.verseLinkedList.length - 1].nextVerse = newVerse;
        newVerse.priorVerse = this.verseLinkedList[this.verseLinkedList.length - 1];
      }
      this.verseLinkedList.push(newVerse);
    }
    var verse = chapter.verses[verseID];
    verse.words.push(new Word(book, chapter, verse, word));
  };
  this.wordsToString = function (words) {
    return words.map(word => word.getTokenWithPunct()).join(" ");
  };
  this.getBookID = function (string) {
    string = string.toLowerCase().trim();
    for (var id of listKeys(this.bookDict)) {
      var booknames = bookDict[id].map(function(x){ return x.toLowerCase() });
      if (booknames.includes(string)) return id;
    }
    return null;
  };
}

export function buildNT() {
  var nt = new NT();
  for (var i = 0; i < word_data.length; i++) {
    nt.addWord(word_data[i]);
  }
  return nt;
}
