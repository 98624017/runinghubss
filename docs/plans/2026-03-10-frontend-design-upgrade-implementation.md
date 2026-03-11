# 悦安居前端设计升级 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将悦安居平台的前端设计从 MVP 阶段 (4/10) 提升到专业水准 (8/10)，包括首页全面重建和工作台中度重设计。

**Architecture:** 基于现有 Next.js 16 + React 19 + Tailwind 4 + shadcn/ui 技术栈，新增 `motion`（原 framer-motion）作为动画引擎，通过 shadcn CLI 安装 Magic UI 精选组件（Marquee、NumberTicker、BlurFade、ShimmerButton）。首页采用深色奢华风（Slate-900 + Amber-500 金色），工作台注入品牌色调并统一组件体系。

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, motion (framer-motion), Magic UI (copy-paste components)

---

## Phase 0: 基础设施 (Foundation)

### Task 1: 安装依赖和 Magic UI 组件

**Files:**
- Modify: `package.json`
- Create: `src/components/ui/marquee.tsx` (via shadcn CLI)
- Create: `src/components/ui/number-ticker.tsx` (via shadcn CLI)
- Create: `src/components/ui/blur-fade.tsx` (via shadcn CLI)
- Create: `src/components/ui/shimmer-button.tsx` (via shadcn CLI)

**Step 1: 安装 motion 动画库**

```bash
pnpm add motion
```

Expected: 成功安装，无报错

**Step 2: 通过 shadcn CLI 安装 Magic UI 组件**

```bash
pnpm dlx shadcn@latest add "https://magicui.design/r/marquee.json"
pnpm dlx shadcn@latest add "https://magicui.design/r/number-ticker.json"
pnpm dlx shadcn@latest add "https://magicui.design/r/blur-fade.json"
pnpm dlx shadcn@latest add "https://magicui.design/r/shimmer-button.json"
```

Expected: 4 个组件文件自动生成到 `src/components/ui/` 目录

**Step 3: 验证安装**

```bash
ls src/components/ui/marquee.tsx src/components/ui/number-ticker.tsx src/components/ui/blur-fade.tsx src/components/ui/shimmer-button.tsx
```

Expected: 4 个文件都存在

**Step 4: 启动 dev server 确认编译无错**

```bash
pnpm dev
```

Expected: 编译成功，无报错。在浏览器打开 http://localhost:3000 确认现有页面正常

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/ui/marquee.tsx src/components/ui/number-ticker.tsx src/components/ui/blur-fade.tsx src/components/ui/shimmer-button.tsx
git commit -m "chore: add motion and magic-ui components (marquee, number-ticker, blur-fade, shimmer-button)"
```

---

### Task 2: 修复全局样式和布局基础

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: 修复暗色模式 primary 颜色**

在 `src/app/globals.css` 中，找到 `.dark` 块的 `--primary` 变量，将其从无彩色灰白修正为 amber 色调：

```css
/* 修改前 */
--primary: oklch(0.87 0.00 0);
/* 修改后 */
--primary: oklch(0.8 0.15 70);
```

同时修正 `--primary-foreground` 确保对比度：

```css
/* .dark 块中 */
--primary-foreground: oklch(0.15 0.05 70);
```

**Step 2: 添加自定义动画关键帧**

在 `globals.css` 底部（`@layer base` 之后）添加：

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  25% { transform: translateY(-10px) translateX(5px); }
  50% { transform: translateY(-5px) translateX(-5px); }
  75% { transform: translateY(-15px) translateX(3px); }
}

@keyframes slide-in-demo {
  0% { clip-path: inset(0 70% 0 0); }
  40% { clip-path: inset(0 30% 0 0); }
  100% { clip-path: inset(0 50% 0 0); }
}
```

**Step 3: 修复 layout.tsx 字体变量和 SEO**

在 `src/app/layout.tsx` 中：

1. 确认 Geist 字体 CSS 变量名与 `globals.css` 中的 `--font-sans` 一致
2. 增强 metadata：

```tsx
export const metadata: Metadata = {
  title: "悦安居 - 家装软装自动出图平台",
  description: "AI 赋能室内设计，从 CAD 平面图到精美效果图，从毛坯房到梦想家。一键生成专业效果图，秒级出图速度。",
  keywords: ["AI出图", "室内设计", "家装效果图", "软装设计", "CAD彩平", "毛坯房效果图"],
}
```

**Step 4: 验证**

```bash
pnpm dev
```

Expected: 编译成功。浏览器检查暗色模式下 primary 元素（按钮等）应显示 amber 金色而非灰白

**Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "fix: correct dark mode primary color to amber and enhance SEO metadata"
```

---

## Phase 1: 首页重建 (Landing Page)

### Task 3: 创建首页 Navbar

**Files:**
- Create: `src/components/landing/navbar.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 创建 Navbar 组件**

创建 `src/components/landing/navbar.tsx`：

- 固定顶部 `fixed top-0 z-50 w-full`
- 初始透明背景，滚动后 `bg-background/80 backdrop-blur-lg border-b` 过渡
- 使用 `useEffect` + `useState` 监听 `scroll` 事件
- 左侧：Home 图标 + "悦安居" 品牌名
- 中间：导航链接（功能、作品、流程、评价）用 anchor `#section-id` 滚动定位
- 右侧："开始使用" CTA 按钮（amber 实心，使用 shadcn Button）
- 移动端：汉堡菜单图标，点击展开 Sheet 侧边菜单

**Step 2: 在 page.tsx 中集成 Navbar**

```tsx
import { Navbar } from "@/components/landing/navbar"
// ... 现有 imports

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      {/* ... */}
    </div>
  )
}
```

**Step 3: 验证**

浏览器刷新首页，确认：
- Navbar 固定在顶部，初始透明
- 滚动页面后 Navbar 出现毛玻璃背景
- 导航链接和 CTA 按钮正确显示
- 移动端（缩小浏览器窗口）显示汉堡菜单

**Step 4: Commit**

```bash
git add src/components/landing/navbar.tsx src/app/page.tsx
git commit -m "feat(landing): add sticky navbar with blur backdrop on scroll"
```

---

### Task 4: 创建 Before/After Slider 组件

**Files:**
- Create: `src/components/landing/before-after-slider.tsx`

**Step 1: 创建 BeforeAfterSlider 组件**

创建 `src/components/landing/before-after-slider.tsx`：

核心实现：
- Props: `beforeImage: string`, `afterImage: string`, `className?: string`
- 使用 `motion` 的 `useMotionValue` + `useTransform` 控制分割位置
- 容器 `relative overflow-hidden rounded-2xl`，`max-w-4xl mx-auto`
- Before 图片：`absolute inset-0`，通过 `clip-path: inset(0 ${100-position}% 0 0)` 裁剪
- After 图片：`absolute inset-0`，全尺寸显示（底层）
- 分割手柄：amber 竖线 `w-0.5 bg-amber-500` + 圆形拖拽按钮 `w-10 h-10 rounded-full bg-amber-500 shadow-lg`
- 拖拽逻辑：`onPointerDown` + `onPointerMove` + `onPointerUp`，计算鼠标相对容器的 X 位置百分比
- 初始自动演示动画：`useEffect` 中用 `motion.animate` 从 30% → 70% → 50%（时长 2.5s，easeInOut）
- 外层阴影：`shadow-2xl shadow-amber-500/10`
- 左右标签：Before/After 文字标签，位于图片底部两侧

**Step 2: 验证组件渲染**

临时在 page.tsx 中导入测试：

```tsx
<BeforeAfterSlider
  beforeImage="/images/gallery/before-1.jpg"
  afterImage="/images/gallery/after-1.jpg"
/>
```

Expected: Slider 正确渲染，拖拽手柄可操作（图片暂用占位色块即可）

**Step 3: Commit**

```bash
git add src/components/landing/before-after-slider.tsx
git commit -m "feat(landing): create before-after comparison slider with drag interaction"
```

---

### Task 5: 准备图片资源

**Files:**
- Create: `public/images/gallery/` 目录及图片文件

**Step 1: 从 PDF 和项目中提取图片**

从 `用户原始需求输入/家具软装自动出图方案.pdf` 和 `用户原始需求输入/` 目录中提取 AI 效果图。

需要的图片：
- Hero Before/After: 1 组毛坯 → 精装对比图
- Gallery: 8-12 张不同风格的室内设计效果图（卧室、客厅、餐厅、书房等）

图片保存到 `public/images/gallery/`，命名规范：
- `before-1.jpg` / `after-1.jpg` — Hero slider 用
- `gallery-bedroom-1.jpg`, `gallery-living-1.jpg` 等 — Gallery 轮播用

如果 PDF 图片提取不便，可使用高质量占位图（从 Unsplash 下载室内设计相关免费图片），后续替换。

**Step 2: 优化图片**

确保所有图片：
- 宽度不超过 1920px
- 格式为 WebP 或压缩后的 JPEG（< 200KB/张）
- 统一 4:3 宽高比

**Step 3: Commit**

```bash
git add public/images/gallery/
git commit -m "feat(landing): add gallery images for hero slider and showcase"
```

---

### Task 6: 重构 Hero 区

**Files:**
- Modify: `src/components/landing/hero.tsx` (全面重写)

**Step 1: 重写 Hero 组件**

完全重构 `src/components/landing/hero.tsx`，新结构：

```
<section id="hero" className="relative min-h-screen ...">
  {/* 背景层 */}
  <div> 深色渐变 + 网格点阵 + 飘动光晕 </div>

  {/* 内容层 */}
  <div className="relative z-10 container mx-auto pt-32 pb-20">
    <BlurFade delay={0}> Badge: "AI 赋能室内设计" </BlurFade>
    <BlurFade delay={0.1}> 主标题: "悦安居" amber 渐变 text-8xl </BlurFade>
    <BlurFade delay={0.15}> 副标题 </BlurFade>
    <BlurFade delay={0.2}> CTA 按钮组 </BlurFade>
    <BlurFade delay={0.3}> BeforeAfterSlider </BlurFade>
    <BlurFade delay={0.4}> 统计栏 (NumberTicker) </BlurFade>
  </div>

  {/* 底部渐变过渡到下一 section */}
  <div className="absolute bottom-0 h-32 w-full bg-gradient-to-t from-background to-transparent" />
</section>
```

关键实现点：
- 背景网格：`radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)` + `background-size: 40px 40px`
- 飘动光晕：两个 `motion.div` 带 `animate={{ x, y }}` 无限循环浮动，`blur-3xl opacity-20`
- Badge: `inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400`，加 shimmer 动画背景
- 主标题字号：`text-5xl md:text-7xl lg:text-8xl font-bold`，amber 渐变 `bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent`
- CTA 主按钮：shadcn Button `size="lg"` + `className="bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/30 hover:scale-105 transition-all"`
- CTA 次按钮：`variant="outline"` + `className="border-white/20 text-white backdrop-blur hover:bg-white/10"`
- 统计栏：flex 三列，数字用 `NumberTicker`，标签用 `text-sm text-slate-400`

**Step 2: 验证**

浏览器刷新确认：
- 深色渐变背景 + 光晕动画正确
- "悦安居" 标题金色渐变
- BlurFade 入场动画逐个元素展现
- Before/After Slider 可拖拽
- NumberTicker 数字跳动
- 底部渐变过渡自然

**Step 3: Commit**

```bash
git add src/components/landing/hero.tsx
git commit -m "feat(landing): rebuild hero with before-after slider, blur-fade animations, and number tickers"
```

---

### Task 7: 创建作品画廊

**Files:**
- Create: `src/components/landing/gallery.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 创建 Gallery 组件**

创建 `src/components/landing/gallery.tsx`：

```
<section id="gallery" className="py-20 bg-background">
  <div className="container mx-auto">
    <BlurFade> 标题区: Badge + "精选作品" + 副标题 </BlurFade>

    <BlurFade> 分类 Tabs </BlurFade>

    <div className="mt-12 space-y-6">
      <Marquee pauseOnHover className="[--duration:40s]">
        {上排图片卡片}
      </Marquee>

      <Marquee pauseOnHover reverse className="[--duration:35s]">
        {下排图片卡片}
      </Marquee>
    </div>
  </div>
</section>
```

关键实现：
- 图片数据：定义 `galleryImages` 数组，每项含 `src`, `category`, `title`
- 分类 Tab：使用 `useState` 管理选中分类，Tab 按钮组样式 `rounded-full border px-4 py-1.5`，选中态 `bg-primary text-primary-foreground`
- 图片卡片：`relative group rounded-xl overflow-hidden aspect-[4/3] w-[300px] md:w-[400px]`
  - `<Image>` 填充 + `object-cover`
  - hover 效果：`group-hover:scale-105 transition-transform duration-500`
  - 底部遮罩：`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4`
  - 分类标签：白色小字

**Step 2: 集成到 page.tsx**

在 Hero 和 Features 之间插入 Gallery。

**Step 3: 验证**

确认：
- 双排 Marquee 反向滚动
- 悬停暂停 + 图片放大
- 分类 Tab 切换过滤正常
- 响应式正常

**Step 4: Commit**

```bash
git add src/components/landing/gallery.tsx src/app/page.tsx
git commit -m "feat(landing): add gallery section with dual marquee and category filters"
```

---

### Task 8: 重构功能卡片

**Files:**
- Modify: `src/components/landing/features.tsx`

**Step 1: 重构 Features 组件**

用 shadcn `Card` 组件替代手写 div，加入 BlurFade 动画：

关键改造：
- 外层加 `id="features"` 用于导航锚点
- 标题区用 shadcn `Badge` 组件替代手写 badge
- 每张卡片改用 `<Card>` + `<CardHeader>` + `<CardContent>` + `<CardFooter>`
- 图标容器：`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center`，图标 `text-primary`
- 每张卡片包裹 `<BlurFade delay={index * 0.1} inView>`
- hover 样式：`hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300`
- CardFooter 增加："了解更多 →" `Link` 到 `/workspace`

**Step 2: 验证**

滚动到 Features 区确认：
- 4 张卡片 BlurFade 交错进入
- hover 上浮 + 边框变色 + 阴影
- 使用了 shadcn Card 组件（DOM 结构正确）

**Step 3: Commit**

```bash
git add src/components/landing/features.tsx
git commit -m "refactor(landing): upgrade features with shadcn Card and blur-fade scroll animations"
```

---

### Task 9: 重构三步流程

**Files:**
- Modify: `src/components/landing/workflow.tsx`

**Step 1: 重构 Workflow 组件**

改造要点：
- 使用 shadcn `Card` 包裹每步
- 步骤圆圈：`w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20`
- 数字角标：`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold`
- 连接线改用 SVG 虚线箭头：
  ```tsx
  <svg className="hidden md:block absolute top-1/2 -translate-y-1/2" width="100" height="2">
    <line x1="0" y1="1" x2="90" y2="1" stroke="currentColor" strokeDasharray="6 4" className="text-primary/30" />
    <polygon points="90,1 84,4 84,-2" fill="currentColor" className="text-primary/50" />
  </svg>
  ```
- 移动端：纵向排列，连接线改为垂直虚线
- 每步增加描述文字列表（3 行 `text-sm text-muted-foreground`）
- 入场动画：每步 `<BlurFade delay={index * 0.3} inView>`

**Step 2: 验证**

确认：
- 桌面端三步横排 + SVG 箭头连接线
- 移动端纵排 + 垂直连接线
- 滚动入场动画 stagger 正确

**Step 3: Commit**

```bash
git add src/components/landing/workflow.tsx
git commit -m "refactor(landing): upgrade workflow with SVG arrows and staggered animations"
```

---

### Task 10: 创建社会证据模块

**Files:**
- Create: `src/components/landing/testimonials.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 创建 Testimonials 组件**

创建 `src/components/landing/testimonials.tsx`：

```
<section id="testimonials" className="py-20 bg-slate-900 relative overflow-hidden">
  {/* 背景纹理 */}
  <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

  <div className="relative container mx-auto">
    <BlurFade inView>
      标题: "深受设计师信赖" (amber 渐变文字)
    </BlurFade>

    <Marquee pauseOnHover className="mt-12 [--duration:30s]">
      {评价卡片}
    </Marquee>

    <BlurFade inView delay={0.3}>
      信任指标栏 (NumberTicker)
    </BlurFade>
  </div>
</section>
```

评价卡片样式：
- `bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 w-[350px]`
- 星级：5 个 amber `Star` 图标
- 评语：`text-slate-200 text-sm`
- 作者：`text-slate-400 text-xs` + 头像占位（首字母圆形）

模拟数据（6-8 条评价）：
```tsx
const testimonials = [
  { name: "张设计师", role: "某装饰公司", content: "出图效果超出预期，客户非常满意，大大提升了我们的签约率。", rating: 5 },
  // ...
]
```

信任指标栏：3 列 flex，每列含 `NumberTicker` + 标签

**Step 2: 集成到 page.tsx**

Workflow 和 Footer 之间插入 Testimonials。

**Step 3: 验证并 Commit**

```bash
git add src/components/landing/testimonials.tsx src/app/page.tsx
git commit -m "feat(landing): add testimonials section with marquee reviews and trust metrics"
```

---

### Task 11: 创建底部 CTA + 重构 Footer

**Files:**
- Create: `src/components/landing/cta-section.tsx`
- Modify: `src/components/landing/footer.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 创建 CTA Section**

创建 `src/components/landing/cta-section.tsx`：

```
<section className="py-20 bg-gradient-to-b from-slate-900 to-background relative">
  <div className="container mx-auto text-center">
    <BlurFade inView>
      <h2 className="text-3xl md:text-5xl font-bold text-white">让 AI 释放你的设计潜能</h2>
    </BlurFade>
    <BlurFade inView delay={0.1}>
      <p className="mt-4 text-lg text-slate-300">从 CAD 平面图到精美效果图，只需一分钟</p>
    </BlurFade>
    <BlurFade inView delay={0.2}>
      <div className="mt-8">
        <ShimmerButton
          shimmerColor="#f59e0b"
          background="rgba(245, 158, 11, 1)"
          className="h-14 px-10 text-lg font-semibold"
        >
          立即体验 →
        </ShimmerButton>
      </div>
      <p className="mt-4 text-sm text-slate-400">无需安装，浏览器直接使用</p>
    </BlurFade>
  </div>
</section>
```

**Step 2: 重构 Footer**

重写 `src/components/landing/footer.tsx` 为三栏布局：

```
<footer className="bg-slate-950 border-t border-white/5 py-12">
  <div className="container mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* 品牌区 */}
      <div> logo + "悦安居" + 描述 </div>
      {/* 产品栏 */}
      <div> 产品链接列表 </div>
      {/* 支持栏 */}
      <div> 支持链接列表 </div>
    </div>
    <Separator className="my-8 bg-white/10" />
    <div className="flex justify-between text-sm text-slate-500">
      <p>© {new Date().getFullYear()} 悦安居</p>
      <p>ICP备XXXXXXXX号</p>
    </div>
  </div>
</footer>
```

**Step 3: 集成到 page.tsx 并验证**

**Step 4: Commit**

```bash
git add src/components/landing/cta-section.tsx src/components/landing/footer.tsx src/app/page.tsx
git commit -m "feat(landing): add CTA section with shimmer button and rebuild footer with three columns"
```

---

### Task 12: 首页整合和最终验证

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: 确认 page.tsx 模块顺序**

```tsx
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <Hero />
        <Gallery />
        <Features />
        <Workflow />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
```

**Step 2: 全页面通测**

逐项验证：
- [ ] Navbar 固定 + 滚动毛玻璃
- [ ] Hero 动画入场 + Slider 拖拽 + NumberTicker
- [ ] Gallery 双排 Marquee + Tab 过滤
- [ ] Features BlurFade 入场 + hover 效果
- [ ] Workflow 步骤动画 + SVG 箭头
- [ ] Testimonials Marquee + NumberTicker
- [ ] CTA ShimmerButton
- [ ] Footer 三栏 + 备案号
- [ ] 移动端响应式（< 768px）
- [ ] 暗色模式（如已启用）

**Step 3: 修复发现的问题**

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(landing): integrate all landing sections and verify full page"
```

---

## Phase 2: 工作台重设计 (Workspace)

### Task 13: 工作台应用卡片品牌化

**Files:**
- Modify: `src/components/workspace/app-card.tsx`

**Step 1: 重构 AppCard 组件**

改造要点：
- 使用 shadcn `Card` + `CardHeader` + `CardContent` + `CardFooter`
- 图标容器：`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary`
- 按钮："开始使用 →" 改为 `<Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">`
- hover：`hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 transition-all`

**Step 2: 验证**

打开 `/workspace`，确认卡片使用 amber 色调

**Step 3: Commit**

```bash
git add src/components/workspace/app-card.tsx
git commit -m "refactor(workspace): upgrade app cards with brand colors and shadcn Card"
```

---

### Task 14: 侧边栏和 Header 品牌化

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/header.tsx`

**Step 1: 侧边栏升级**

改造要点：
- 选中项样式：`bg-primary/10 text-primary border-l-2 border-primary`
- 非选中项图标：`text-muted-foreground`，hover 时 `text-primary`
- 底部增加余额显示区（可选，如 API 已就绪）

**Step 2: Header 升级**

改造要点：
- Logo 旁图标用 `text-primary`
- 当前导航项 `text-primary font-medium`
- 其他项 `text-muted-foreground hover:text-foreground`

**Step 3: 验证并 Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/header.tsx
git commit -m "refactor(layout): add brand color accents to sidebar and header"
```

---

### Task 15: 工作台布局调整 (30/70 分栏)

**Files:**
- Modify: `src/app/workspace/[appId]/page.tsx`

**Step 1: 调整分栏比例**

找到左右分栏的 flex 布局，将比例从约 40/60 调整为 30/70：

```tsx
{/* 输入区 */}
<div className="w-full lg:w-[30%] ...">
  <WorkspaceForm ... />
</div>
{/* 结果区 */}
<div className="w-full lg:w-[70%] ...">
  <ResultPanel ... />
</div>
```

**Step 2: 上传区域品牌化**

在 `WorkspaceForm` 中，上传区域的 hover 样式添加：
- `hover:border-primary hover:bg-primary/5 transition-colors`

生成按钮改为 amber：
- `className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium"`

**Step 3: 结果面板增加 Skeleton**

在 `ResultPanel` 中，加载态使用 shadcn `Skeleton`：

```tsx
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="w-full aspect-[4/3] rounded-xl" />
    <div className="flex gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
) : (
  // 正常内容
)}
```

**Step 4: 验证并 Commit**

```bash
git add src/app/workspace/[appId]/page.tsx
git commit -m "refactor(workspace): adjust layout to 30/70 split and add brand styling"
```

---

## Phase 3: Admin 优化 (可选，低优先级)

### Task 16: Admin 仪表盘升级

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1: 使用 shadcn Card + Skeleton**

- 统计卡片改用 `<Card>` + `<CardHeader>` + `<CardContent>`
- 加载态用 `<Skeleton className="h-8 w-16" />` 替代文字
- 图标用 `text-primary`

**Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "refactor(admin): upgrade dashboard with shadcn Card and Skeleton loading"
```

---

### Task 17: Admin 表格页升级

**Files:**
- Modify: `src/app/admin/apps/page.tsx`
- Modify: `src/app/admin/keys/page.tsx`

**Step 1: 替换手写表格为 shadcn Table**

两个页面统一改造：
- CSS Grid 手写表格 → shadcn `Table` / `TableHeader` / `TableRow` / `TableCell`
- `window.confirm` → shadcn `AlertDialog`
- 加载态 → `Skeleton` 行

**Step 2: Commit**

```bash
git add src/app/admin/apps/page.tsx src/app/admin/keys/page.tsx
git commit -m "refactor(admin): replace custom grid tables with shadcn Table and AlertDialog"
```

---

## 最终验证

### Task 18: 全站验证和修复

**Step 1: 完整测试清单**

- [ ] 首页所有 8 个 section 渲染正确
- [ ] 所有动画流畅（BlurFade、Marquee、NumberTicker、ShimmerButton）
- [ ] Before/After Slider 拖拽顺滑
- [ ] 移动端响应式（375px / 768px / 1024px / 1440px）
- [ ] 工作台品牌色统一
- [ ] 工作台 30/70 分栏正确
- [ ] Admin 卡片和表格正确
- [ ] 暗色模式 primary 为 amber 色
- [ ] 无 console 错误
- [ ] 页面加载性能（Lighthouse 评分 > 80）

**Step 2: 修复问题**

**Step 3: 最终 Commit**

```bash
git add -A
git commit -m "feat: complete frontend design upgrade - landing page rebuild and workspace redesign"
```
