# HinH UI Redesign - 全屏卡片矩阵 + Vercel/Warp 美学

## 概述

将 HinH 模拟平台从当前 20 角色双轨道布局重构为 40 角色全屏卡片矩阵，采用 Vercel/Warp 纯黑白终端美学。

## 需求

1. **40 角色替换**：用 zip 中 40 张角色卡面替换现有 20 个角色，自动生成角色描述
2. **全屏卡片矩阵**：去掉 SW/HW 双轨道，40 张卡铺满左侧面板
3. **AI 动态分组**：3-6 人一组，分组过程有 FLIP 动画
4. **Vercel/Warp 美学**：纯黑白色系，冷色调，终端极简风格
5. **Chat 动态 Tab**：侧边栏 tab 数量跟随实际分组数

## 色彩系统

| Token | 旧值 | 新值 | 用途 |
|-------|------|------|------|
| --rs-black | #0a0a0a | #000000 | 主背景 |
| --rs-white | #f0ede6 | #ededed | 主文字 |
| --rs-charcoal | #1a1a1a | #111111 | 卡片/次级背景 |
| --rs-gray-dark | #2a2a2a | #222222 | 边框/分隔线 |
| --rs-gray | #666666 | #555555 | 三级文字 |
| --rs-gray-light | #999999 | #888888 | 二级文字 |

字体保持：Space Grotesk（display）+ JetBrains Mono（mono）

## 数据层

### characters.ts（40 角色）

- ID: `oc-1` ~ `oc-40`
- 从 zip 文件名提取姓名
- avatarUrl: `/avatars/oc-N.webp`
- characterType / personality / skill / description 随机生成
- isGenerated: false（全部为"真实"角色）

### 分组算法（phase-executor.ts）

- 40 人按 MBTI personality 分组
- 每组 3-6 人，确保每组至少 1 个 Leader 型
- 预计产生 7-10 组

## UI 布局

### 模拟页（/simulation）

```
+--Status Bar (full width)---------------------------+
+--Phase Indicator (full width)-----------------------+
+--Left Panel (65%)----------+--Right Panel (35%)-----+
|                            |  [Tab1][Tab2]...[TabN] |
|  全屏卡片矩阵 8x5          |                        |
|  auto-fill minmax(100px)   |  消息列表               |
|  gap: 4px, padding: 12px  |                        |
|  角色卡面 cover 填满格子     |  输入指示器             |
|  底部渐变遮罩 + 白字名      |                        |
+----------------------------+------------------------+
```

Phase 0：40 张卡随机排列，逐个激活动画
分组完成：FLIP 动画聚合，组间 16px 间隔，组标签出现

### 首页（/）

- max-w-xl → max-w-2xl
- 色值同步更新

### 结果页（/result）

- max-w-3xl → max-w-5xl
- 色值同步更新

## 图片处理

- 原图 5-7MB PNG → sharp 批量转 webp（宽 400px，质量 80）
- 输出 `frontend/public/avatars/oc-1.webp` ~ `oc-40.webp`
- 前端 `loading="lazy"` 优化加载

## 文件变更清单

| 文件 | 改动类型 |
|------|---------|
| `backend/src/data/characters.ts` | 重写：20→40 角色 |
| `backend/src/modules/simulation/phase-executor.ts` | 修改：分组算法适配 |
| `frontend/public/avatars/` | 新增：40 张 webp |
| `frontend/src/app/globals.css` | 修改：色值更新，去掉双轨道样式 |
| `frontend/src/components/RosterGrid.tsx` | 重构：单一网格 + 卡面 + 分组间隔 |
| `frontend/src/components/ChatSidebar.tsx` | 修改：动态 Tab |
| `frontend/src/app/simulation/page.tsx` | 修改：面板比例 65/35 |
| `frontend/src/app/page.tsx` | 修改：宽度 + 色值 |
| `frontend/src/app/result/result-content.tsx` | 修改：宽度 + 色值 |
| `frontend/src/app/layout.tsx` | 修改：背景色 |

## 验收标准

### 前端（Playwright E2E）

**桌面端 + 移动端均需测试：**

1. **正常流程**：首页输入想法 → 开始模拟 → 看到 40 张角色卡全部点亮 → 分组动画播放 → Chat 侧边栏显示正确组数 → 切换 Tab 查看不同组消息 → 点击角色卡翻转 → hover 显示详情 → 模拟完成跳转结果页 → 查看排名 → 返回首页
2. **边界情况**：空输入提交 → 错误提示；无网络时 SSE 断开处理；快速切换 Tab；分组动画中操作

### 后端

1. **非 AI 接口**：创建模拟、获取分组、获取结果 — 正常 + 异常（无效 ID、重复请求等）
2. **AI 接口**：复杂场景测试 — AI 分组决策质量（角色分配合理性）、AI 对话生成（上下文连贯性、约束遵守）、工具调用执行结果正确性
