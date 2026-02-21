# kids-habbit

给孩子用的 WebApp 集合（PWA 形态，尽量接近原生体验）。

## 当前版本（v1）
- 默认内置两个账号：**小元**、**小满**
- 支持在页面内切换账号
- 每个账号数据隔离（浏览器本地存储）
- 第一款小程序：**玩具记账**
  - 按月（YYYY-MM）查看
  - 可新增玩具购买记录（名称、金额、日期、备注）
  - 可上传照片，并在历史中以缩略图展示

## 技术栈
- React + TypeScript + Vite
- 本地存储（localStorage）
- PWA 基础配置（manifest + service worker）

## 本地运行
```bash
npm install
npm run dev
```

## 构建
```bash
npm run build
```

## 后续可扩展小程序建议
- 每日阅读打卡
- 家务积分
- 运动习惯计时
- 零花钱预算目标
