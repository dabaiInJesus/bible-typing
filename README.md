# 圣经打字机 (Bible Typing)

一个基于 Electron、Vue 3 和 TailwindCSS 构建的离线 PC 端圣经打字练习应用。

## 功能特点

- 📖 **圣经阅读**: 支持中英文圣经(和合本)阅读
- ⌨️ **打字练习**: 逐节抄录圣经经文,实时显示准确率
- 📊 **进度追踪**: 自动记录每节经文的完成状态和准确率
- 💾 **本地存储**: 所有数据保存在本地,无需联网
- 🎨 **现代界面**: 深色主题,优雅的用户体验

## 技术栈

- **框架**: Vue 3 + TypeScript
- **桌面应用**: Electron
- **样式**: TailwindCSS
- **构建工具**: Vite
- **数据存储**: localStorage

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
npm run electron:dev
```

## 构建应用

```bash
npm run electron:build
```

构建完成后,可执行文件将位于 `dist-electron` 目录中。

## 项目结构

```
bible-typing/
├── electron/              # Electron 主进程文件
│   ├── main.ts           # 主进程入口
│   └── preload.ts        # 预加载脚本
├── public/
│   └── bible-data/       # 圣经数据文件
│       ├── bible-zh.json # 中文圣经
│       └── bible-en.json # 英文圣经
├── src/
│   ├── components/       # Vue 组件
│   │   ├── App.vue              # 主应用组件
│   │   ├── BookList.vue         # 书卷列表
│   │   ├── ChapterView.vue      # 章节阅读视图
│   │   ├── TypingPractice.vue   # 打字练习组件
│   │   └── StatsPanel.vue       # 统计面板
│   ├── services/         # 服务层
│   │   ├── bibleService.ts      # 圣经数据服务
│   │   └── progressService.ts   # 进度管理服务
│   ├── types/            # TypeScript 类型定义
│   ├── App.vue           # 根组件
│   ├── main.ts           # 应用入口
│   └── style.css         # 全局样式
└── package.json
```

## 使用说明

1. **选择书卷**: 在左侧侧边栏选择旧约或新约,然后点击书卷名称
2. **选择章节**: 在顶部章节选择器中选择要阅读或练习的章节
3. **阅读模式**: 查看完整的章节内容,显示抄录进度
4. **打字练习**:
   - 选择要练习的经节
   - 在输入框中输入经文
   - 系统会实时高亮显示正确/错误的字符
   - 完成后显示准确率和完成状态
5. **查看统计**: 在侧边栏底部查看总体抄录统计信息

## 数据说明

- 所有抄录进度保存在浏览器 localStorage 中
- 包含以下信息:
  - 书卷索引、章节号、经节号
  - 完成状态
  - 准确率
  - 完成时间戳

## 许可证

MIT License

## 致谢

- 圣经数据来源于 [haitai/bible](https://github.com/haitai/bible)
- 使用 Vue 3、Electron 和 TailwindCSS 构建
