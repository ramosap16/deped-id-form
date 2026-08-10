# DepEd ID Order Form — Setup Guide

Follow these steps to get the form fully working. You only need a Google account and a GitHub account.

---

## Part 1 — Set Up Google Sheet & Drive

### Step 1: Create the Google Sheet
1. Go to [https://sheets.google.com](https://sheets.google.com)
2. Click **Blank** to create a new spreadsheet
3. Name it: `DepEd ID Orders`
4. Copy the **Spreadsheet ID** from the URL bar:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
   The ID is the long string between `/d/` and `/edit`

### Step 2: Create the Google Drive Folder
1. Go to [https://drive.google.com](https://drive.google.com)
2. Click **New > New Folder**
3. Name it: `DepEd ID Uploads`
4. Open the folder and copy the **Folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID
   ```

---

## Part 2 — Deploy the Google Apps Script

### Step 3: Open Apps Script
1. In your Google Sheet, click **Extensions > Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `Code.gs` and paste it in

### Step 4: Add your IDs
In the script, replace these two lines with your actual IDs:
```javascript
const SPREADSHEET_ID  = 'YOUR_SPREADSHEET_ID_HERE';
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE';
```

### Step 5: Deploy as a Web App
1. Click **Deploy > New Deployment**
2. Click the gear icon next to **Type** and select **Web App**
3. Fill in:
   - **Description:** DepEd ID Order Form v1
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts to grant permissions
6. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/XXXXXXXXXX/exec
   ```

---

## Part 3 — Connect the Form

### Step 6: Add the Web App URL to the form
1. Open `script.js`
2. Find this line near the top:
   ```javascript
   const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace `YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the URL you copied in Step 5

---

## Part 4 — Deploy to GitHub Pages

### Step 7: Create a GitHub repository
1. Go to [https://github.com](https://github.com) and sign in
2. Click **New repository**
3. Name it: `deped-id-form`
4. Set it to **Public**
5. Click **Create repository**

### Step 8: Upload the form files
Upload these three files to the repository:
- `index.html`
- `style.css`
- `script.js`

You can drag and drop them directly on the GitHub repository page.

### Step 9: Enable GitHub Pages
1. In your repository, go to **Settings > Pages**
2. Under **Source**, select **Deploy from a branch**
3. Select branch: `main`, folder: `/ (root)`
4. Click **Save**
5. Wait about 1–2 minutes, then your form will be live at:
   ```
   https://YOUR_GITHUB_USERNAME.github.io/deped-id-form/
   ```

---

## Part 5 — Test

### Step 10: Submit a test entry
1. Open your live form URL
2. Fill in all fields with test data
3. Upload a test photo
4. Click **Submit Order**
5. Verify:
   - ✅ A confirmation screen appears with a reference number
   - ✅ A new row appears in your Google Sheet
   - ✅ The uploaded photo appears in your Google Drive folder
   - ✅ The Sheet row contains a link to the Drive file

---

## Controlling Sheet Access

To give other DepEd staff access to the Google Sheet:
1. Open the Sheet
2. Click **Share** (top right)
3. Enter their Google email address
4. Set their role to **Viewer** (read-only) or **Editor** (can edit)
5. Click **Send**

The Sheet is private by default — only people you explicitly share it with can access it.

---

## Redeploying After Changes

If you update `Code.gs`, you must create a **new deployment** for changes to take effect:
1. Click **Deploy > Manage Deployments**
2. Click the pencil (edit) icon on your existing deployment
3. Change the version to **New version**
4. Click **Deploy**
5. The Web App URL stays the same — no changes needed in `script.js`
