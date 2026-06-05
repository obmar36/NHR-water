# 自來水廠 — 馬達節能監控平台（部署包）

NHR｜配水加壓站 馬達節能監控平台（Style A 藍圖風格）的**前端部署包**。
情境：示範配水加壓站 WTP2-DPS01（清水池 → 配水加壓）。資料為**模擬示意**，待客戶測試資料替換。

---

## 1. 目錄結構

```
dist/
├── index.html                  ← 入口（放到網站根目錄即可）
├── app/
│   ├── colors_and_type.css     ← 設計系統 token + @font-face
│   ├── assets/NHR_Logo.png     ← NHR 商標
│   └── fonts/                  ← Poppins / Noto Sans TC（.ttf）
├── schematic/
│   └── MotorDiagram.jsx        ← 機組線圖元件
└── station/
    ├── stationData.jsx         ← ★ 主資料 + 泵浦物理模型（親和定律）
    ├── stationData2.jsx        ← ★ 告警 / 問答 / 權限 / 稽核資料
    ├── BlueprintBoard.jsx      ← 互動藍圖機組圖
    ├── blueprint-ui.jsx        ← 頂部列 / KPI / 機組清單 / 即時數據 / RWD
    ├── overview-live.jsx       ← 即時趨勢（全機組合計 + 布朗通道）
    ├── analysis.jsx            ← 泵浦效率曲線 / 節能對比 / 參數預估
    ├── modules.jsx             ← AI 助理 / 操作建議 / 權限 + MFA / 主動提示
    ├── data-page.jsx           ← 資料整合與來源
    └── reports.jsx             ← 日/週/月報表 + AI 彙總 + CSV 匯出
```

---

## 2. 部署方式

本平台是**純前端靜態網站**，把整個 `dist/` 內容放到網站可存取的目錄即可。

> ⚠️ **必須透過 HTTP(S) 伺服器開啟，不能用 `file://` 直接雙擊。**
> 因為畫面由多個 `.jsx` 以瀏覽器端 fetch 載入，`file://` 會被 CORS 擋下。

### 放到公司網域（常見作法）
1. 將 `dist/` 內所有檔案（含 `app/`、`schematic/`、`station/`）上傳到網站根目錄
   （例如 `https://你的網域/waterworks/`）。
2. 瀏覽器開啟 `https://你的網域/waterworks/`（會載入 `index.html`）。

### 本機測試
```bash
# 任一靜態伺服器皆可，於 dist/ 目錄下執行：
npx serve .
# 或
python3 -m http.server 8080
```
然後開 `http://localhost:8080/`。

---

## 3. 系統需求

| 項目 | 說明 |
|---|---|
| 瀏覽器 | 最新版 Chrome / Edge / Safari（桌機、平板、手機皆支援，含觸控滑動） |
| 網路 | 需可連到 `unpkg.com` CDN 以載入 React 18 與 Babel（見下方「離線化」） |
| 後端 | 無（目前為示範資料）；接真實資料見第 4 點 |

### 若公司內網無法連外（離線化）
`index.html` 透過 CDN 載入三支函式庫：
- `react@18.3.1`、`react-dom@18.3.1`、`@babel/standalone@7.29.0`

請將這三支 `.js` 下載放到站內（例如 `dist/vendor/`），並把 `index.html` 內對應的
`<script src="https://unpkg.com/...">` 改成站內相對路徑即可。

---

## 4. 接真實資料

平台所有數值集中在 `station/stationData.jsx`、`station/stationData2.jsx`：
- `MOTORS` / `STATION`：機組與站台基本資料、泵浦曲線參數
- `operatingPoint()`：泵浦運轉點計算（親和定律，可直接沿用）
- `GUIDANCE` / `CHAT_CANNED` / `ROLES` / `USERS` / `AUDIT`：告警、問答、權限、稽核

把這些換成由後端 API 取得的真實 Tag / 歷史資料即可，畫面元件不需改動。

---

## 5. 進階建議（正式上線）

目前採**瀏覽器端 Babel 即時轉譯**，方便 demo、免建置；正式上線建議改為
**預編譯打包（Vite / esbuild）** 以提升首屏載入速度與穩定度，並可一併把 CDN
函式庫納入打包、移除執行階段 Babel。

---

© NHR — 馬達節能監控平台原型. 設計系統：NHR CC01-A AIoT Design System.
