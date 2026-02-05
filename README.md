# 八字六合彩 · 時空合盤

基於八字命理與真太陽時的六合彩號碼推薦系統，使用 xAI (Grok) API 進行智能分析。

## 功能特點

- 🎯 真太陽時校準：根據出生地經度修正時間
- 🔮 八字喜用神分析：深度解析個人命局
- 🎲 號碼能量評估：評估初選號碼與命局的契合度
- 🍀 核心幸運號提取：基於五行生旺關係
- 📊 注號矩陣生成：5組推薦注號（每組6個號碼）
- ⚡ 策略建議：運勢定性、黃金時段、財神方位

## 技術棧

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **後端**：Vercel Serverless Functions（Node.js）
- **AI**：xAI (Grok) API
- **樣式**：新中式 + 六合彩主題

## 本地開發（可選）

本項目已針對 **Vercel 部署優化**，本地開發不是必需，但如需在本地模擬：

```bash
npm install -g vercel
vercel dev
```

然後訪問 `http://localhost:3000`。

## 使用說明

1. **輸入出生時間**：選擇您的出生日期和時間
2. **輸入出生地點**：填寫城市名稱或經緯度（如：香港、114.17,22.28）
3. **選擇當前時間**：可手動選擇或點擊「使用現在」
4. **輸入初選號碼**（可選）：輸入 1-49 範圍內的 6 個號碼
5. **點擊「起盤推算」**：等待 AI 分析並顯示結果

## API 端點

### POST `/api/predict`

預測端點，接收以下參數：

```json
{
  "birth_time": "1990-01-01 12:00",
  "birth_location": "香港",
  "current_time": "2025-02-05 15:30",
  "initial_numbers": [7, 14, 21, 28, 35, 42]
}
```

返回格式：

```json
{
  "solar_time_note": "真太陽時修正說明",
  "bazi_analysis": "八字喜用神深度分析",
  "initial_review": "初選號能量點評",
  "core_numbers": [13, 18, 24],
  "bet_groups": [
    {
      "numbers": [1, 2, 3, 4, 5, 6],
      "desc": "五行解析說明"
    }
  ],
  "strategy": {
    "fortune": "小吉",
    "period": "酉時至亥時（17:00–23:00）",
    "direction": "正西、西北"
  }
}
```

### GET `/api/health`

健康檢查端點。

## 部署到 Vercel

1) 安裝 Vercel CLI（可選，本地部署）
```bash
npm install -g vercel
```

2) 設置環境變量（Vercel Dashboard → Project → Settings → Environment Variables）
```
XAI_API_KEY=your_xai_api_key
XAI_MODEL=grok-beta   # 可選：grok-2 / grok-2-1212 / grok-4-fast-reasoning
```

3) 部署
```bash
vercel
```
或直接生產
```bash
vercel --prod
```

4) 前端請求與本地一致，直接調用 `/api/predict`。

## 文件結構

```
.
├── index.html               # 前端頁面（由 Vercel 作為靜態文件提供）
├── styles.css               # 樣式文件
├── app.js                   # 前端邏輯，調用 /api/predict
├── api/                     # Vercel Serverless Functions
│   ├── predict.js           # POST /api/predict
│   └── health.js            # GET /api/health
├── package.json             # 項目配置（無本地 Node 服務器）
├── .env                     # 本地環境變量（不提交到 Git）
├── .env.example             # 環境變量示例
├── .gitignore               # Git 忽略文件
├── hkjc-hacking-prompt.txt  # AI 提示詞配置（Serverless 函數讀取）
└── README.md                # 本文件
```

## 故障排除

### 錯誤："無法連接到服務器"

1. 確認 Vercel 部署狀態為綠色（成功）。
2. 確認前端請求的地址為 `/api/predict`（與當前域名同源）。
3. 如仍報錯，查看 Vercel Logs 中對應 Function 的錯誤信息。

### 錯誤："XAI_API_KEY 未配置"

1. 確認 `.env` 文件存在且包含 `XAI_API_KEY=your_actual_key`
2. 確認 API Key 格式正確（應以 `xai-` 開頭）
3. 重啟服務器（修改 .env 後需要重啟）

### 錯誤："xAI API 錯誤"

1. **檢查模型名稱**：
   - 在 `.env` 中設置 `XAI_MODEL=grok-beta` 或 `grok-2` 或 `grok-2-1212`
   - 不同模型可能有不同的可用性

2. **檢查 API Key 是否有效**：
   - 登錄 xAI 控制台確認 API Key 狀態
   - 確認有足夠的額度

3. **查看服務器日誌**：
   - 服務器終端會顯示詳細錯誤信息
   - 根據錯誤信息調整配置

## 注意事項

- ⚠️ 本項目僅供娛樂參考，請理性投注
- 🔐 `.env` 文件包含敏感信息，請勿提交到版本控制
- 🌐 需要網絡連接以調用 xAI API
- 💰 xAI API 可能產生費用，請注意使用量
- 🚀 **必須通過服務器訪問**，不能直接打開 HTML 文件

## 開發模式

使用 `--watch` 模式自動重啟服務器：

```bash
npm run dev
```

## 許可證

ISC
