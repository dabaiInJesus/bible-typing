const fs = require('fs');
const path = require('path');

// 书卷名称映射(基于thiagobodruk/bible的实际缩写)
const BOOK_NAMES = {
    "gn": "Genesis", "ex": "Exodus", "lv": "Leviticus", "nm": "Numbers",
    "dt": "Deuteronomy", "js": "Joshua", "jud": "Judges", "rt": "Ruth",
    "1sm": "1 Samuel", "2sm": "2 Samuel", "1kgs": "1 Kings", "2kgs": "2 Kings",
    "1ch": "1 Chronicles", "2ch": "2 Chronicles", "ezr": "Ezra", "ne": "Nehemiah",
    "et": "Esther", "job": "Job", "ps": "Psalms", "prv": "Proverbs",
    "ec": "Ecclesiastes", "so": "Song of Solomon", "is": "Isaiah",
    "jr": "Jeremiah", "lm": "Lamentations", "ez": "Ezekiel", "dn": "Daniel",
    "ho": "Hosea", "jl": "Joel", "am": "Amos", "ob": "Obadiah",
    "jn": "Jonah", "mi": "Micah", "na": "Nahum", "hk": "Habakkuk",
    "zp": "Zephaniah", "hg": "Haggai", "zc": "Zechariah", "ml": "Malachi",
    "mt": "Matthew", "mk": "Mark", "lk": "Luke", "jo": "John",
    "act": "Acts", "rm": "Romans", "1co": "1 Corinthians", "2co": "2 Corinthians",
    "gl": "Galatians", "eph": "Ephesians", "ph": "Philippians", "cl": "Colossians",
    "1ts": "1 Thessalonians", "2ts": "2 Thessalonians", "1tm": "1 Timothy",
    "2tm": "2 Timothy", "tt": "Titus", "phm": "Philemon", "hb": "Hebrews",
    "jm": "James", "1pe": "1 Peter", "2pe": "2 Peter", "1jo": "1 John",
    "2jo": "2 John", "3jo": "3 John", "jd": "Jude", "re": "Revelation"
};

const BOOK_ABBREVS = {
    "gn": "Gen", "ex": "Exo", "lv": "Lev", "nm": "Num", "dt": "Deu",
    "js": "Jos", "jud": "Jdg", "rt": "Rut", "1sm": "1Sa", "2sm": "2Sa",
    "1kgs": "1Ki", "2kgs": "2Ki", "1ch": "1Ch", "2ch": "2Ch", "ezr": "Ezr",
    "ne": "Neh", "et": "Est", "job": "Job", "ps": "Psa", "prv": "Pro",
    "ec": "Ecc", "so": "Sol", "is": "Isa", "jr": "Jer", "lm": "Lam",
    "ez": "Eze", "dn": "Dan", "ho": "Hos", "jl": "Joe", "am": "Amo",
    "ob": "Oba", "jn": "Jon", "mi": "Mic", "na": "Nah", "hk": "Hab",
    "zp": "Zep", "hg": "Hag", "zc": "Zec", "ml": "Mal",
    "mt": "Mat", "mk": "Mar", "lk": "Luk", "jo": "Joh",
    "act": "Act", "rm": "Rom", "1co": "1Co", "2co": "2Co",
    "gl": "Gal", "eph": "Eph", "ph": "Phi", "cl": "Col",
    "1ts": "1Th", "2ts": "2Th", "1tm": "1Ti", "2tm": "2Ti",
    "tt": "Tit", "phm": "Phm", "hb": "Heb", "jm": "Jam",
    "1pe": "1Pe", "2pe": "2Pe", "1jo": "1Jo", "2jo": "2Jo",
    "3jo": "3Jo", "jd": "Jud", "re": "Rev"
};

const OLD_TESTAMENT = ["gn", "ex", "lv", "nm", "dt", "js", "jud", "rt", "1sm", "2sm", "1kgs", "2kgs", "1ch", "2ch", "ezr", "ne", "et", "job", "ps", "prv", "ec", "so", "is", "jr", "lm", "ez", "dn", "ho", "jl", "am", "ob", "jn", "mi", "na", "hk", "zp", "hg", "zc", "ml"];
const NEW_TESTAMENT = ["mt", "mk", "lk", "jo", "act", "rm", "1co", "2co", "gl", "eph", "ph", "cl", "1ts", "2ts", "1tm", "2tm", "tt", "phm", "hb", "jm", "1pe", "2pe", "1jo", "2jo", "3jo", "jd", "re"];

function convertKJV() {
    const inputFile = 'bible-temp/json/en_kjv.json';
    const outputFile = 'public/bible-data/bible-en.json';
    
    console.log(`读取文件: ${inputFile}`);
    let rawDataStr = fs.readFileSync(inputFile, 'utf-8');
    // 移除BOM字符
    if (rawDataStr.charCodeAt(0) === 0xFEFF) {
        rawDataStr = rawDataStr.slice(1);
    }
    const rawData = JSON.parse(rawDataStr);
    
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
