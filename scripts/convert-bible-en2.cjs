const fs = require('fs');
const path = require('path');

const sourceZhPath = path.resolve(__dirname, '../public/bible-data/bible-zh.json');
const sourceEnPath = path.resolve(__dirname, '../public/bible-data/bible-en.json');
const outputPath = sourceEnPath;

console.log('convert-bible-en2.cjs start');
console.log('sourceZhPath', sourceZhPath);
console.log('sourceEnPath', sourceEnPath);

const zhData = JSON.parse(fs.readFileSync(sourceZhPath, 'utf8'));
const enSource = JSON.parse(fs.readFileSync(sourceEnPath, 'utf8'));

if (!Array.isArray(enSource)) {
  throw new Error('Expected English source Bible data to be an array');
}
if (!Array.isArray(zhData.books)) {
  throw new Error('Expected Chinese Bible template data to contain books array');
}
if (enSource.length !== zhData.books.length) {
  throw new Error(`Expected ${zhData.books.length} English books, got ${enSource.length}`);
}

const books = zhData.books.map((zhBook, index) => {
  const enBook = enSource[index];
  if (!enBook) {
    throw new Error(`Missing English book at index ${index}`);
  }

  const chapters = enBook.chapters.map((chapterVerses, chapterIndex) => ({
    chapter: chapterIndex + 1,
    verses: chapterVerses.map((text, verseIndex) => ({
      verse: verseIndex + 1,
      text,
    })),
  }));

  return {
    name: enBook.name || zhBook.name,
    abbrev: enBook.abbrev || zhBook.abbrev,
    bookIndex: zhBook.bookIndex,
    testament: zhBook.testament,
    chapters,
  };
});

const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);
const totalVerses = books.reduce((sum, book) => sum + book.chapters.reduce((chapterSum, ch) => chapterSum + ch.verses.length, 0), 0);

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
