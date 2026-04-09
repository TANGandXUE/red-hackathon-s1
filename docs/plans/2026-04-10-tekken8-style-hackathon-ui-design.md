# Tekken8 风格黑客松 UI 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将黑客松模拟页面改造为铁拳8风格的平行四边形卡牌系统，包括 Phase 0 密排网格、分组动画、分组后横向滚动，以及 ChatSidebar 配色统一。

**Architecture:** 纯 CSS 实现平行四边形（`skewX(-28deg)`）和横向滚动动画（`@keyframes marquee`）。RosterGrid 组件完全重写，ChatSidebar 仅改配色不改逻辑。使用现有 oc-1~40.webp 头像。

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / Zustand / 纯 CSS 动画

---

### Task 1: 更新 CSS 设计系统 — Tekken8 配色和平行四边形样式

**Files:**
- Modify: `frontend/src/app/globals.css:132-371`

**Step 1: 添加 Tekken8 颜色变量**

在 `:root` 块（globals.css 第 134 行附近）追加以下变量：

```css
:root {
  /* 保留现有变量... */
  --rs-black: #000000;
  --rs-white: #ededed;
  --rs-charcoal: #111111;
  --rs-gray-dark: #222222;
  --rs-gray: #555555;
  --rs-gray-light: #888888;
  --rs-font-display: 'Space Grotesk', sans-serif;
  --rs-font-mono: 'JetBrains Mono', monospace;

  /* Tekken8 accent colors */
  --tk-bg: #020108;
  --tk-cyan: #3fd1e7;
  --tk-cyan-glow: rgba(63, 209, 231, 0.6);
  --tk-pink: #f50a64;
  --tk-dark-overlay: #020108;
  --tk-card-border: rgba(63, 209, 231, 0);
  --tk-msg-bg: #0a0a14;
}
```

**Step 2: 替换 `.grid-cell` 样式为平行四边形**

替换 globals.css 中 `.grid-cell` 相关样式（约第 166-203 行）为：

```css
/* Tekken8 parallelogram card */
.grid-cell {
  position: relative;
  cursor: pointer;
  transform: skewX(-28deg);
  transition: all 0.3s ease;
  overflow: visible;
  border: 1px solid var(--tk-card-border);
}

.grid-cell::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: var(--tk-dark-overlay);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  opacity: 0.6;
  transition: opacity 0.3s;
  pointer-events: none;
}

.grid-cell:hover {
  border: 1px solid var(--tk-cyan);
  box-shadow: 0px 0px 15px 0px var(--tk-cyan-glow);
}

.grid-cell:hover::before {
  opacity: 0;
}

.grid-cell img {
  display: block;
  width: 200%;
  max-width: none !important;
  height: auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) skewX(28deg);
  transition: 0.4s;
}

/* Name label - hidden by default, shown on hover */
.grid-cell .name-label {
  display: block;
  background: var(--tk-pink);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  font-style: italic;
  letter-spacing: 0;
  position: absolute;
  bottom: -12px;
  right: -6px;
  z-index: 3;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.grid-cell .name-label span {
  display: inline-block;
  padding: 8px 16px;
  transform: skewX(28deg);
}

.grid-cell:hover .name-label {
  opacity: 1;
}

/* Speaking glow - cyan pulse */
.grid-cell.focus {
  border-color: var(--tk-cyan);
  box-shadow: 0 0 25px var(--tk-cyan-glow);
}

.grid-cell.focus::before {
  opacity: 0.2;
}

/* Active group highlight */
.grid-cell.group-highlight {
  border-color: var(--tk-cyan);
  opacity: 1;
}

/* Dark/inactive state */
.grid-cell.dark {
  opacity: 0.4;
}

.grid-cell.active {
  opacity: 1;
}
```

**Step 3: 添加 marquee 滚动动画 keyframes**

在 globals.css 末尾的 keyframes 区域追加：

```css
@keyframes marqueeScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes tekkenReveal {
  0% { opacity: 0; transform: skewX(-28deg) scale(0.8); }
  50% { opacity: 0.5; }
  100% { opacity: 1; transform: skewX(-28deg) scale(1); }
}
```

**Step 4: 添加 marquee 容器样式**

在 `@layer components` 中追加：

```css
/* Group marquee container */
.group-marquee {
  overflow: hidden;
  position: relative;
  width: 100%;
}

.group-marquee .marquee-track {
  display: flex;
  gap: 10px;
  animation: marqueeScroll 30s linear infinite;
  width: max-content;
}

.group-marquee:hover .marquee-track {
  animation-play-state: paused;
}

/* Marquee card - smaller parallelogram for group view */
.marquee-card {
  position: relative;
  width: 120px;
  height: 160px;
  flex-shrink: 0;
  transform: skewX(-28deg);
  overflow: hidden;
  border: 1px solid rgba(63, 209, 231, 0);
  transition: all 0.3s;
}

.marquee-card::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: var(--tk-dark-overlay);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.marquee-card img {
  display: block;
  width: 250px;
  max-width: none !important;
  height: auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) skewX(28deg);
}

.marquee-card:hover {
  border: 1px solid var(--tk-cyan);
  box-shadow: 0 0 15px var(--tk-cyan-glow);
}

.marquee-card .name-label {
  display: block;
  background: var(--tk-pink);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  font-style: italic;
  position: absolute;
  bottom: -8px;
  right: -4px;
  z-index: 3;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.marquee-card .name-label span {
  display: inline-block;
  padding: 6px 12px;
  transform: skewX(28deg);
}

.marquee-card:hover .name-label {
  opacity: 1;
}
```

**Step 5: 更新 detail-card 弹出层样式**

```css
.detail-card {
  position: fixed;
  width: 280px;
  background: var(--tk-bg);
  border: 1px solid var(--tk-cyan);
  box-shadow: 0 0 20px var(--tk-cyan-glow);
  padding: 16px;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  font-family: var(--rs-font-mono);
}
```

**Step 6: 验证构建**

```bash
cd frontend && npm run build
```

**Step 7: 提交**

```bash
git add frontend/src/app/globals.css
git commit -m "style: add Tekken8 color system and parallelogram CSS"
```

---

### Task 2: 重写 RosterGrid — Phase 0 平行四边形网格

**Files:**
- Modify: `frontend/src/components/RosterGrid.tsx` (完整重写)

**Step 1: 重写 RosterGrid 组件**

保留 props 接口和核心数据逻辑（cells、groupedMap 等），重写渲染部分。

关键改动：
- Phase 0：不分软件/硬件赛道，40 个角色统一密排在一个平行四边形网格中
- 每个卡牌是 `skewX(-28deg)` 的平行四边形，图片反向矫正
- 逐个出场动画（使用 `tekkenReveal` keyframe）
- 暗色遮罩（`::before` 伪元素），hover 时移除
- hover 时显示青色边框光晕 + 底部粉红色名字标签
- 保留 FLIP 动画逻辑用于分组过渡
- 保留 hover 详情弹出层（用新的青色/深色样式）

```tsx
// Phase 0 渲染：统一平行四边形网格
// 不再区分 software/hardware track，所有 cells 混排
const allRandom = useMemo(() => seededShuffle(cells, 42), [cells]);

// 渲染单个平行四边形卡牌
const renderTekkenCell = (cell: CellData, index: number) => {
  const isActivated = index < activatedCount;
  const isSpeaking = speakingAgentId === cell.characterId;
  const isActiveGroup = activeGroupId === cell.groupId;
  
  const classNames = [
    'grid-cell',
    isActivated ? 'active' : 'dark',
    isSpeaking ? 'focus' : '',
    isActiveGroup && currentPhase >= 1 ? 'group-highlight' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      key={cell.characterId}
      ref={setCellRef(cell.characterId)}
      className={classNames}
      style={{
        width: '140px',
        height: '180px',
        ...(isActivated && activatedCount <= cells.length
          ? { animation: 'tekkenReveal 1.2s ease forwards' }
          : {}),
      }}
      onMouseEnter={(e) => handleMouseEnter(cell, e)}
      onMouseLeave={handleMouseLeave}
    >
      <img src={cell.avatarUrl} alt={cell.name} loading="lazy" />
      <div className="name-label">
        <span>{cell.name}</span>
      </div>
    </div>
  );
};
```

**Phase 0 网格布局：**

```tsx
{/* Phase 0: 统一平行四边形密排 */}
<div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '10px 10px',
    padding: '40px 60px',
  }}
>
  {allRandom.map((c, i) => renderTekkenCell(c, i))}
</div>
```

**Step 2: 验证构建**

```bash
cd frontend && npm run build
```

**Step 3: 提交**

```bash
git add frontend/src/components/RosterGrid.tsx
git commit -m "feat: rewrite RosterGrid with Tekken8 parallelogram grid for Phase 0"
```

---

### Task 3: 实现分组 FLIP 动画

**Files:**
- Modify: `frontend/src/components/RosterGrid.tsx`

**Step 1: 适配 FLIP 动画**

复用现有 FLIP 逻辑（cellRefs、prevPositions），但因为现在是平行四边形布局，需要调整：
- 记录 Phase 0 时所有卡牌位置
- Phase 0 → Phase 1 过渡时，先记录旧位置，然后切换到分组布局
- 计算位移并用 `transform` 动画移动卡牌到新位置
- 动画持续 1.2s，缓动 `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

注意：由于卡牌已有 `skewX(-28deg)`，FLIP 的 transform 需要组合：
```tsx
el.style.transform = `translate(${dx}px, ${dy}px) skewX(-28deg)`;
// → 动画到
el.style.transform = 'skewX(-28deg)';
```

**Step 2: 验证构建**

```bash
cd frontend && npm run build
```

**Step 3: 提交**

```bash
git add frontend/src/components/RosterGrid.tsx
git commit -m "feat: adapt FLIP grouping animation for parallelogram layout"
```

---

### Task 4: 实现分组后横向 marquee 滚动

**Files:**
- Modify: `frontend/src/components/RosterGrid.tsx`

**Step 1: 添加 Phase 1+ 分组 marquee 布局**

Phase 1+ 时，左侧面板变为垂直排列的分组容器，每个组内部是横向 marquee：

```tsx
// Phase 1+ 渲染：分组 marquee
const renderGroupMarquee = (groupId: number, members: CellData[]) => {
  const isActive = activeGroupId === groupId;
  // 复制一份实现无缝循环
  const doubled = [...members, ...members];
  // 根据成员数调整速度
  const duration = members.length * 8;

  return (
    <div key={groupId} style={{ marginBottom: 20 }}>
      {/* 组标题 */}
      <div style={{
        fontFamily: 'var(--rs-font-mono)',
        fontSize: 11,
        letterSpacing: 2,
        color: isActive ? 'var(--tk-cyan)' : 'var(--rs-gray)',
        textTransform: 'uppercase',
        marginBottom: 8,
        paddingLeft: 8,
      }}>
        组 {groupId}
        {isActive && <span style={{ marginLeft: 8, color: 'var(--tk-cyan)' }}>● ACTIVE</span>}
      </div>

      {/* Marquee 容器 */}
      <div
        className="group-marquee"
        style={{
          height: 180,
          border: `1px solid ${isActive ? 'var(--tk-cyan)' : 'var(--rs-gray-dark)'}`,
          boxShadow: isActive ? '0 0 10px var(--tk-cyan-glow)' : 'none',
          background: 'var(--tk-bg)',
          padding: '10px 0',
        }}
      >
        <div
          className="marquee-track"
          style={{ animationDuration: `${duration}s` }}
        >
          {doubled.map((cell, i) => (
            <div
              key={`${cell.characterId}-${i}`}
              className={`marquee-card ${
                speakingAgentId === cell.characterId ? 'focus' : ''
              }`}
              onMouseEnter={(e) => handleMouseEnter(cell, e)}
              onMouseLeave={handleMouseLeave}
            >
              <img src={cell.avatarUrl} alt={cell.name} loading="lazy" />
              <div className="name-label">
                <span>{cell.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Step 2: 更新主渲染逻辑**

```tsx
// 主渲染区分 Phase 0 和 Phase 1+
return (
  <div className="h-full w-full custom-scrollbar overflow-y-auto"
    style={{ background: 'var(--tk-bg)' }}>
    {currentPhase === 0 ? (
      /* Phase 0: 平行四边形密排网格 */
      <div style={{
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'center', gap: '10px',
        padding: '40px 60px',
      }}>
        {allRandom.map((c, i) => renderTekkenCell(c, i))}
      </div>
    ) : (
      /* Phase 1+: 分组 marquee 滚动 */
      <div style={{ padding: '20px' }}>
        {Array.from(groupedMap.entries()).map(([groupId, members]) =>
          renderGroupMarquee(groupId, members)
        )}
      </div>
    )}
    {renderDetailPortal()}
  </div>
);
```

**Step 3: 验证构建**

```bash
cd frontend && npm run build
```

**Step 4: 提交**

```bash
git add frontend/src/components/RosterGrid.tsx
git commit -m "feat: add group marquee horizontal scrolling for Phase 1+"
```

---

### Task 5: ChatSidebar 配色优化

**Files:**
- Modify: `frontend/src/components/ChatSidebar.tsx`

**Step 1: 更新配色**

逐一修改以下元素的颜色：

1. **整体背景**：`backgroundColor: 'var(--rs-black)'` → `backgroundColor: 'var(--tk-bg)'`
2. **组 Tab 选中态**：`borderColor: 'var(--rs-white)'` → `borderColor: 'var(--tk-cyan)'`，`color` 改为 `var(--tk-cyan)`
3. **Tab hover**：`borderColor: 'var(--rs-gray-light)'` → `borderColor: 'var(--tk-cyan)'`，加 `opacity: 0.5`
4. **队长徽章**：`border: '1px solid var(--rs-white)'` → `background: 'var(--tk-pink)'`，`color: '#fff'`，去掉 border
5. **头像边框**：发言中的头像加 `border: '2px solid var(--tk-cyan)'`，`boxShadow: '0 0 8px var(--tk-cyan-glow)'`
6. **消息背景**：消息项的 `backgroundColor` → 偶数行用 `var(--tk-msg-bg)` 做微弱区分
7. **角色名**：`color: 'var(--rs-white)'` → `color: 'var(--tk-cyan)'`
8. **Role 标签**：`backgroundColor: 'var(--rs-gray-dark)'` → `backgroundColor: 'rgba(63,209,231,0.1)'`，`color` → `var(--tk-cyan)`
9. **未读徽标**：`backgroundColor: 'var(--rs-white)'` → `backgroundColor: 'var(--tk-pink)'`，`color: '#fff'`
10. **typing indicator 点**：`backgroundColor: 'var(--rs-gray-light)'` → `backgroundColor: 'var(--tk-cyan)'`
11. **tool_call 背景**：`backgroundColor: 'var(--rs-charcoal)'` → `backgroundColor: 'var(--tk-msg-bg)'`

**Step 2: 验证构建**

```bash
cd frontend && npm run build
```

**Step 3: 提交**

```bash
git add frontend/src/components/ChatSidebar.tsx
git commit -m "style: update ChatSidebar to Tekken8 color scheme"
```

---

### Task 6: 更新 Simulation 页面和 StatusBar/PhaseIndicator

**Files:**
- Modify: `frontend/src/app/simulation/page.tsx`
- Modify: `frontend/src/components/PhaseIndicator.tsx`

**Step 1: 页面背景和状态栏**

```tsx
// page.tsx - 主容器背景
style={{ background: 'var(--tk-bg)' }}

// StatusBar - 文字颜色
color: 'var(--tk-cyan)' // 关键信息用青色
```

**Step 2: PhaseIndicator 配色**

- 脉冲点：颜色改为 `var(--tk-cyan)`
- 进度条：使用 `var(--tk-cyan)` 作为填充色
- 文字标签：白色保持

**Step 3: 验证构建**

```bash
cd frontend && npm run build
```

**Step 4: 提交**

```bash
git add frontend/src/app/simulation/page.tsx frontend/src/components/PhaseIndicator.tsx
git commit -m "style: update simulation page and phase indicator to Tekken8 theme"
```

---

### Task 7: 整体验证和修复

**Step 1: 完整构建检查**

```bash
cd frontend && npm run lint && npm run build
```

**Step 2: 启动开发服务器手动检查**

```bash
cd frontend && npm run dev
```

验证清单：
- [ ] Phase 0: 40 个平行四边形卡牌密排显示
- [ ] 卡牌逐个出场动画
- [ ] hover 时青色边框光晕 + 粉红名字标签
- [ ] Phase 0→1 分组 FLIP 动画
- [ ] Phase 1+: 分组 marquee 横向滚动
- [ ] marquee hover 暂停 + 角色信息弹出
- [ ] 活跃组青色高亮
- [ ] 发言角色光效
- [ ] ChatSidebar 配色统一
- [ ] 移动端响应式

**Step 3: 提交最终修复**

```bash
git add -A
git commit -m "fix: polish Tekken8 UI details and responsive layout"
```
