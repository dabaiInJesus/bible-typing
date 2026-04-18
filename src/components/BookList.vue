<script setup lang="ts">
import { inject } from 'vue'
import type { BibleBook } from '../types'

const theme = inject<'dark' | 'light'>('theme', 'dark')

defineProps<{
  books: BibleBook[]
  selectedBook: BibleBook | null
}>()

const emit = defineEmits<{
  selectBook: [book: BibleBook]
}>()
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div v-if="books.length === 0" :class="['p-4 text-center text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
      没有找到匹配的书卷
    </div>
    
    <button
      v-for="book in books"
      :key="book.bookIndex"
      @click="emit('selectBook', book)"
      :class="[
        'w-full px-4 py-3 text-left transition-colors border-b',
        selectedBook?.bookIndex === book.bookIndex
          ? (theme === 'dark' ? 'bg-purple-700 text-white' : 'bg-purple-500 text-white')
          : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 border-gray-700' : 'text-gray-700 hover:bg-gray-100 border-gray-200')
      ]"
    >
      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium">{{ book.name }}</div>
          <div :class="['text-xs mt-0.5', theme === 'dark' ? 'text-gray-400' : 'text-gray-500']">{{ book.abbrev }}</div>
        </div>
        <div :class="['text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
          {{ book.chapters.length }}章
        </div>
      </div>
    </button>
  </div>
</template>

<style scoped>
/* 书卷列表滚动条样式 - 深色主题 */
:deep(.bg-gray-800) ::-webkit-scrollbar,
:deep([class*="bg-gray-900"]) ::-webkit-scrollbar {
  width: 6px;
}

:deep(.bg-gray-800) ::-webkit-scrollbar-track,
:deep([class*="bg-gray-900"]) ::-webkit-scrollbar-track {
  background: #1f2937;
}

:deep(.bg-gray-800) ::-webkit-scrollbar-thumb,
:deep([class*="bg-gray-900"]) ::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

:deep(.bg-gray-800) ::-webkit-scrollbar-thumb:hover,
:deep([class*="bg-gray-900"]) ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* 书卷列表滚动条样式 - 浅色主题 */
:deep(.bg-gray-50) ::-webkit-scrollbar,
:deep(.bg-white) ::-webkit-scrollbar {
  width: 6px;
}

:deep(.bg-gray-50) ::-webkit-scrollbar-track,
:deep(.bg-white) ::-webkit-scrollbar-track {
  background: #f3f4f6;
}

:deep(.bg-gray-50) ::-webkit-scrollbar-thumb,
:deep(.bg-white) ::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

:deep(.bg-gray-50) ::-webkit-scrollbar-thumb:hover,
:deep(.bg-white) ::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
