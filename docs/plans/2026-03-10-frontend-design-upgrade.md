# 悦安居前端设计升级方案

> 日期: 2026-03-10
> 状态: 已确认
> 目标: 将前端设计从 MVP 阶段 (4/10) 提升到专业水准 (8/10)

## 一、技术方案

### 新增依赖

| 依赖 | 用途 | 体积 |
|------|------|------|
| framer-motion | 动画引擎 (物理弹性、手势拖拽、whileInView) | ~40KB gzipped |
| Magic UI (copy) | Marquee 轮播 + NumberTicker 数字动画 + BlurFade 入场 + ShimmerButton | 源码复制，零运行时依赖 |

### 不引入

- ~~DaisyUI~~ — 与 shadcn/ui 角色冲突，主题系统不兼容

### 全局修复

```css
/* 暗色模式 primary 修正：灰白 → amber */
.dark { --primary: oklch(0.8 0.15 70); }
```

---

## 二、首页设计 (Landing Page)

### 整体风格

- 深色奢华感：Slate-900 + Amber-500 金色主调
- 专业、温暖、高端家装气质
- 深色 Hero → 亮色内容区交替

### 模块结构 (从上到下)

#### 1. Navbar (新增)

- 固定顶部，初始透明
- 滚动后加毛玻璃背景 `backdrop-blur`
- 品牌 logo + 导航链接 + "开始使用" CTA 按钮

#### 2. Hero 区 (深色)

- **背景**: slate-900 → slate-800 → amber-950 渐变 + 网格点阵纹理 + 两个飘动模糊光晕
- **Badge**: "AI 赋能室内设计" + shimmer 微光动画
- **主标题**: "悦安居" text-8xl amber 渐变 + BlurFade 入场
- **副标题**: "家装软装自动出图平台"
- **CTA 按钮**:
  - 主: "开始使用" amber 实心 + 外发光 + hover scale(1.05) + shimmer
  - 次: "了解更多" 透明边框 + backdrop-blur
- **Before/After Slider** (核心视觉):
  - max-w-4xl 居中，rounded-2xl，shadow-2xl shadow-amber-500/10
  - 左半毛坯/白模，右半 AI 精装效果图
  - 中间 amber 竖线 + 圆形拖拽手柄
  - Framer Motion useDragControls 丝滑拖拽
  - 首次加载自动演示动画: 30% → 70% → 50%
- **动态统计**:
  - 10,000+ 张效果图 | <60s 平均出图 | 99% 客户满意
  - NumberTicker 数字跳动动画

#### 3. 作品画廊 (亮色)

- **标题**: "精选作品" + "AI 一键生成，从毛坯到梦想家"
- **分类 Tab**: [全部] [卧室] [客厅] [餐厅] [书房]，点击过滤 + AnimatePresence 过渡
- **双排 Marquee 轮播**:
  - 上排向右滚动，下排向左滚动
  - 悬停全部暂停，当前图片 scale(1.05) + 外发光
  - 图片 aspect-[4/3]，底部半透明渐变遮罩显示分类标签
- **图片来源**: PDF 中 AI 效果图 + 后续可配置替换

#### 4. 功能卡片 (微渐变)

- **标题区**: Badge "核心能力" + "四大 AI 应用，覆盖全流程"
- **4 张 shadcn Card** (2×2 网格, 响应式 1→2→4):
  - 一键彩平 / 外观迁移 / 平面转效果 / 毛坯转效果
  - 图标容器: amber 渐变背景，hover 旋转微动画
  - 每卡增加小缩略图展示输入→输出效果
  - "了解更多 →" 链接跳转工作台对应应用
- **入场动画**: BlurFade stagger 0.1s 交错进入
- **hover**: border-primary + translateY(-4px) + shadow-lg

#### 5. 三步流程 (亮色)

- **标题区**: Badge "简单易用" + "三步出图，专业效果"
- **3 步 shadcn Card** (横排, 移动端纵排):
  - ① 上传素材 → ② AI 生成 → ③ 下载成果
  - amber 渐变步骤圆圈 + 数字角标
  - SVG 虚线箭头连接线 (桌面水平/移动垂直)
  - 每步 3 行描述文字
- **渐进动画**: 滚动触发，步骤 1→2→3 依次亮起 (stagger 0.3s)

#### 6. 社会证据 (深色)

- **背景**: slate-900 渐变 + 微光纹理
- **标题**: "深受设计师信赖" 金色渐变文字
- **Marquee 评价卡片轮播**:
  - 卡片: bg-white/5 backdrop-blur + border-white/10
  - 内容: 星级 + 评语 + 姓名 + 公司
  - 初期使用模拟数据
- **信任指标**: 500+ 设计师 | 50+ 合作企业 | 98% 续费率 (NumberTicker)

#### 7. 底部 CTA (渐变过渡)

- **标题**: "让 AI 释放你的设计潜能"
- **副标题**: "从 CAD 平面图到精美效果图，只需一分钟"
- **按钮**: ShimmerButton "立即体验 →" (h-14 px-10 text-lg 金色微光)
- **小字**: "无需安装，浏览器直接使用"

#### 8. Footer (最深色)

- **三栏布局** (移动端单栏):
  - 品牌区: logo + 悦安居 + 一句话描述
  - 产品栏: 工作台、一键彩平、外观迁移、平面转效果、毛坯转效果
  - 支持栏: 使用指南、常见问题、联系我们、意见反馈
- **底部**: Separator + 版权 + ICP 备案号
- **样式**: text-muted-foreground，hover → text-foreground

---

## 三、工作台重设计 (Workspace)

### 工作台首页 (应用列表)

- **应用卡片重构**: shadcn Card 组件，amber 图标容器 + amber 实心按钮
- **hover**: border-primary/50 + shadow-md shadow-primary/5 + 微上浮
- **侧边栏**: 选中项 bg-primary/10 + 左侧 2px amber 指示器 + 底部余额显示
- **Header**: 品牌色点缀 + 导航 active 用 text-primary

### 应用工作页 (表单 + 结果)

- **布局**: 输入区 30% + 结果区 70%
- **上传区**: 虚线边框拖拽区，hover border-primary + bg-primary/5
- **生成按钮**: amber 实心 w-full h-12，生成中 amber 进度条 + spinner
- **结果面板**: Skeleton 骨架屏加载态 + 图片渐入动画 + 放大查看
- **历史任务**: 缩略图网格 + Badge 状态标识

### 全局优化

- 所有页面: Skeleton 骨架屏替代空白/文字加载
- window.confirm → shadcn AlertDialog
- 手写表格 → shadcn Table 组件
- 统一错误处理 (toast)
- 统一数据请求 Hook

---

## 四、新增文件清单 (预估)

| 文件 | 用途 |
|------|------|
| `src/components/landing/navbar.tsx` | 首页导航栏 |
| `src/components/landing/before-after-slider.tsx` | 前后对比滑块 |
| `src/components/landing/gallery.tsx` | 作品画廊轮播 |
| `src/components/landing/testimonials.tsx` | 社会证据评价 |
| `src/components/landing/cta-section.tsx` | 底部号召行动 |
| `src/components/ui/marquee.tsx` | Magic UI Marquee 组件 |
| `src/components/ui/number-ticker.tsx` | Magic UI NumberTicker 组件 |
| `src/components/ui/blur-fade.tsx` | Magic UI BlurFade 组件 |
| `src/components/ui/shimmer-button.tsx` | Magic UI ShimmerButton 组件 |
| `src/hooks/use-count-up.ts` | 数字递增动画 Hook (备用) |

### 改造文件清单

| 文件 | 改动 |
|------|------|
| `src/components/landing/hero.tsx` | 全面重构: 加入 Slider + 动画 + 统计 |
| `src/components/landing/features.tsx` | shadcn Card + 滚动动画 + 缩略图 |
| `src/components/landing/workflow.tsx` | SVG 连接线 + 渐进动画 + Card |
| `src/components/landing/footer.tsx` | 三栏布局 + 完整内容 |
| `src/app/page.tsx` | 集成所有新模块 |
| `src/app/globals.css` | 暗色 primary 修正 + 自定义动画 |
| `src/app/layout.tsx` | ThemeProvider + SEO 元数据 |
| `src/components/workspace/app-card.tsx` | 品牌色调 + shadcn Card |
| `src/components/layout/header.tsx` | 品牌色点缀 |
| `src/components/layout/sidebar.tsx` | amber 指示器 + 余额 |
| `src/app/admin/page.tsx` | shadcn Card + Skeleton |
| `src/app/admin/apps/page.tsx` | shadcn Table + AlertDialog |
| `src/app/admin/keys/page.tsx` | shadcn Table + AlertDialog |
