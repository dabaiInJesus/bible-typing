<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, provide, computed } from 'vue'
import type { BibleBook } from './types'
import { loadBibleData, getBooks, searchVerses } from './services/bibleService'
import { FavoriteService } from './services/favoriteService'
import ChapterView from './components/ChapterView.vue'
import TypingPractice from './components/TypingPractice.vue'
import StatsPanel from './components/StatsPanel.vue'
import FavoritesPanel from './components/FavoritesPanel.vue'
import DailyVersePanel from './components/DailyVersePanel.vue'

const books = ref<BibleBook[]>([])
const selectedBook = ref<BibleBook | null>(null)
const selectedChapter = ref<number>(1)
const selectedVerse = ref<number>(1)
const viewMode = ref<'read' | 'type'>('read')
const searchKeyword = ref('')
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const searchResults = ref<Array<{
  book: BibleBook
  chapter: number
  verse: number
  text: string
}>>([])
const isSearching = ref(false)
const theme = ref<'dark' | 'light'>('light')
const language = ref<'zh' | 'en'>('zh')
const showFavoritesView = ref(false)

// 书卷搜索相关
const bookSearchKeyword = ref('')
const showBookDropdown = ref(false)
const bookSelectorButton = ref<HTMLElement | null>(null)

// 章节搜索相关
const chapterSearchKeyword = ref('')
const showChapterDropdown = ref(false)
const chapterSelectorButton = ref<HTMLElement | null>(null)

// 收藏数量（响应式）
const favoritesUpdateTrigger = ref(0)
const favoritesCount = computed(() => {
  favoritesUpdateTrigger.value // 依赖追踪
  return FavoriteService.getAllFavorites().length
})

// 本地存储键名
const STORAGE_KEY_LAST_POSITION = 'bible-typing-last-position'

// 提供主题和语言给子组件
provide('theme', theme)
provide('language', language)
provide('favoritesCount', favoritesCount)
provide('updateFavoritesCount', () => {
  favoritesUpdateTrigger.value++
})

onMounted(async () => {
  try {
    isLoading.value = true
    await loadBibleData(language.value)
    books.value = getBooks()
    
    // 尝试恢复上次的位置
    const lastPosition = localStorage.getItem(STORAGE_KEY_LAST_POSITION)
    if (lastPosition) {
      try {
        const position = JSON.parse(lastPosition)
        // 恢复书卷
        const book = books.value.find(b => b.bookIndex === position.bookIndex)
        if (book) {
          selectedBook.value = book
          selectedChapter.value = position.chapter || 1
          selectedVerse.value = position.verse || 1
          viewMode.value = position.viewMode || 'read'
        } else {
          // 如果找不到书卷，使用默认值
          selectedBook.value = books.value[0]
        }
      } catch (e) {
        console.error('Failed to restore last position:', e)
        selectedBook.value = books.value[0]
      }
    } else if (books.value.length > 0) {
      selectedBook.value = books.value[0]
    }
    
    isLoading.value = false
  } catch (error) {
    console.error('Failed to load Bible data:', error)
    loadError.value = error instanceof Error ? error.message : '加载失败'
    isLoading.value = false
  }
  
  // 添加点击外部关闭下拉框的监听
  document.addEventListener('click', handleClickOutside)
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 移除监听
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

// 监听语言切换,重新加载数据
watch(language, async (newLang) => {
  try {
    isLoading.value = true
    // 清除缓存,重新加载
    await loadBibleData(newLang)
    books.value = getBooks()
    if (books.value.length > 0) {
      selectedBook.value = books.value[0]
      selectedChapter.value = 1
      selectedVerse.value = 1
    }
    isLoading.value = false
  } catch (error) {
    console.error('Failed to load Bible data:', error)
    loadError.value = error instanceof Error ? error.message : '加载失败'
    isLoading.value = false
  }
})

// 监听位置变化,保存到 localStorage
watch(
  [selectedBook, selectedChapter, selectedVerse, viewMode],
  () => {
    if (selectedBook.value) {
      const position = {
        bookIndex: selectedBook.value.bookIndex,
        chapter: selectedChapter.value,
        verse: selectedVerse.value,
        viewMode: viewMode.value
      }
      localStorage.setItem(STORAGE_KEY_LAST_POSITION, JSON.stringify(position))
    }
  },
  { deep: true }
)

// 监听章节变化，重置经节为1
watch(selectedChapter, () => {
  selectedVerse.value = 1
})

// 监听书卷变化，重置章节为1
watch(selectedBook, (newBook, oldBook) => {
  // 当书卷改变时（包括首次加载），重置章节和经节
  if (newBook) {
    // 如果是切换书卷（不是首次加载）
    if (oldBook && newBook.bookIndex !== oldBook.bookIndex) {
      // 总是重置为第1章
      selectedChapter.value = 1
      selectedVerse.value = 1
    } else if (!oldBook) {
      // 首次加载时，如果当前章节超出范围，也重置
      if (selectedChapter.value > newBook.chapters.length) {
        selectedChapter.value = 1
      }
      selectedVerse.value = 1
    }
  }
})



// 监听搜索关键词变化,执行经文搜索
watch(searchKeyword, (newKeyword) => {
  if (!newKeyword || newKeyword.trim().length === 0) {
    searchResults.value = []
    isSearching.value = false
    return
  }
  
  isSearching.value = true
  try {
    const results = searchVerses(newKeyword)
    // 限制最多显示50条结果,避免性能问题
    searchResults.value = results.slice(0, 50)
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = []
  }
  isSearching.value = false
})

function selectSearchResult(result: { book: BibleBook; chapter: number; verse: number }) {
  selectedBook.value = result.book
  selectedChapter.value = result.chapter
  viewMode.value = 'read'
  searchKeyword.value = ''
}

function selectChapter(chapter: number) {
  selectedChapter.value = chapter
  selectedVerse.value = 1
  // 确保 viewMode 不是收藏夹或搜索状态
  if (showFavoritesView.value) {
    showFavoritesView.value = false
  }
  if (searchKeyword.value) {
    searchKeyword.value = ''
  }
}

function switchViewMode(mode: 'read' | 'type') {
  viewMode.value = mode
}

function toggleTheme() {
  const newTheme = theme.value === 'dark' ? 'light' : 'dark'
  theme.value = newTheme
  // 保存到 localStorage
  localStorage.setItem('bible-typing-theme', newTheme)
}

function toggleLanguage() {
  language.value = language.value === 'zh' ? 'en' : 'zh'
}

function clearSearch() {
  searchKeyword.value = ''
  searchResults.value = []
}

function toggleFavoritesView() {
  showFavoritesView.value = !showFavoritesView.value
  // 如果打开收藏夹，清除搜索
  if (showFavoritesView.value) {
    searchKeyword.value = ''
  }
}

// 处理收藏夹导航
function handleFavoriteNavigate(bookIndex: number, chapter: number, verse: number) {
  const book = books.value.find(b => b.bookIndex === bookIndex)
  if (book) {
    selectedBook.value = book
    selectedChapter.value = chapter
    selectedVerse.value = verse
    viewMode.value = 'read' // 切换到阅读模式
    showFavoritesView.value = false // 关闭收藏夹视图
  }
}

// 处理章节导航
function handleChapterNavigate(chapter: number) {
  selectChapter(chapter)
  // 滚动到顶部
  setTimeout(() => {
    const mainContent = document.querySelector('main > div.flex-1.overflow-y-auto')
    if (mainContent) {
      mainContent.scrollTop = 0
    }
  }, 50)
}

// 键盘事件处理
function handleKeydown(event: KeyboardEvent) {
  // 只在读经模式下响应
  if (viewMode.value !== 'read' || !selectedBook.value) {
    return
  }
  
  // 如果正在输入框中，不响应
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }
  
  // 左箭头 - 上一章
  if (event.key === 'ArrowLeft') {
    if (selectedChapter.value > 1) {
      event.preventDefault()
      handleChapterNavigate(selectedChapter.value - 1)
    }
    // 如果在第1章，不阻止默认行为，允许浏览器滚动
  }
  // 右箭头 - 下一章
  else if (event.key === 'ArrowRight') {
    if (selectedChapter.value < selectedBook.value.chapters.length) {
      event.preventDefault()
      handleChapterNavigate(selectedChapter.value + 1)
    }
    // 如果在最后一章，不阻止默认行为，允许浏览器滚动
  }
  // 其他按键（上下箭头、PageUp等）不处理，保持默认滚动行为
}

function selectBook(bookIndex: number) {
  if (!books.value || books.value.length === 0) {
    return
  }
  const book = books.value.find(b => b.bookIndex === bookIndex)
  if (book && book.bookIndex !== selectedBook.value?.bookIndex) {
    selectedBook.value = book
    // watch 会触发重置章节
    setTimeout(() => selectChapter(1), 0)
  }
  // 关闭下拉框并清空搜索
  showBookDropdown.value = false
  bookSearchKeyword.value = ''
}

// 过滤书卷列表
const filteredBooks = computed(() => {
  console.log('filteredBooks - books.value:', books.value)
  console.log('filteredBooks - books.value.length:', books.value?.length)
  
  if (!books.value || books.value.length === 0) {
    console.log('filteredBooks - returning empty array (no books)')
    return []
  }
  
  const allBooks = [...books.value]
  console.log('filteredBooks - allBooks.length:', allBooks.length)
  
  if (!bookSearchKeyword.value || bookSearchKeyword.value.trim().length === 0) {
    console.log('filteredBooks - returning all books (no search)')
    return allBooks
  }
  
  const keyword = bookSearchKeyword.value.toLowerCase().trim()
  console.log('filteredBooks - searching for:', keyword)
  const filtered = allBooks.filter((book: BibleBook) => 
    book.name.toLowerCase().includes(keyword) || 
    book.abbrev.toLowerCase().includes(keyword)
  )
  console.log('filteredBooks - filtered.length:', filtered.length)
  return filtered
})

// 处理书卷输入框失去焦点
function handleBookInputBlur() {
  // 延迟关闭，以便点击下拉项时能先触发选择
  setTimeout(() => {
    showBookDropdown.value = false
    // 如果没有选择新书卷，清空搜索框以显示 placeholder
    if (!bookSearchKeyword.value) {
      bookSearchKeyword.value = ''
    }
  }, 200)
}

// 选择章节
function selectChapterFromDropdown(chapter: number) {
  selectChapter(chapter)
  showChapterDropdown.value = false
  chapterSearchKeyword.value = ''
}

// 处理章节输入框失去焦点
function handleChapterInputBlur() {
  setTimeout(() => {
    showChapterDropdown.value = false
    if (!chapterSearchKeyword.value) {
      chapterSearchKeyword.value = ''
    }
  }, 200)
}

// 初始化时确保下拉框是关闭的
showBookDropdown.value = false

// 计算下拉框的位置
const dropdownStyle = computed(() => {
  if (!bookSelectorButton.value) return {}
  
  const rect = bookSelectorButton.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`
  }
})

// 过滤后的旧约书卷
const oldTestamentBooks = computed(() => {
  return filteredBooks.value.filter((book: BibleBook) => book.testament === 'old')
})

// 过滤后的新约书卷
const newTestamentBooks = computed(() => {
  return filteredBooks.value.filter((book: BibleBook) => book.testament === 'new')
})

// 过滤后的章节列表
const filteredChapters = computed(() => {
  if (!selectedBook.value) return []
  
  const chapters = selectedBook.value.chapters
  if (!chapterSearchKeyword.value || chapterSearchKeyword.value.trim().length === 0) {
    return chapters
  }
  
  const keyword = chapterSearchKeyword.value.trim()
  return chapters.filter(chapter => 
    chapter.chapter.toString().includes(keyword)
  )
})

// 计算章节下拉框的位置
const chapterDropdownStyle = computed(() => {
  if (!chapterSelectorButton.value) return {}
  
  const rect = chapterSelectorButton.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`
  }
})

// 点击外部关闭下拉框
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.book-selector')) {
    showBookDropdown.value = false
  }
  // 检查是否点击在章节选择器外部
  const chapterSelector = document.querySelector('.chapter-selector')
  if (chapterSelector && !chapterSelector.contains(target)) {
    showChapterDropdown.value = false
  }
}

function reloadPage() {
  window.location.reload()
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
  <div :class="['flex h-screen transition-colors duration-300', theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900']">
    <!-- 侧边栏 -->
    <aside :class="['w-[306px] border-r flex flex-col transition-colors duration-300', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200']">
      <!-- 标题 -->
      <div :class="['p-4 pb-[18px] border-b transition-colors duration-300 relative', theme === 'dark' ? 'border-gray-700' : 'border-gray-200']">
        <h1 :class="['text-xl font-bold', theme === 'dark' ? 'text-purple-400' : 'text-purple-600']">圣经抄录</h1>
        <p :class="['text-xs mt-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-500']">Bible Transcription</p>
        <p :class="['absolute bottom-2 right-3 text-xs opacity-60', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">created by dabaiInJesus</p>
      </div>

      <!-- 搜索框 -->
      <div :class="['p-3 border-b transition-colors duration-300', theme === 'dark' ? 'border-gray-700' : 'border-gray-200']">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索书卷或经文..."
          :class="[
            'w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-purple-500 transition-colors duration-300',
            theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
          ]"
        />
      </div>

      <!-- 每日金句 -->
      <DailyVersePanel @toggle-favorites="toggleFavoritesView" />

      <!-- 统计面板 -->
      <div :class="['border-t transition-colors duration-300', theme === 'dark' ? 'border-gray-700' : 'border-gray-200']">
        <StatsPanel
          :current-book="selectedBook"
          :current-chapter="selectedChapter"
          @toggle-favorites="toggleFavoritesView"
        />
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col" style="overflow: visible;">
      <!-- 顶部工具栏 -->
      <header v-if="selectedBook" :class="['border-b p-4 pb-[12px] transition-colors duration-300 overflow-visible', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200']">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-4">
            <!-- 书卷选择器(包含约别) -->
            <div class="flex items-center gap-2 book-selector relative">
              <label :class="['text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">书卷:</label>
              <div class="relative" style="overflow: visible;">
                <!-- 书卷搜索输入框 -->
                <input
                  v-model="bookSearchKeyword"
                  @focus="showBookDropdown = true"
                  @blur="handleBookInputBlur"
                  @click.stop
                  type="text"
                  :placeholder="selectedBook ? `${selectedBook.name} (${selectedBook.abbrev})` : '选择书卷'"
                  :class="[
                    'px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500 cursor-pointer min-w-[180px] transition-colors duration-300',
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                  ]"
                  ref="bookSelectorButton"
                />
                
                <!-- 下拉箭头图标 -->
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  :class="[
                    'absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-transform pointer-events-none',
                    showBookDropdown ? 'rotate-180' : '',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  ]" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <!-- 章节选择器 -->
            <div class="flex items-center gap-2 chapter-selector">
              <label :class="['text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">章节:</label>
              <div class="relative" style="overflow: visible;">
                <!-- 章节搜索输入框 -->
                <input
                  v-model="chapterSearchKeyword"
                  @focus="showChapterDropdown = true"
                  @blur="handleChapterInputBlur"
                  @click.stop
                  type="text"
                  :placeholder="selectedChapter ? `第${selectedChapter}章` : '选择章节'"
                  :class="[
                    'px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500 cursor-pointer min-w-[120px] transition-colors duration-300',
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                  ]"
                  ref="chapterSelectorButton"
                />
                
                <!-- 下拉箭头图标 -->
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  :class="[
                    'absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-transform pointer-events-none',
                    showChapterDropdown ? 'rotate-180' : '',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  ]" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <span :class="['text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">共 {{ selectedBook?.chapters.length || 0 }} 章</span>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <!-- 视图切换 -->
            <div :class="['flex rounded-lg p-1', theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200']">
              <button
                @click="switchViewMode('read')"
                :class="[
                  'px-4 py-1.5 rounded text-sm transition-colors',
                  viewMode === 'read' 
                    ? (theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
                    : (theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                ]"
              >
                读经
              </button>
              <button
                @click="switchViewMode('type')"
                :class="[
                  'px-4 py-1.5 rounded text-sm transition-colors',
                  viewMode === 'type' 
                    ? (theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
                    : (theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                ]"
              >
                抄录
              </button>
            </div>
            
            <!-- 主题切换按钮 -->
            <button
              @click="toggleTheme"
              :class="[
                'p-2 rounded-lg transition-colors',
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              ]"
              :title="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
            >
              <svg v-if="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            
            <!-- 语言切换按钮 -->
            <button
              @click="toggleLanguage"
              :class="[
                'px-3 py-2 rounded-lg font-semibold text-sm transition-colors',
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-blue-400' 
                  : 'bg-gray-200 hover:bg-gray-300 text-blue-600'
              ]"
              :title="language === 'zh' ? 'Switch to English' : '切换到中文'"
            >
              {{ language === 'zh' ? '英文' : '中文' }}
            </button>
          </div>
        </div>
      </header>

      <!-- 内容显示区 -->
      <div :class="['flex-1 overflow-y-auto p-6 transition-colors duration-300', theme === 'dark' ? 'bg-gray-900' : 'bg-white']">
        <!-- 加载中 -->
        <div v-if="isLoading" class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p :class="['text-lg', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">
              {{ language === 'zh' ? '正在加载圣经数据...' : 'Loading Bible data...' }}
            </p>
          </div>
        </div>

        <!-- 加载错误 -->
        <div v-else-if="loadError" class="flex items-center justify-center h-full">
          <div class="text-center">
            <p :class="['text-lg mb-4', theme === 'dark' ? 'text-red-400' : 'text-red-600']">
              {{ language === 'zh' ? '加载失败: ' : 'Load failed: ' }}{{ loadError }}
            </p>
            <button 
              @click="reloadPage" 
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
            >
              {{ language === 'zh' ? '重试' : 'Retry' }}
            </button>
          </div>
        </div>

        <!-- 搜索结果页面 -->
        <div v-else-if="searchKeyword" class="max-w-4xl mx-auto">
          <!-- 返回按钮 -->
          <button
            @click="clearSearch"
            :class="[
              'mb-6 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2',
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回读经页面
          </button>

          <!-- 搜索结果标题 -->
          <div :class="['mb-6 rounded-lg p-4', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50']">
            <h2 :class="['text-xl font-bold', theme === 'dark' ? 'text-purple-400' : 'text-purple-600']">
              搜索结果: "{{ searchKeyword }}"
            </h2>
            <p :class="['text-sm mt-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">
              找到 {{ searchResults.length }} 条匹配的经文
            </p>
          </div>

          <!-- 搜索结果列表 -->
          <div v-if="isSearching" :class="['text-center py-12', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>搜索中...</p>
          </div>
          <div v-else-if="searchResults.length === 0" :class="['text-center py-12', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg">未找到匹配的经文</p>
            <p class="text-sm mt-2">请尝试其他关键词</p>
          </div>
          <div v-else class="space-y-4">
            <button
              v-for="(result, index) in searchResults"
              :key="index"
              @click="selectSearchResult(result)"
              :class="[
                'w-full text-left rounded-lg p-4 transition-all duration-300 border',
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              ]"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <span :class="['font-bold text-lg', theme === 'dark' ? 'text-purple-400' : 'text-purple-600']">
                    {{ result.book.name }}
                  </span>
                  <span :class="['text-sm ml-2', theme === 'dark' ? 'text-gray-500' : 'text-gray-400']">
                    {{ result.chapter }}:{{ result.verse }}
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" :class="['h-5 w-5', theme === 'dark' ? 'text-gray-600' : 'text-gray-400']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p :class="['text-base leading-relaxed font-medium', theme === 'dark' ? 'text-gray-200' : 'text-gray-800']">
                <span v-html="highlightKeyword(result.text, searchKeyword)"></span>
              </p>
            </button>
          </div>
        </div>

        <!-- 收藏夹页面 -->
        <div v-else-if="showFavoritesView" class="max-w-4xl mx-auto">
          <!-- 返回按钮 -->
          <button
            @click="toggleFavoritesView"
            :class="[
              'mb-6 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2',
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回读经页面
          </button>

          <!-- 收藏夹组件 -->
          <FavoritesPanel @navigate="handleFavoriteNavigate" />
        </div>

        <div v-else-if="!selectedBook" class="flex items-center justify-center h-full">
          <div class="text-center">
            <p :class="['text-lg', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">
              {{ language === 'zh' ? '请从左侧选择一本书卷' : 'Please select a book from the left' }}
            </p>
          </div>
        </div>

        <ChapterView
          v-else-if="viewMode === 'read'"
          :key="`${selectedBook?.bookIndex}-${selectedChapter}`"
          :book="selectedBook"
          :chapter="selectedChapter"
          :verse="selectedVerse"
          @navigate="handleChapterNavigate"
        />

        <TypingPractice
          v-else
          :key="`${selectedBook?.bookIndex}-${selectedChapter}`"
          :book="selectedBook"
          :chapter="selectedChapter"
          :verse="selectedVerse"
        />
      </div>
    </main>
    
    <!-- 书卷下拉框 - 使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <div
        v-if="showBookDropdown && bookSelectorButton"
        :class="[
          'fixed w-[280px] max-h-[400px] overflow-y-auto rounded-lg border shadow-lg',
          theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
        ]"
        :style="dropdownStyle"
        style="z-index: 9999;"
        @click.stop
      >
        <!-- 旧约 -->
        <div v-if="oldTestamentBooks.length > 0">
          <div :class="['px-3 py-1.5 text-xs font-semibold', theme === 'dark' ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-100']">
            旧约
          </div>
          <div class="py-1">
            <button
              v-for="book in oldTestamentBooks"
              :key="book.bookIndex"
              @click="selectBook(book.bookIndex)"
              :class="[
                'w-full text-left px-3 py-2 text-sm transition-colors',
                selectedBook?.bookIndex === book.bookIndex
                  ? (theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-50 text-purple-700')
                  : (theme === 'dark' ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100')
              ]"
            >
              {{ book.name }} ({{ book.abbrev }})
            </button>
          </div>
        </div>
        
        <!-- 新约 -->
        <div v-if="newTestamentBooks.length > 0">
          <div :class="['px-3 py-1.5 text-xs font-semibold', theme === 'dark' ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-100']">
            新约
          </div>
          <div class="py-1">
            <button
              v-for="book in newTestamentBooks"
              :key="book.bookIndex"
              @click="selectBook(book.bookIndex)"
              :class="[
                'w-full text-left px-3 py-2 text-sm transition-colors',
                selectedBook?.bookIndex === book.bookIndex
                  ? (theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-50 text-purple-700')
                  : (theme === 'dark' ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100')
              ]"
            >
              {{ book.name }} ({{ book.abbrev }})
            </button>
          </div>
        </div>
        
        <!-- 无搜索结果 -->
        <div v-if="filteredBooks.length === 0" :class="['p-4 text-center text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500']">
          未找到匹配的书卷
        </div>
      </div>
    </Teleport>
    
    <!-- 章节下拉框 - 使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <div
        v-if="showChapterDropdown && chapterSelectorButton"
        :class="[
          'fixed w-[160px] max-h-[300px] overflow-y-auto rounded-lg border shadow-lg',
          theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
        ]"
        :style="chapterDropdownStyle"
        style="z-index: 9999;"
        @click.stop
      >
        <!-- 章节列表 -->
        <div v-if="filteredChapters.length === 0" :class="['p-4 text-center text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500']">
          未找到匹配的章节
        </div>
        <div v-else class="py-1">
          <button
            v-for="chapter in filteredChapters"
            :key="chapter.chapter"
            @click="selectChapterFromDropdown(chapter.chapter)"
            :class="[
              'w-full text-left px-3 py-2 text-sm transition-colors',
              selectedChapter === chapter.chapter
                ? (theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-50 text-purple-700')
                : (theme === 'dark' ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100')
            ]"
          >
            第{{ chapter.chapter }}章
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* 隐藏所有滚动条但保留滚动功能 */
:deep(*)::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

:deep(*) {
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE and Edge */
}

/* 确保主内容区不显示滚动条 */
:deep(main),
:deep(div),
:deep(aside) {
  overflow-y: auto;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

:deep(main)::-webkit-scrollbar,
:deep(div)::-webkit-scrollbar,
:deep(aside)::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 窗口放大时调整右侧顶部下边框位置和内容宽度 */
@media (min-width: 1400px) {
  :deep(header) {
    padding-bottom: 14px !important;
  }
  
  /* 搜索结果和收藏夹的宽度增加20% */
  :deep(.max-w-4xl) {
    max-width: 71.4rem !important; /* 从56rem增加到约67.2rem (56 * 1.2) */
  }
}
</style>
