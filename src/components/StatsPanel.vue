<script setup lang="ts">
import { computed, inject, ref, onMounted } from 'vue'
import type { BibleBook } from '../types'
import { ProgressService } from '../services/progressService'
import { getChapter } from '../services/bibleService'

const props = defineProps<{
  currentBook: BibleBook | null
  currentChapter: number
}>()

const theme = inject<'dark' | 'light'>('theme', 'dark')

// 用于触发重新计算的响应式变量
const updateTrigger = ref(0)

// 监听 storage 事件,当其他标签页或窗口修改 localStorage 时更新
onMounted(() => {
  window.addEventListener('storage', () => {
    updateTrigger.value++
  })
  
  // 定期检查更新(每秒)
  const interval = setInterval(() => {
    updateTrigger.value++
  }, 1000)
  
  // 组件卸载时清除定时器
  return () => clearInterval(interval)
})

const stats = computed(() => {
  // 依赖 updateTrigger,确保数据实时更新
  updateTrigger.value
  return ProgressService.getStatistics()
})

// 计算本章完成进度
const chapterProgress = computed(() => {
  // 依赖 updateTrigger,确保数据实时更新
  updateTrigger.value
  
  if (!props.currentBook) return { completed: 0, total: 0, percentage: 0 }
  
  const chapterData = getChapter(props.currentBook.bookIndex, props.currentChapter)
  if (!chapterData) return { completed: 0, total: 0, percentage: 0 }
  
  const totalVerses = chapterData.verses.length
  let completedVerses = 0
  
  for (let i = 1; i <= totalVerses; i++) {
    const progress = ProgressService.getVerseProgress(
      props.currentBook.bookIndex,
      props.currentChapter,
      i
    )
    if (progress?.completed) {
      completedVerses++
    }
  }
  
  const percentage = totalVerses > 0 ? Math.round((completedVerses / totalVerses) * 100) : 0
  
  return {
    completed: completedVerses,
    total: totalVerses,
    percentage
  }
})



function clearAllData() {
  if (confirm('确定要清除所有抄录进度吗?此操作不可恢复!')) {
    ProgressService.clearAllProgress()
    // 手动触发更新
    updateTrigger.value++
  }
}
</script>

<template>
  <div :class="['rounded-lg p-6 transition-colors duration-300', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
    <h3 :class="['text-xl font-bold mb-6 flex items-center gap-2', theme === 'dark' ? 'text-purple-400' : 'text-purple-600']">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      抄录统计
    </h3>
    
    <!-- 统计数据 - 横向进度条 -->
    <div class="space-y-4 mb-6">
      <!-- 书卷章节进度和准确率 -->
      <div v-if="currentBook && chapterProgress.total > 0" :class="['rounded-lg p-3', theme === 'dark' ? 'bg-gray-700/50' : 'bg-white']">
        <div class="flex items-center justify-between mb-2">
          <span :class="['text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700']">
            {{ currentBook.name }} 第{{ currentChapter }}章
          </span>
          <span :class="['text-xs font-bold', theme === 'dark' ? 'text-green-400' : 'text-green-600']">{{ chapterProgress.percentage }}%</span>
        </div>
        
        <!-- 进度条 -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <span :class="['text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
              完成进度
            </span>
            <span :class="['text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500']">
              {{ chapterProgress.completed }}/{{ chapterProgress.total }} 节
            </span>
          </div>
          <div :class="['w-full rounded-full h-2 overflow-hidden', theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200']">
            <div
              class="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${chapterProgress.percentage}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 总体进度和准确率 -->
    <div v-if="stats.totalBibleVerses > 0" :class="['mb-6 rounded-lg p-4', theme === 'dark' ? 'bg-gray-700/50' : 'bg-white']">
      <div class="flex items-center justify-between mb-2">
        <span :class="['text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700']">总体统计</span>
        <span :class="['text-xs font-bold', theme === 'dark' ? 'text-purple-400' : 'text-purple-600']">
          {{ stats.totalBibleVerses > 0 ? Math.round((stats.completedVerses / stats.totalBibleVerses) * 100) : 0 }}%
        </span>
      </div>
      
      <!-- 进度条 -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <span :class="['text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
            完成进度
          </span>
          <span :class="['text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500']">
            {{ stats.completedVerses }}/{{ stats.totalBibleVerses }} 节
          </span>
        </div>
        <div :class="['w-full rounded-full h-2.5 overflow-hidden', theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200']">
          <div
            class="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${stats.totalBibleVerses > 0 ? (stats.completedVerses / stats.totalBibleVerses) * 100 : 0}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="mb-6">
      <!-- 清除所有进度按钮 -->
      <button
        @click="clearAllData"
        :class="[
          'w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2',
          theme === 'dark' 
            ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700/50' 
            : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
        ]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        清除所有进度
      </button>
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
