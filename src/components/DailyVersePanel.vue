，<script setup lang="ts">
import { inject, ref, onMounted, computed, type ComputedRef } from 'vue'
import { FavoriteService } from '../services/favoriteService'
import { getBookByIndex } from '../services/bibleService'

const theme = inject<'dark' | 'light'>('theme', 'dark')
// inject 返回的是 computed ref，需要包装成本地 computed 以确保响应式
const injectedFavoritesCount = inject<ComputedRef<number> | number>('favoritesCount', 0)
const favoritesCount = computed(() => {
  return typeof injectedFavoritesCount === 'number' 
    ? injectedFavoritesCount 
    : (injectedFavoritesCount as ComputedRef<number>).value
})

// 定义事件
const emit = defineEmits<{
  (e: 'toggleFavorites'): void
}>()

// 每日金句相关
const dailyVerse = ref<{ text: string; reference: string } | null>(null)
const scrollIndex = ref(0)
let scrollInterval: number | null = null

onMounted(() => {
  // 加载每日金句
  loadDailyVerses()
  
  // 启动滚动
  startScrolling()
  
  // 组件卸载时清除定时器
  return () => {
    if (scrollInterval) {
      clearInterval(scrollInterval)
    }
  }
})

// 加载每日金句
function loadDailyVerses() {
  try {
    // 使用 getDailyRandomVerse 确保每天显示相同的金句
    const verse = FavoriteService.getDailyRandomVerse()
    
    if (verse) {
      // 有收藏时，从收藏中随机选择
      try {
        const bookName = getBookName(verse.bookIndex)
        dailyVerse.value = {
          text: verse.text,
          reference: `${bookName} ${verse.chapter}:${verse.verse}`
        }
      } catch (bookError) {
        // 如果获取书名失败（圣经数据未加载），使用书卷索引作为临时显示
        dailyVerse.value = {
          text: verse.text,
          reference: `书卷${verse.bookIndex} ${verse.chapter}:${verse.verse}`
        }
      }
    } else {
      // 没有收藏时，显示默认金句
      dailyVerse.value = {
        text: '你的话是我脚前的灯，是我路上的光。',
        reference: '诗篇 119:105'
      }
    }
  } catch (error) {
    // 静默处理错误，直接显示默认金句
    dailyVerse.value = {
      text: '你的话是我脚前的灯，是我路上的光。',
      reference: '诗篇 119:105'
    }
  }
}

// 启动滚动效果
function startScrolling() {
  if (!dailyVerse.value) return
  
  // 每60秒切换一次显示位置（模拟滚动）
  scrollInterval = window.setInterval(() => {
    scrollIndex.value = (scrollIndex.value + 1) % 3
  }, 60000)
}

// 获取书籍名称
function getBookName(bookIndex: number): string {
  try {
    const book = getBookByIndex(bookIndex)
    return book?.name || `书卷${bookIndex}`
  } catch (error) {
    // 如果圣经数据未加载，抛出错误以便上层处理
    throw new Error('Bible data not loaded')
  }
}
</script>

<template>
  <!-- 每日金句 -->
  <div :class="['rounded-lg border transition-all duration-300 mx-3 mb-3 mt-[10px] pt-[11px] pr-4 pb-4 pl-4', theme === 'dark' ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-700/30' : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200']">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span :class="['text-sm font-semibold', theme === 'dark' ? 'text-red-400' : 'text-red-600']">每日金句</span>
      </div>
      
      <!-- 查看收藏按钮 -->
      <button
        @click="$emit('toggleFavorites')"
        :class="[
          'relative p-2 rounded-lg transition-all duration-300',
          theme === 'dark' 
            ? 'hover:bg-yellow-900/30 text-yellow-500 hover:text-yellow-400' 
            : 'hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700'
        ]"
        title="查看收藏"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <!-- 红色徽标 -->
        <span v-if="favoritesCount && favoritesCount > 0" :class="[
          'absolute top-0 right-0 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm',
          favoritesCount > 99 ? 'text-[7px]' : '',
          'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
        ]">
          {{ favoritesCount > 99 ? '99+' : favoritesCount }}
        </span>
      </button>
    </div>
    
    <!-- 金句内容 - 带滚动动画 -->
    <div class="relative overflow-hidden min-h-[150px]">
      <transition name="slide-fade" mode="out-in">
        <div v-if="dailyVerse" :key="scrollIndex" class="absolute inset-0">
          <p :class="['text-base leading-relaxed italic mb-2', theme === 'dark' ? 'text-gray-200' : 'text-gray-800']">
            "{{ dailyVerse.text }}"
          </p>
          <p :class="['text-xs text-right font-medium mt-2', theme === 'dark' ? 'text-red-400' : 'text-red-700']">
            —— {{ dailyVerse.reference }}
          </p>
        </div>
        <div v-else class="absolute inset-0 flex items-center justify-center">
          <p :class="['text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">加载中...</p>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
/* 滚动动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
