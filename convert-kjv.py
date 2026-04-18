#!/usr/bin/env python3
"""
将 thiagobodruk/bible 的 KJV JSON 格式转换为项目所需格式
"""

import json

# 书卷名称映射 (英文缩写 -> 英文全名)
BOOK_NAMES = {
    "gn": "Genesis",
    "ex": "Exodus",
    "lv": "Leviticus",
    "nm": "Numbers",
    "dt": "Deuteronomy",
    "js": "Joshua",
    "jg": "Judges",
    "rt": "Ruth",
    "1s": "1 Samuel",
    "2s": "2 Samuel",
    "1k": "1 Kings",
    "2k": "2 Kings",
    "1c": "1 Chronicles",
    "2c": "2 Chronicles",
    "ez": "Ezra",
    "ne": "Nehemiah",
    "es": "Esther",
    "jb": "Job",
    "ps": "Psalms",
    "pr": "Proverbs",
    "ec": "Ecclesiastes",
    "sg": "Song of Solomon",
    "is": "Isaiah",
    "jr": "Jeremiah",
    "lm": "Lamentations",
    "ezk": "Ezekiel",
    "dn": "Daniel",
    "hs": "Hosea",
    "jl": "Joel",
    "am": "Amos",
    "ob": "Obadiah",
    "jn": "Jonah",
    "mc": "Micah",
    "nm": "Nahum",
    "hb": "Habakkuk",
    "zp": "Zephaniah",
    "hg": "Haggai",
    "zc": "Zechariah",
    "ml": "Malachi",
    "mt": "Matthew",
    "mk": "Mark",
    "lk": "Luke",
    "jhn": "John",
    "act": "Acts",
    "rom": "Romans",
    "1co": "1 Corinthians",
    "2co": "2 Corinthians",
    "gal": "Galatians",
    "eph": "Ephesians",
    "php": "Philippians",
    "col": "Colossians",
    "1th": "1 Thessalonians",
    "2th": "2 Thessalonians",
    "1tm": "1 Timothy",
    "2tm": "2 Timothy",
    "tit": "Titus",
    "phm": "Philemon",
    "heb": "Hebrews",
    "jas": "James",
    "1pe": "1 Peter",
    "2pe": "2 Peter",
    "1jn": "1 John",
    "2jn": "2 John",
    "3jn": "3 John",
    "jud": "Jude",
    "rev": "Revelation"
}

# 书卷缩写映射
BOOK_ABBREVS = {
    "gn": "Gen",
    "ex": "Exo",
    "lv": "Lev",
    "nm": "Num",
    "dt": "Deu",
    "js": "Jos",
    "jg": "Jdg",
    "rt": "Rut",
    "1s": "1Sa",
    "2s": "2Sa",
    "1k": "1Ki",
    "2k": "2Ki",
    "1c": "1Ch",
    "2c": "2Ch",
    "ez": "Ezr",
    "ne": "Neh",
    "es": "Est",
    "jb": "Job",
    "ps": "Psa",
    "pr": "Pro",
    "ec": "Ecc",
    "sg": "Sol",
    "is": "Isa",
    "jr": "Jer",
    "lm": "Lam",
    "ezk": "Eze",
    "dn": "Dan",
    "hs": "Hos",
    "jl": "Joe",
    "am": "Amo",
    "ob": "Oba",
    "jn": "Jon",
    "mc": "Mic",
    "nm": "Nah",
    "hb": "Hab",
    "zp": "Zep",
    "hg": "Hag",
    "zc": "Zec",
    "ml": "Mal",
    "mt": "Mat",
    "mk": "Mar",
    "lk": "Luk",
    "jhn": "Joh",
    "act": "Act",
    "rom": "Rom",
    "1co": "1Co",
    "2co": "2Co",
    "gal": "Gal",
    "eph": "Eph",
    "php": "Phi",
    "col": "Col",
    "1th": "1Th",
    "2th": "2Th",
    "1tm": "1Ti",
    "2tm": "2Ti",
    "tit": "Tit",
    "phm": "Phm",
    "heb": "Heb",
    "jas": "Jam",
    "1pe": "1Pe",
    "2pe": "2Pe",
    "1jn": "1Jo",
    "2jn": "2Jo",
    "3jn": "3Jo",
    "jud": "Jud",
    "rev": "Rev"
}

# 旧约和新约的书卷
OLD_TESTAMENT = ["gn", "ex", "lv", "nm", "dt", "js", "jg", "rt", "1s", "2s", "1k", "2k", "1c", "2c", "ez", "ne", "es", "jb", "ps", "pr", "ec", "sg", "is", "jr", "lm", "ezk", "dn", "hs", "jl", "am", "ob", "jn", "mc", "nm", "hb", "zp", "hg", "zc", "ml"]
NEW_TESTAMENT = ["mt", "mk", "lk", "jhn", "act", "rom", "1co", "2co", "gal", "eph", "php", "col", "1th", "2th", "1tm", "2tm", "tit", "phm", "heb", "jas", "1pe", "2pe", "1jn", "2jn", "3jn", "jud", "rev"]

def convert_kjv_to_project_format(input_file, output_file):
    """转换KJV JSON为项目格式"""
    
    print(f"读取文件: {input_file}")
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        raw_data = json.load(f)
    
    print(f"共 {len(raw_data)} 卷书")
    
    books = []
    book_index = 1
    
    for book_data in raw_data:
        abbrev_key = book_data['abbrev']
        
        # 确定是旧约还是新约
        testament = "old" if abbrev_key in OLD_TESTAMENT else "new"
        
        # 构建章节数据
        chapters = []
        for chapter_num, verses in enumerate(book_data['chapters'], 1):
            verse_list = []
            for verse_num, verse_text in enumerate(verses, 1):
                verse_list.append({
                    "verse": verse_num,
                    "text": verse_text
                })
            
            chapters.append({
                "chapter": chapter_num,
                "verses": verse_list
            })
        
        # 构建书卷数据
        book = {
            "name": BOOK_NAMES.get(abbrev_key, abbrev_key.upper()),
            "abbrev": BOOK_ABBREVS.get(abbrev_key, abbrev_key.upper()),
            "bookIndex": book_index,
            "testament": testament,
            "chapters": chapters
        }
        
        books.append(book)
        book_index += 1
        print(f"  处理: {book['name']} ({len(chapters)} 章)")
    
    # 构建最终数据结构
    output_data = {
        "version": "King James Version",
        "version_en": "King James Version",
        "source": "https://github.com/thiagobodruk/bible",
        "totalBooks": len(books),
        "totalChapters": sum(len(book['chapters']) for book in books),
        "totalVerses": sum(
            sum(len(chapter['verses']) for chapter in book['chapters'])
            for book in books
        ),
        "books": books
    }
    
    # 写入文件
    print(f"\n写入文件: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n完成!")
    print(f"  书卷数: {output_data['totalBooks']}")
    print(f"  章节数: {output_data['totalChapters']}")
    print(f"  经节数: {output_data['totalVerses']}")

if __name__ == "__main__":
    input_file = "bible-temp/json/en_kjv.json"
    output_file = "public/bible-data/bible-en.json"
    
    convert_kjv_to_project_format(input_file, output_file)
