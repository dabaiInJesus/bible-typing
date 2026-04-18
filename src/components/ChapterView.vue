<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { BibleBook } from '../types'
import { getChapter } from '../services/bibleService'
import { FavoriteService } from '../services/favoriteService'

const props = defineProps<{
  book: BibleBook
  chapter: number
  verse?: number
}>()

const emit = defineEmits<{
  (e: 'navigate', chapter: number): void
}>()

const theme = inject<'dark' | 'light'>('theme', 'dark')
const updateFavoritesCount = inject<() => void>('updateFavoritesCount', () => {})
const updateTrigger = ref(0)

const chapterData = computed(() => {
  return getChapter(props.book.bookIndex, props.chapter)
})

// 检查经文是否已收藏
function isVerseFavorited(verseNum: number): boolean {
  updateTrigger.value
  return FavoriteService.isFavorited(props.book.bookIndex, props.chapter, verseNum)
}

// 切换收藏状态
function toggleFavorite(verseNum: number, text: string) {
  if (isVerseFavorited(verseNum)) {
    // 取消收藏
    const favorite = FavoriteService.getFavoriteByVerse(props.book.bookIndex, props.chapter, verseNum)
    if (favorite) {
      FavoriteService.removeFavorite(favorite.id)
    }
  } else {
    // 添加收藏
    try {
      FavoriteService.addFavorite({
        bookIndex: props.book.bookIndex,
        chapter: props.chapter,
        verse: verseNum,
        text: text
      })
    } catch (error) {
      console.error('Failed to add favorite:', error)
    }
  }
  // 触发更新
  updateTrigger.value++
  updateFavoritesCount() // 通知父组件更新收藏数量
}

// 上一章
function goToPreviousChapter() {
  if (props.chapter > 1) {
    emit('navigate', props.chapter - 1)
  }
}

// 下一章
function goToNextChapter() {
  const maxChapter = props.book.chapters.length
  if (props.chapter < maxChapter) {
    emit('navigate', props.chapter + 1)
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- 章节内容 -->
    <div v-if="chapterData" class="space-y-4">
      <h3 :class="['text-2xl font-bold text-center mb-6', theme === 'dark' ? 'text-purple-400' : 'text-purple-600']">
        {{ book.name }} 第{{ chapter }}章
      </h3>
      
      <div
        v-for="verse in chapterData.verses"
        :key="verse.verse"
        :class="[
          'p-4 rounded-lg transition-colors duration-300 relative group',
          theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'
        ]"
      >
        <div class="flex gap-3">
          <span :class="['font-semibold text-sm flex-shrink-0 mt-1', theme === 'dark' ? 'text-purple-500' : 'text-purple-600']">
            {{ verse.verse }}
          </span>
          <p :class="['leading-relaxed text-lg flex-1', theme === 'dark' ? 'text-gray-200' : 'text-gray-800']">
            {{ verse.text }}
          </p>
          <!-- 收藏按钮 -->
          <button
            @click="toggleFavorite(verse.verse, verse.text)"
            :class="[
              'absolute top-3 right-3 p-2 rounded-lg transition-all duration-300',
              isVerseFavorited(verse.verse)
                ? (theme === 'dark' ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-red-100 hover:bg-red-200')
                : 'opacity-0 group-hover:opacity-100 ' + (theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
            ]"
            :title="isVerseFavorited(verse.verse) ? '取消收藏' : '收藏'"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5" 
              :class="isVerseFavorited(verse.verse) ? 'text-red-500' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')"
              :fill="isVerseFavorited(verse.verse) ? 'currentColor' : 'none'" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else :class="['text-center py-12', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
      <p>无法加载章节内容</p>
    </div>

    <!-- 章节导航 -->
    <div v-if="chapterData" class="flex items-center justify-between mt-8 pt-6 border-t" :class="theme === 'dark' ? 'border-gray-700' : 'border-gray-200'">
      <!-- 章节信息 -->
      <span :class="['text-sm font-medium', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">
        第 {{ chapter }} / {{ book.chapters.length }} 章
      </span>

      <!-- 导航按钮组 -->
      <div class="flex items-center gap-3">
        <!-- 上一章按钮 -->
        <button
          @click="goToPreviousChapter"
          :disabled="chapter <= 1"
          :class="[
            'px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2',
            chapter <= 1
              ? (theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
              : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          上一章
        </button>

        <!-- 下一章按钮 -->
        <button
          @click="goToNextChapter"
          :disabled="chapter >= book.chapters.length"
          :class="[
            'px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2',
            chapter >= book.chapters.length
              ? (theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
              : (theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white')
          ]"
        >
          下一章
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-gray-750 {
  background-color: #2d3748;
}
</style>
