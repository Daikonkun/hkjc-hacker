# 快速啟動指南

## 步驟 1: 確認依賴已安裝

```bash
npm install
```

## 步驟 2: 確認 .env 配置

確認 `.env` 文件中有：
```
XAI_API_KEY=xai-你的實際API密鑰
PORT=8888
```

## 步驟 3: 啟動服務器

```bash
npm start
```

**重要**：服務器啟動後，您應該看到：
```
服務器運行在 http://localhost:8888
✓ XAI_API_KEY 已配置 (xai-EUnBtL...)
```

如果看到 `⚠ XAI_API_KEY 未配置`，請檢查 `.env` 文件。

## 步驟 4: 打開瀏覽器

**正確方式**：
- 打開瀏覽器
- 訪問：`http://localhost:8888`
- ✅ 這樣前端才能連接到後端 API

**錯誤方式**：
- ❌ 不要直接雙擊 `index.html` 文件
- ❌ 不要使用 `file://` 協議打開

## 常見問題

### Q: 看到 "無法連接到服務器" 錯誤

**A**: 確認：
1. 服務器正在運行（終端中看到 "服務器運行在..."）
2. 瀏覽器訪問的 URL 是 `http://localhost:8888`（不是 `file://`）
3. 端口號與 .env 中的 PORT 一致

### Q: 看到 "XAI_API_KEY 未配置" 錯誤

**A**: 
1. 檢查 `.env` 文件是否存在
2. 確認 `XAI_API_KEY=` 後面有實際的 API Key（不是 `your_xai_api_key_here`）
3. 重啟服務器（修改 .env 後必須重啟）

### Q: 看到 "xAI API 錯誤" 

**A**: 
1. 查看服務器終端的詳細錯誤信息
2. 嘗試更改 `.env` 中的 `XAI_MODEL`：
   ```
   XAI_MODEL=grok-2
   ```
   或
   ```
   XAI_MODEL=grok-beta
   ```
3. 確認 API Key 有效且有額度

## 測試連接

在瀏覽器中訪問：`http://localhost:8888/api/health`

應該看到：
```json
{"status":"ok","timestamp":"..."}
```

如果看到這個，說明服務器運行正常！
