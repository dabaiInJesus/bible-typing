import type { FavoriteVerse } from '../types'

const STORAGE_KEY = 'bible-favorites'

export class FavoriteService {
  /**
   * 获取所有收藏的金句
   */
  static getAllFavorites(): FavoriteVerse[] {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  /**
   * 添加收藏
   */
  static addFavorite(favorite: Omit<FavoriteVerse, 'id' | 'createdAt'>): FavoriteVerse {
    const allFavorites = this.getAllFavorites()
    
    // 检查是否已存在
    const exists = allFavorites.find(
      f => f.bookIndex === favorite.bookIndex && 
           f.chapter === favorite.chapter && 
           f.verse === favorite.verse
    )
    
    if (exists) {
      throw new Error('该经文已被收藏')
    }
    
    const newFavorite: FavoriteVerse = {
      ...favorite,
      id: this.generateId(),
      createdAt: Date.now()
    }
    
    allFavorites.push(newFavorite)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allFavorites))
    
    return newFavorite
  }

  /**
   * 删除收藏
   */
  static removeFavorite(id: string): void {
    const allFavorites = this.getAllFavorites()
    const filtered = allFavorites.filter(f => f.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  }

  /**
   * 检查经文是否已收藏
   */
  static isFavorited(bookIndex: number, chapter: number, verse: number): boolean {
    const allFavorites = this.getAllFavorites()
    return allFavorites.some(
      f => f.bookIndex === bookIndex && 
           f.chapter === chapter && 
           f.verse === verse
    )
  }

  /**
   * 获取指定经节的收藏信息
   */
  static getFavoriteByVerse(bookIndex: number, chapter: number, verse: number): FavoriteVerse | null {
    const allFavorites = this.getAllFavorites()
    return allFavorites.find(
      f => f.bookIndex === bookIndex && 
           f.chapter === chapter && 
           f.verse === verse
    ) || null
  }

  /**
   * 更新收藏备注
   */
  static updateNote(id: string, note: string): void {
    const allFavorites = this.getAllFavorites()
    const index = allFavorites.findIndex(f => f.id === id)
    
    if (index >= 0) {
      allFavorites[index].note = note
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allFavorites))
    }
  }

  /**
   * 获取随机金句（每日一句）
   */
  static getDailyRandomVerse(): FavoriteVerse | null {
    const allFavorites = this.getAllFavorites()
    
    if (allFavorites.length === 0) {
      return null
    }
    
    // 基于当前日期生成种子，确保同一天显示相同的金句
    const today = new Date()
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    
    // 使用种子生成伪随机索引
    const randomIndex = this.seedRandom(seed, allFavorites.length)
    
    return allFavorites[randomIndex]
  }

  /**
   * 获取多个随机金句用于滚动展示
   */
  static getRandomVerses(count: number = 5): FavoriteVerse[] {
    const allFavorites = this.getAllFavorites()
    
    if (allFavorites.length === 0) {
      return []
    }
    
    // 如果收藏数量少于请求数量，返回全部
    if (allFavorites.length <= count) {
      return [...allFavorites]
    }
    
    // 随机选择指定数量的金句
    const shuffled = [...allFavorites].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  /**
   * 获取收藏统计信息
   */
  static getStatistics(): {
    totalFavorites: number
    recentCount: number  // 最近7天收藏的数量
  } {
    const allFavorites = this.getAllFavorites()
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    return {
      totalFavorites: allFavorites.length,
      recentCount: allFavorites.filter(f => f.createdAt > sevenDaysAgo).length
    }
  }

  /**
   * 清除所有收藏
   */
  static clearAllFavorites(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 基于种子的伪随机数生成器
   */
  private static seedRandom(seed: number, max: number): number {
    const x = Math.sin(seed) * 10000
    return Math.floor((x - Math.floor(x)) * max)
  }
}
