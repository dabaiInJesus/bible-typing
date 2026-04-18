export interface BibleVerse {
  verse: number
  text: string
}

export interface BibleChapter {
  chapter: number
  verses: BibleVerse[]
}

export interface BibleBook {
  name: string
  abbrev: string
  bookIndex: number
  testament: 'old' | 'new'
  chapters: BibleChapter[]
}

export interface BibleData {
  version: string
  version_en: string
  source: string
  totalBooks: number
  totalChapters: number
  totalVerses: number
  books: BibleBook[]
}

export interface TypingProgress {
  bookIndex: number
  chapter: number
  verse: number
  completed: boolean
  accuracy: number
  timestamp: number
}

export interface FavoriteVerse {
  id: string
  bookIndex: number
  chapter: number
  verse: number
  text: string
  note?: string
  createdAt: number
}

export interface ElectronAPI {
  platform: string
  versions: {
    node: string
    chrome: string
    electron: string
  }
  loadBibleData: (filename: string) => Promise<any>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
