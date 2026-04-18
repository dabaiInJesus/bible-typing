import type { TypingProgress } from '../types'

const STORAGE_KEY = 'bible-typing-progress'

export class ProgressService {
  /**
   * 获取所有抄录进度
   */
  static getAllProgress(): TypingProgress[] {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  /**
   * 保存或更新抄录进度
   */
  static saveProgress(progress: TypingProgress): void {
    const allProgress = this.getAllProgress()
    const index = allProgress.findIndex(
      p => p.bookIndex === progress.bookIndex && 
           p.chapter === progress.chapter && 
           p.verse === progress.verse
    )

    if (index >= 0) {
      // 更新现有进度
      allProgress[index] = progress
    } else {
      // 添加新进度
      allProgress.push(progress)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
  }

  /**
   * 获取指定章节的进度
   */
  static getChapterProgress(bookIndex: number, chapter: number): TypingProgress[] {
    const allProgress = this.getAllProgress()
    return allProgress.filter(
      p => p.bookIndex === bookIndex && p.chapter === chapter
    )
  }

  /**
   * 获取指定经节的进度
   */
  static getVerseProgress(bookIndex: number, chapter: number, verse: number): TypingProgress | null {
    const allProgress = this.getAllProgress()
    return allProgress.find(
      p => p.bookIndex === bookIndex && 
           p.chapter === chapter && 
           p.verse === verse
    ) || null
  }

  /**
   * 计算章节完成度
   */
  static getChapterCompletionRate(bookIndex: number, chapter: number, totalVerses: number): number {
    const progress = this.getChapterProgress(bookIndex, chapter)
    const completedCount = progress.filter(p => p.completed).length
    return totalVerses > 0 ? Math.round((completedCount / totalVerses) * 100) : 0
  }

  /**
   * 删除进度记录
   */
  static deleteProgress(bookIndex: number, chapter: number, verse: number): void {
    const allProgress = this.getAllProgress()
    const filtered = allProgress.filter(
      p => !(p.bookIndex === bookIndex && 
             p.chapter === chapter && 
             p.verse === verse)
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  }

  /**
   * 清除所有进度
   */
  static clearAllProgress(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * 获取统计信息
   */
  static getStatistics(): {
    totalVerses: number        // 已练习过的经节数
    completedVerses: number    // 已完成的经节数
    averageAccuracy: number    // 平均准确率
    totalBibleVerses: number   // 圣经总经节数(用于计算总体完成进度)
  } {
    const allProgress = this.getAllProgress()
    const completedVerses = allProgress.filter(p => p.completed).length
    const completedWithAccuracy = allProgress.filter(p => p.accuracy > 0)
    const averageAccuracy = completedWithAccuracy.length > 0
      ? Math.round(completedWithAccuracy.reduce((sum, p) => sum + p.accuracy, 0) / completedWithAccuracy.length)
      : 0

    // 圣经总经节数(基于KJV版本)
    const totalBibleVerses = 31100

    return {
      totalVerses: allProgress.length,
      completedVerses,
      averageAccuracy,
      totalBibleVerses
    }
  }
}
