const fs = require('fs');
const path = require('path');

console.log('convert-bible-en3.cjs start');

const sourceZhPath = path.resolve(__dirname, '../public/bible-data/bible-zh.json');
const sourceEnPath = path.resolve(__dirname, '../public/bible-data/bible-en.json');
const outputPath = sourceEnPath;

console.log('sourceZhPath', sourceZhPath);
console.log('sourceEnPath', sourceEnPath);

let zhRaw;
let enRaw;
try {
  zhRaw = fs.readFileSync(sourceZhPath, 'utf8');
  console.log('read zh raw', zhRaw.slice(0, 60).replace(/\n/g, ' '));
} catch (err) {
  console.error('read zh error', err.message);
  process.exit(1);
}
try {
  enRaw = fs.readFileSync(sourceEnPath, 'utf8');
  console.log('read en raw', enRaw.slice(0, 60).replace(/\n/g, ' '));
} catch (err) {
  console.error('read en error', err.message);
  process.exit(1);
}

let zhData;
let enSource;
try {
  zhData = JSON.parse(zhRaw);
  console.log('parsed zhData books', Array.isArray(zhData.books) ? zhData.books.length : typeof zhData.books);
} catch (err) {
  console.error('parse zh error', err.message);
  process.exit(1);
}
try {
  enSource = JSON.parse(enRaw);
  console.log('parsed enSource length', Array.isArray(enSource) ? enSource.length : typeof enSource);
} catch (err) {
  console.error('parse en error', err.message);
  process.exit(1);
}

if (!Array.isArray(enSource)) {
  throw new Error('Expected English source Bible data to be an array');
}
if (!Array.isArray(zhData.books)) {
  throw new Error('Expected Chinese Bible template data to contain books array');
}
if (enSource.length !== zhData.books.length) {
  throw new Error(`Expected ${zhData.books.length} English books, got ${enSource.length}`);
}

console.log('starting transform');
const books = zhData.books.map((zhBook, index) => {
  const enBook = enSource[index];
  if (!enBook) {
    throw new Error(`Missing English book at index ${index}`);
  }
  return {
    name: enBook.name || zhBook.name,
    abbrev: enBook.abbrev || zhBook.abbrev,
    bookIndex: zhBook.bookIndex,
    testament: zhBook.testament,
    chapters: enBook.chapters.map((chapterVerses, chapterIndex) => ({
      chapter: chapterIndex + 1,
      verses: chapterVerses.map((text, verseIndex) => ({
        verse: verseIndex + 1,
        text,
      })),
    })),
  };
});

const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);
const totalVerses = books.reduce((sum, book) => sum + book.chapters.reduce((chapterSum, ch) => chapterSum + ch.verses.length, 0), 0);
console.log('calculated totals', totalChapters, totalVerses);

const output = {
  version: 'King James Version',
  version_en: 'King James Version',
  source: 'https://github.com/thiagobodruk/bible',
  totalBooks: books.length,
  totalChapters,
  totalVerses,
  books,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
console.log('Converted English Bible JSON using bible-zh.json template.');
