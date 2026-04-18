<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import type { BibleBook } from '../types'
import { getChapter } from '../services/bibleService'
import { ProgressService } from '../services/progressService'
import { FavoriteService } from '../services/favoriteService'

const props = defineProps<{
  book: BibleBook
  chapter: number
  verse?: number
}>()

const theme = inject<'dark' | 'light'>('theme', 'dark')
const updateFavoritesCount = inject<() => void>('updateFavoritesCount', () => {})
const updateTrigger = ref(0)

const chapterData = computed(() => {
  return getChapter(props.book.bookIndex, props.chapter)
})

const selectedVerse = ref<number>(props.verse || 1)
const userInput = ref('')
const startTime = ref<number | null>(null)
const isCompleted = ref(false)

const currentVerseText = computed(() => {
  if (!chapterData.value) return ''
  const verse = chapterData.value.verses.find(v => v.verse === selectedVerse.value)
  return verse?.text || ''
})

const progress = computed(() => {
  if (!chapterData.value) return null
  return ProgressService.getVerseProgress(
    props.book.bookIndex,
    props.chapter,
    selectedVerse.value
  )
})

const accuracy = computed(() => {
  if (!userInput.value || !currentVerseText.value) return 0
  
  const input = userInput.value
  const target = currentVerseText.value
  let correct = 0
  
  for (let i = 0; i < Math.min(input.length, target.length); i++) {
    if (input[i] === target[i]) {
      correct++
    }
  }
  
  return Math.round((correct / target.length) * 100)
})

// 计算打字速度 (WPM - Words Per Minute)
const wpm = computed(() => {
  if (!startTime.value || !userInput.value) return 0
  
  const currentTime = isCompleted.value ? (progress.value?.timestamp || Date.now()) : Date.now()
  const timeElapsed = (currentTime - startTime.value) / 1000 / 60 // 转换为分钟
  
  if (timeElapsed === 0) return 0
  
  // 中文字符按字数计算，英文按单词数计算
  const charCount = userInput.value.length
  // 假设平均每个词5个字符（包括空格）
  const wordCount = charCount / 5
  
  return Math.round(wordCount / timeElapsed)
})

const highlightedText = computed(() => {
  const target = currentVerseText.value
  const input = userInput.value
  
  return target.split('').map((char, index) => {
    if (index >= input.length) {
      return { char, status: 'pending' }
    }
    return {
      char,
      status: input[index] === char ? 'correct' : 'incorrect'
    }
  })
})

function handleInput() {
  if (!startTime.value) {
    startTime.value = Date.now()
  }
  
  // 检查是否完成
  if (userInput.value === currentVerseText.value) {
    completeTyping()
  }
}

// 处理键盘事件
function handleKeydown(event: KeyboardEvent) {
  // 检测回车键
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    
    // 如果已完成且不是最后一节,跳转到下一节
    if (isCompleted.value && selectedVerse.value < (chapterData.value?.verses.length || 0)) {
      selectVerse(selectedVerse.value + 1)
    }
  }
}

function completeTyping() {
  if (isCompleted.value) return
  
  isCompleted.value = true
  const endTime = Date.now()
  
  // 保存进度
  ProgressService.saveProgress({
    bookIndex: props.book.bookIndex,
    chapter: props.chapter,
    verse: selectedVerse.value,
    completed: true,
    accuracy: accuracy.value,
    timestamp: endTime
  })
}

function resetTyping() {
  userInput.value = ''
  startTime.value = null
  isCompleted.value = false
}

function selectVerse(verse: number) {
  selectedVerse.value = verse
  resetTyping()
}

watch(selectedVerse, () => {
  resetTyping()
})

// 监听外部传入的 verse 变化
watch(() => props.verse, (newVerse) => {
  if (newVerse && newVerse !== selectedVerse.value) {
    selectedVerse.value = newVerse
    resetTyping()
  }
})

// 检查指定经节是否已完成
function isVerseCompletedByIndex(verseNum: number): boolean {
  const progress = ProgressService.getVerseProgress(
    props.book.bookIndex,
    props.chapter,
    verseNum
  )
  return progress?.completed || false
}

// 检查经文是否已收藏
function isVerseFavorited(verseNum: number): boolean {
  updateTrigger.value
  return FavoriteService.isFavorited(props.book.bookIndex, props.chapter, verseNum)
}

// 切换收藏状态
function toggleFavorite() {
  if (isVerseFavorited(selectedVerse.value)) {
    // 取消收藏
    const favorite = FavoriteService.getFavoriteByVerse(props.book.bookIndex, props.chapter, selectedVerse.value)
    if (favorite) {
      FavoriteService.removeFavorite(favorite.id)
    }
  } else {
    // 添加收藏
    try {
      FavoriteService.addFavorite({
        bookIndex: props.book.bookIndex,
        chapter: props.chapter,
        verse: selectedVerse.value,
        text: currentVerseText.value
      })
    } catch (error) {
      console.error('Failed to add favorite:', error)
    }
  }
  // 触发更新
  updateTrigger.value++
  updateFavoritesCount() // 通知父组件更新收藏数量
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- 经节选择器 -->
    <div v-if="chapterData" :class="['mb-5 rounded-lg p-4 transition-colors duration-300', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
      <h4 :class="['text-sm font-semibold mb-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">选择经节:</h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="verse in chapterData.verses"
          :key="verse.verse"
          @click="selectVerse(verse.verse)"
          :class="[
            'px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 relative',
            selectedVerse === verse.verse
              ? (theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
              : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
          ]"
        >
          <span>{{ verse.verse }}</span>
          <!-- 已完成标记 -->
          <svg 
            v-if="isVerseCompletedByIndex(verse.verse)" 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-3 w-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          <!-- 收藏标记 -->
          <svg 
            v-if="isVerseFavorited(verse.verse)" 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-3 w-3 text-red-500" 
            fill="currentColor" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 原文显示区 -->
    <div :class="['mb-5 rounded-lg p-5 transition-colors duration-300 relative group', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
      <div class="flex items-start gap-3 mb-3">
        <span :class="['font-bold text-lg', theme === 'dark' ? 'text-purple-500' : 'text-purple-600']">{{ selectedVerse }}</span>
        <div class="flex-1">
          <p class="text-xl leading-relaxed">
            <span
              v-for="(item, index) in highlightedText"
              :key="index"
              :class="[
                item.status === 'correct' ? 'text-green-400' :
                item.status === 'incorrect' ? (theme === 'dark' ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-100') :
                (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
              ]"
            >
              {{ item.char }}
            </span>
          </p>
        </div>
        <!-- 收藏按钮 -->
        <button
          @click="toggleFavorite"
          :class="[
            'absolute top-3 right-3 p-2 rounded-lg transition-all duration-300',
            isVerseFavorited(selectedVerse)
              ? (theme === 'dark' ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-red-100 hover:bg-red-200')
              : 'opacity-0 group-hover:opacity-100 ' + (theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
          ]"
          :title="isVerseFavorited(selectedVerse) ? '取消收藏' : '收藏'"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-5 w-5" 
            :class="isVerseFavorited(selectedVerse) ? 'text-red-500' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')"
            :fill="isVerseFavorited(selectedVerse) ? 'currentColor' : 'none'" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="mb-5">
      <textarea
        v-model="userInput"
        @input="handleInput"
        @keydown="handleKeydown"
        :readonly="isCompleted"
        placeholder="在此输入经文..."
        rows="5"
        :class="[
          'w-full px-4 py-3 border-2 rounded-lg text-lg leading-relaxed focus:outline-none transition-colors resize-none',
          isCompleted
            ? (theme === 'dark' ? 'border-green-500 text-green-400 bg-gray-800 cursor-not-allowed' : 'border-green-500 text-green-600 bg-white cursor-not-allowed')
            : (theme === 'dark' ? 'border-gray-700 focus:border-purple-500 text-gray-200 bg-gray-800' : 'border-gray-300 focus:border-purple-500 text-gray-800 bg-white')
        ]"
      ></textarea>
      
      <!-- 上次完成信息 -->
      <div v-if="progress" :class="['mt-3 rounded-lg p-3 text-center transition-colors duration-300', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
        <div class="flex items-center justify-center gap-6 text-sm">
          <div>
            <span :class="[theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">上次完成:</span>
            <span :class="['ml-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-700']">
              {{ new Date(progress.timestamp).toLocaleString('zh-CN') }}
            </span>
          </div>
          <div>
            <span :class="[theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">上次准确率:</span>
            <span class="ml-2 font-semibold text-purple-400">
              {{ progress.accuracy }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-4 gap-3 mb-5">
      <div :class="['rounded-lg p-3 text-center transition-colors duration-300', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
        <div class="text-2xl font-bold text-purple-400">{{ accuracy }}%</div>
        <div :class="['text-xs mt-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">准确率</div>
      </div>
      <div :class="['rounded-lg p-3 text-center transition-colors duration-300', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
        <div :class="['text-2xl font-bold', theme === 'dark' ? 'text-blue-400' : 'text-blue-600']">
          {{ wpm }}
        </div>
        <div :class="['text-xs mt-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">速度 (WPM)</div>
      </div>
      <div :class="['rounded-lg p-3 text-center transition-colors duration-300', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
        <div :class="['text-2xl font-bold', theme === 'dark' ? 'text-blue-400' : 'text-blue-600']">
          {{ userInput.length }}/{{ currentVerseText.length }}
        </div>
        <div :class="['text-xs mt-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">字符数</div>
      </div>
      <div :class="['rounded-lg p-3 text-center transition-colors duration-300', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
        <div class="text-2xl font-bold" :class="isCompleted ? 'text-green-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')">
          {{ isCompleted ? '✓' : '○' }}
        </div>
        <div :class="['text-xs mt-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">状态</div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-3">
      <button
        @click="resetTyping"
        :class="[
          'flex-1 px-5 py-2.5 rounded-lg font-semibold transition-colors',
          theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        ]"
      >
        重置
      </button>
      <button
        v-if="isCompleted && selectedVerse < (chapterData?.verses.length || 0)"
        @click="selectVerse(selectedVerse + 1)"
        class="flex-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors text-white"
      >
        下一节 →
      </button>
    </div>

    <!-- 快捷键提示 -->
    <div v-if="isCompleted" :class="['mt-3 text-center text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
      按 <kbd :class="['px-2 py-1 rounded text-xs', theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600']">Enter</kbd> 跳转到下一节
    </div>

    <!-- 完成提示 -->
    <div
      v-if="isCompleted"
      :class="['mt-5 p-3 border rounded-lg text-center', theme === 'dark' ? 'bg-green-900/30 border-green-500' : 'bg-green-50 border-green-500']"
    >
      <p class="text-green-400 font-semibold text-base">✓ 完成!</p>
      <p :class="['text-xs mt-1', theme === 'dark' ? 'text-green-300' : 'text-green-600']">准确率: {{ accuracy }}%</p>
    </div>
  </div>
</template>
