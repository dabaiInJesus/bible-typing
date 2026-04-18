<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { FavoriteService } from '../services/favoriteService'
import { getBookByIndex } from '../services/bibleService'

const theme = inject<'dark' | 'light'>('theme', 'dark')
const updateFavoritesCount = inject<() => void>('updateFavoritesCount', () => {})
const updateTrigger = ref(0)

// 搜索相关
const searchKeyword = ref('')

// 定义事件
const emit = defineEmits<{
  (e: 'navigate', bookIndex: number, chapter: number, verse: number): void
}>()

// 获取所有收藏的金句
const allFavorites = computed(() => {
  updateTrigger.value
  return FavoriteService.getAllFavorites()
})

// 过滤后的收藏列表
const filteredFavorites = computed(() => {
  if (!searchKeyword.value || searchKeyword.value.trim().length === 0) {
    return allFavorites.value
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim()
  return allFavorites.value.filter(favorite => {
    const bookName = getBookName(favorite.bookIndex).toLowerCase()
    const text = favorite.text.toLowerCase()
    const reference = `${favorite.chapter}:${favorite.verse}`
    
    return bookName.includes(keyword) || 
           text.includes(keyword) || 
           reference.includes(keyword)
  })
})

// 删除收藏
function removeFavorite(id: string, event: Event) {
  event.stopPropagation() // 阻止事件冒泡
  if (confirm('确定要取消收藏这条金句吗？')) {
    FavoriteService.removeFavorite(id)
    updateTrigger.value++
    updateFavoritesCount() // 通知父组件更新收藏数量
  }
}

// 清除所有收藏
function clearAllFavorites() {
  if (confirm('确定要清除所有收藏的金句吗？此操作不可恢复！')) {
    FavoriteService.clearAllFavorites()
    updateTrigger.value++
    updateFavoritesCount() // 通知父组件更新收藏数量
  }
}

// 获取书籍名称
function getBookName(bookIndex: number): string {
  const book = getBookByIndex(bookIndex)
  return book?.name || `书卷${bookIndex}`
}

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

// 点击金句，导航到对应位置
function navigateToVerse(favorite: any) {
  emit('navigate', favorite.bookIndex, favorite.chapter, favorite.verse)
}

// 高亮关键词
function highlightKeyword(text: string, keyword: string): string {
  if (!keyword || !text) return text
  
  // 转义特殊字符
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // 创建正则表达式，忽略大小写
  const regex = new RegExp(`(${escapedKeyword})`, 'gi')
  
  // 替换为带高亮的 HTML
  return text.replace(regex, '<mark class="bg-yellow-400 text-gray-900 px-1 rounded">$1</mark>')
}
</script>

<template>
  <div :class="['rounded-lg p-6 transition-colors duration-300', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
    <!-- 标题和搜索框 -->
    <div class="flex items-center justify-between mb-6">
      <h3 :class="['text-xl font-bold flex items-center gap-2', theme === 'dark' ? 'text-red-400' : 'text-red-600']">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        我的收藏
        <span :class="['ml-2 text-sm px-2 py-1 rounded-full', theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600']">
          {{ allFavorites.length }}
        </span>
      </h3>
      
      <!-- 搜索框 -->
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="搜索收藏的经文..."
        :class="[
          'w-48 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors duration-300',
          theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
        ]"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="allFavorites.length === 0" :class="['text-center py-12', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <p class="text-lg">还没有收藏任何金句</p>
      <p class="text-sm mt-2">在阅读或抄录时点击桃心图标即可收藏</p>
    </div>

    <!-- 收藏列表 -->
    <div v-else class="space-y-4">
      <!-- 搜索结果提示 -->
      <div v-if="searchKeyword && filteredFavorites.length > 0" :class="['mb-3 text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">
        找到 {{ filteredFavorites.length }} 条匹配的收藏
      </div>
      
      <!-- 无搜索结果 -->
      <div v-if="searchKeyword && filteredFavorites.length === 0" :class="['text-center py-8', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>未找到匹配的收藏</p>
        <p class="text-xs mt-1">请尝试其他关键词</p>
      </div>

      <button
        v-for="favorite in filteredFavorites"
        :key="favorite.id"
        @click="navigateToVerse(favorite)"
        :class="[
          'w-full text-left rounded-lg p-4 transition-all duration-300 border group',
          theme === 'dark' 
            ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' 
            : 'bg-white hover:bg-gray-50 border-gray-200'
        ]"
      >
        <!-- 经文出处和操作按钮 -->
        <div class="flex items-start justify-between mb-2">
          <div>
            <span :class="['font-bold text-lg', theme === 'dark' ? 'text-purple-400' : 'text-purple-600']">
              {{ getBookName(favorite.bookIndex) }}
            </span>
            <span :class="['text-sm ml-2', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
              {{ favorite.chapter }}:{{ favorite.verse }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <!-- 删除按钮 -->
            <button
              @click="removeFavorite(favorite.id, $event)"
              :class="[
                'p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300',
                theme === 'dark' 
                  ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-400' 
                  : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
              ]"
              title="取消收藏"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <!-- 跳转图标 -->
            <svg xmlns="http://www.w3.org/2000/svg" :class="['h-5 w-5', theme === 'dark' ? 'text-gray-600' : 'text-gray-400']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <!-- 经文内容 -->
        <p :class="['text-base leading-relaxed font-medium', theme === 'dark' ? 'text-gray-200' : 'text-gray-800']" v-html="highlightKeyword(favorite.text, searchKeyword)">
        </p>

        <!-- 收藏时间 -->
        <div :class="['text-xs mt-2', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
          收藏于 {{ formatDate(favorite.createdAt) }}
        </div>
      </button>
    </div>

    <!-- 清除按钮 -->
    <div v-if="allFavorites.length > 0" class="mt-6">
      <button
        @click="clearAllFavorites"
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
        清除所有收藏
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
.space-y-4::-webkit-scrollbar {
  width: 6px;
}

.space-y-4::-webkit-scrollbar-track {
  background: transparent;
}

.space-y-4::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.space-y-4::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
</style>
