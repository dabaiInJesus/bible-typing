import type { BibleData, BibleBook, BibleChapter } from '../types'

let bibleData: BibleData | null = null

/**
 * 清除缓存
 */
export function clearBibleCache(): void {
  bibleData = null
}

/**
 * 加载圣经数据
 */
export async function loadBibleData(language: 'zh' | 'en' = 'zh'): Promise<BibleData> {
  // 如果已加载且语言相同,直接返回
  if (bibleData && bibleData.version.includes(language === 'zh' ? '和合本' : 'King James')) {
    return bibleData
  }
  
  // 清除缓存
  bibleData = null

  try {
    let data: BibleData
    
    // 检查是否在 Electron 环境中
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI
    
    if (isElectron) {
      // Electron 环境：通过 IPC 直接读取文件内容
      console.log('Loading Bible data via Electron API...')
      data = await (window as any).electronAPI.loadBibleData(`bible-${language}.json`)
      console.log('Successfully loaded Bible data via Electron API')
    } else {
      // 浏览器环境：使用相对路径
      console.log('Loading Bible data via fetch...')
      const response = await fetch(`/bible-data/bible-${language}.json`)
      data = await response.json()
    }
    
    bibleData = data
    return data
  } catch (error) {
    console.error('Failed to load Bible data:', error)
    throw error
  }
}

/**
 * 获取所有书籍列表
 */
export function getBooks(): BibleBook[] {
  if (!bibleData) {
    throw new Error('Bible data not loaded')
  }
  return bibleData.books
}

/**
 * 根据索引获取书籍
 */
export function getBookByIndex(bookIndex: number): BibleBook | undefined {
  if (!bibleData) {
    throw new Error('Bible data not loaded')
  }
  return bibleData.books.find(book => book.bookIndex === bookIndex)
}

/**
 * 根据缩写获取书籍
 */
export function getBookByAbbrev(abbrev: string): BibleBook | undefined {
  if (!bibleData) {
    throw new Error('Bible data not loaded')
  }
  return bibleData.books.find(book => book.abbrev.toLowerCase() === abbrev.toLowerCase())
}

/**
 * 获取指定章节
 */
export function getChapter(bookIndex: number, chapter: number): BibleChapter | undefined {
  const book = getBookByIndex(bookIndex)
  if (!book) {
    return undefined
  }
  return book.chapters.find(ch => ch.chapter === chapter)
}

/**
 * 获取旧约书籍
 */
export function getOldTestamentBooks(): BibleBook[] {
  if (!bibleData) {
    throw new Error('Bible data not loaded')
  }
  return bibleData.books.filter(book => book.testament === 'old')
}

/**
 * 获取新约书籍
 */
export function getNewTestamentBooks(): BibleBook[] {
  if (!bibleData) {
    throw new Error('Bible data not loaded')
  }
  return bibleData.books.filter(book => book.testament === 'new')
}

/**
 * 搜索经文
 */
export function searchVerses(keyword: string, bookIndex?: number): Array<{
  book: BibleBook
  chapter: number
  verse: number
  text: string
}> {
  if (!bibleData) {
    throw new Error('Bible data not loaded')
  }

  const results: Array<{
    book: BibleBook
    chapter: number
    verse: number
    text: string
  }> = []

  const booksToSearch = bookIndex 
    ? [getBookByIndex(bookIndex)].filter(Boolean) as BibleBook[]
    : bibleData.books

  booksToSearch.forEach(book => {
    book.chapters.forEach(chapter => {
      chapter.verses.forEach(verse => {
        if (verse.text.includes(keyword)) {
          results.push({
            book,
            chapter: chapter.chapter,
            verse: verse.verse,
            text: verse.text
          })
        }
      })
    })
  })

  return results
}
