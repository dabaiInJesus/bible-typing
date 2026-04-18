const fs = require('fs');
const path = require('path');

// 书卷名称映射
const BOOK_NAMES = {
    "gn": "Genesis", "ex": "Exodus", "lv": "Leviticus", "nm": "Numbers",
    "dt": "Deuteronomy", "js": "Joshua", "jg": "Judges", "rt": "Ruth",
    "1s": "1 Samuel", "2s": "2 Samuel", "1k": "1 Kings", "2k": "2 Kings",
    "1c": "1 Chronicles", "2c": "2 Chronicles", "ez": "Ezra", "ne": "Nehemiah",
    "es": "Esther", "jb": "Job", "ps": "Psalms", "pr": "Proverbs",
    "ec": "Ecclesiastes", "sg": "Song of Solomon", "is": "Isaiah",
    "jr": "Jeremiah", "lm": "Lamentations", "ezk": "Ezekiel", "dn": "Daniel",
    "hs": "Hosea", "jl": "Joel", "am": "Amos", "ob": "Obadiah",
    "jn": "Jonah", "mc": "Micah", "na": "Nahum", "hb": "Habakkuk",
    "zp": "Zephaniah", "hg": "Haggai", "zc": "Zechariah", "ml": "Malachi",
    "mt": "Matthew", "mk": "Mark", "lk": "Luke", "jhn": "John",
    "act": "Acts", "rom": "Romans", "1co": "1 Corinthians", "2co": "2 Corinthians",
    "gal": "Galatians", "eph": "Ephesians", "php": "Philippians", "col": "Colossians",
    "1th": "1 Thessalonians", "2th": "2 Thessalonians", "1tm": "1 Timothy",
    "2tm": "2 Timothy", "tit": "Titus", "phm": "Philemon", "heb": "Hebrews",
    "jas": "James", "1pe": "1 Peter", "2pe": "2 Peter", "1jn": "1 John",
    "2jn": "2 John", "3jn": "3 John", "jud": "Jude", "rev": "Revelation"
};

const BOOK_ABBREVS = {
    "gn": "Gen", "ex": "Exo", "lv": "Lev", "nm": "Num", "dt": "Deu",
    "js": "Jos", "jg": "Jdg", "rt": "Rut", "1s": "1Sa", "2s": "2Sa",
    "1k": "1Ki", "2k": "2Ki", "1c": "1Ch", "2c": "2Ch", "ez": "Ezr",
    "ne": "Neh", "es": "Est", "jb": "Job", "ps": "Psa", "pr": "Pro",
    "ec": "Ecc", "sg": "Sol", "is": "Isa", "jr": "Jer", "lm": "Lam",
    "ezk": "Eze", "dn": "Dan", "hs": "Hos", "jl": "Joe", "am": "Amo",
    "ob": "Oba", "jn": "Jon", "mc": "Mic", "na": "Nah", "hb": "Hab",
    "zp": "Zep", "hg": "Hag", "zc": "Zec", "ml": "Mal",
    "mt": "Mat", "mk": "Mar", "lk": "Luk", "jhn": "Joh",
    "act": "Act", "rom": "Rom", "1co": "1Co", "2co": "2Co",
    "gal": "Gal", "eph": "Eph", "php": "Phi", "col": "Col",
    "1th": "1Th", "2th": "2Th", "1tm": "1Ti", "2tm": "2Ti",
    "tit": "Tit", "phm": "Phm", "heb": "Heb", "jas": "Jam",
    "1pe": "1Pe", "2pe": "2Pe", "1jn": "1Jo", "2jn": "2Jo",
    "3jn": "3Jo", "jud": "Jud", "rev": "Rev"
};

const OLD_TESTAMENT = ["gn", "ex", "lv", "nm", "dt", "js", "jg", "rt", "1s", "2s", "1k", "2k", "1c", "2c", "ez", "ne", "es", "jb", "ps", "pr", "ec", "sg", "is", "jr", "lm", "ezk", "dn", "hs", "jl", "am", "ob", "jn", "mc", "na", "hb", "zp", "hg", "zc", "ml"];
const NEW_TESTAMENT = ["mt", "mk", "lk", "jhn", "act", "rom", "1co", "2co", "gal", "eph", "php", "col", "1th", "2th", "1tm", "2tm", "tit", "phm", "heb", "jas", "1pe", "2pe", "1jn", "2jn", "3jn", "jud", "rev"];

function convertKJV() {
    const inputFile = 'bible-temp/json/en_kjv.json';
    const outputFile = 'public/bible-data/bible-en.json';
    
    console.log(`读取文件: ${inputFile}`);
    const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    
    console.log(`共 ${rawData.length} 卷书`);
    
    const books = [];
    let bookIndex = 1;
    let totalChapters = 0;
    let totalVerses = 0;
    
    rawData.forEach(bookData => {
        const abbrevKey = bookData.abbrev;
        const testament = OLD_TESTAMENT.includes(abbrevKey) ? "old" : "new";
        
        const chapters = bookData.chapters.map((verses, chapterIdx) => {
            const chapterNum = chapterIdx + 1;
            const verseList = verses.map((text, verseIdx) => ({
                verse: verseIdx + 1,
                text: text
            }));
            
            totalVerses += verseList.length;
            return {
                chapter: chapterNum,
                verses: verseList
            };
        });
        
        totalChapters += chapters.length;
        
        const book = {
            name: BOOK_NAMES[abbrevKey] || abbrevKey.toUpperCase(),
            abbrev: BOOK_ABBREVS[abbrevKey] || abbrevKey.toUpperCase(),
            bookIndex: bookIndex,
            testament: testament,
            chapters: chapters
        };
        
        books.push(book);
        bookIndex++;
        console.log(`  处理: ${book.name} (${chapters.length} 章)`);
    });
    
    const outputData = {
        version: "King James Version",
        version_en: "King James Version",
        source: "https://github.com/thiagobodruk/bible",
        totalBooks: books.length,
        totalChapters: totalChapters,
        totalVerses: totalVerses,
        books: books
    };
    
    console.log(`\n写入文件: ${outputFile}`);
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf-8');
    
    console.log(`\n完成!`);
    console.log(`  书卷数: ${outputData.totalBooks}`);
    console.log(`  章节数: ${outputData.totalChapters}`);
    console.log(`  经节数: ${outputData.totalVerses}`);
}

convertKJV();
