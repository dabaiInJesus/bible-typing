const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '../public/bible-data/bible-en.json');
const outputPath = path.resolve(__dirname, '../public/bible-data/bible-en.json');

const bookMeta = [
  { name: 'Genesis', abbrev: 'Gen' },
  { name: 'Exodus', abbrev: 'Exo' },
  { name: 'Leviticus', abbrev: 'Lev' },
  { name: 'Numbers', abbrev: 'Num' },
  { name: 'Deuteronomy', abbrev: 'Deu' },
  { name: 'Joshua', abbrev: 'Jos' },
  { name: 'Judges', abbrev: 'Jud' },
  { name: 'Ruth', abbrev: 'Rut' },
  { name: '1 Samuel', abbrev: '1Sa' },
  { name: '2 Samuel', abbrev: '2Sa' },
  { name: '1 Kings', abbrev: '1Ki' },
  { name: '2 Kings', abbrev: '2Ki' },
  { name: '1 Chronicles', abbrev: '1Ch' },
  { name: '2 Chronicles', abbrev: '2Ch' },
  { name: 'Ezra', abbrev: 'Ezr' },
  { name: 'Nehemiah', abbrev: 'Neh' },
  { name: 'Esther', abbrev: 'Est' },
  { name: 'Job', abbrev: 'Job' },
  { name: 'Psalms', abbrev: 'Psa' },
  { name: 'Proverbs', abbrev: 'Pro' },
  { name: 'Ecclesiastes', abbrev: 'Ecc' },
  { name: 'Song of Solomon', abbrev: 'Sol' },
  { name: 'Isaiah', abbrev: 'Isa' },
  { name: 'Jeremiah', abbrev: 'Jer' },
  { name: 'Lamentations', abbrev: 'Lam' },
  { name: 'Ezekiel', abbrev: 'Eze' },
  { name: 'Daniel', abbrev: 'Dan' },
  { name: 'Hosea', abbrev: 'Hos' },
  { name: 'Joel', abbrev: 'Joe' },
  { name: 'Amos', abbrev: 'Amo' },
  { name: 'Obadiah', abbrev: 'Oba' },
  { name: 'Jonah', abbrev: 'Jon' },
  { name: 'Micah', abbrev: 'Mic' },
  { name: 'Nahum', abbrev: 'Nah' },
  { name: 'Habakkuk', abbrev: 'Hab' },
  { name: 'Zephaniah', abbrev: 'Zep' },
  { name: 'Haggai', abbrev: 'Hag' },
  { name: 'Zechariah', abbrev: 'Zec' },
  { name: 'Malachi', abbrev: 'Mal' },
  { name: 'Matthew', abbrev: 'Mat' },
  { name: 'Mark', abbrev: 'Mar' },
  { name: 'Luke', abbrev: 'Luk' },
  { name: 'John', abbrev: 'Joh' },
  { name: 'Acts', abbrev: 'Act' },
  { name: 'Romans', abbrev: 'Rom' },
  { name: '1 Corinthians', abbrev: '1Co' },
  { name: '2 Corinthians', abbrev: '2Co' },
  { name: 'Galatians', abbrev: 'Gal' },
  { name: 'Ephesians', abbrev: 'Eph' },
  { name: 'Philippians', abbrev: 'Php' },
  { name: 'Colossians', abbrev: 'Col' },
  { name: '1 Thessalonians', abbrev: '1Th' },
  { name: '2 Thessalonians', abbrev: '2Th' },
  { name: '1 Timothy', abbrev: '1Ti' },
  { name: '2 Timothy', abbrev: '2Ti' },
  { name: 'Titus', abbrev: 'Tit' },
  { name: 'Philemon', abbrev: 'Phm' },
  { name: 'Hebrews', abbrev: 'Heb' },
  { name: 'James', abbrev: 'Jas' },
  { name: '1 Peter', abbrev: '1Pe' },
  { name: '2 Peter', abbrev: '2Pe' },
  { name: '1 John', abbrev: '1Jo' },
  { name: '2 John', abbrev: '2Jo' },
  { name: '3 John', abbrev: '3Jo' },
  { name: 'Jude', abbrev: 'Jud' },
  { name: 'Revelation', abbrev: 'Rev' },
];

function transformBook(bookData, index) {
  const meta = bookMeta[index];
  if (!meta) {
    throw new Error(`Missing metadata for book index ${index}`);
  }

  const chapters = bookData.chapters.map((chapterVerses, chapterIndex) => ({
    chapter: chapterIndex + 1,
    verses: chapterVerses.map((text, verseIndex) => ({
      verse: verseIndex + 1,
      text,
    })),
  }));

  return {
    name: meta.name,
    abbrev: meta.abbrev,
    bookIndex: index + 1,
    testament: index < 39 ? 'old' : 'new',
    chapters,
  };
}

const raw = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(raw);
if (!Array.isArray(data)) {
  throw new Error('Expected English Bible data to be an array');
}
if (data.length !== 66) {
  throw new Error(`Expected 66 books, got ${data.length}`);
}

const books = data.map(transformBook);
const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);
const totalVerses = books.reduce(
  (sum, book) => sum + book.chapters.reduce((chapterSum, ch) => chapterSum + ch.verses.length, 0),
  0,
);

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
console.log('Converted English Bible JSON to zh-compatible structure.');
