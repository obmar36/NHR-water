# AI 節能分析管理平台 Demo

這個 repository 用於主管預覽自來水廠 AI 節能分析管理平台前端原型。

## Demo 說明

- 前端為單檔靜態展示版，方便 GitHub Pages 預覽。
- 目前資料為 mock data，用於展示畫面、流程與後端對接欄位。
- Mapbox 地圖與前端套件會從 CDN 載入，預覽時需要網路。
- 正式上線時，請依原專案 `docs/` 目錄中的 API handoff 文件接回公司後端。

## GitHub Pages

預期網址：

```text
https://obmar36.github.io/NHR-water/
```

若網址尚未顯示，請到 GitHub repository 的 `Settings` > `Pages`，選擇 `Deploy from a branch`，branch 使用 `main`，folder 使用 `/root`。


## 上傳注意事項

請先解壓縮此資料夾，然後將資料夾內的檔案拖曳到 GitHub repository 根目錄。請不要直接上傳 ZIP 檔本身，GitHub Pages 不會自動解壓 ZIP。

建議 repository：`obmar36/NHR-water`

應上傳檔案：

```text
index.html
.nojekyll
README.md
UPLOAD_INSTRUCTIONS.txt
```

GitHub Pages 設定：`Settings` > `Pages` > `Deploy from a branch` > branch `main` > folder `/root`。

正式公開前，建議到 Mapbox 後台限制 access token 只允許 `obmar36.github.io` 使用。
