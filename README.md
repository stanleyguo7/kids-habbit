# kids-habbit

给孩子用的 WebApp 集合（当前包含：玩具记账）。

## 当前版本（SQLite 存储）
- 默认账号：**小元**、**小满**
- 支持账号切换，数据按账号隔离
- 每月可上传多张玩具照片
- 记录不再存 localStorage，而是：
  - 图片文件：`uploads/`
  - 数据库：`data/kids-habbit.db` (SQLite)

## 启动方式（本地）
```bash
npm install
npm run dev:full
```

- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:8787`

## 仅前端构建
```bash
npm run build
```

## 说明
SQLite + 本地文件存储适合本机/私有服务器部署。
如果部署到 Vercel（无状态函数环境），本地文件和 SQLite 持久化不稳定，建议后续改成对象存储 + 托管数据库。
