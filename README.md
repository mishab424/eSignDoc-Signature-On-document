# 📘 eSignDoc Plugin – User Manual

A professional plugin for Oracle APEX to enable advanced e-signature features, document signing, and secure BLOB storage.

---

## 🔍 1. Description

eSignDoc is a dynamic plugin built for Oracle APEX that allows users to create and store e-signatures, place them on uploaded PDF/image documents, and download the signed output. The plugin supports multiple input modes and is ideal for digital approvals and document workflows.

---

## ✨ 2. Features

* ✍️ **Capture Signature**

  * Draw on canvas
  * Upload from local device
  * Capture via webcam

* 💾 **Save to Database**

  * Stores signature and signed file as BLOB

* 📄 **Sign on Document**

  * Drag and drop signature onto PDF
  * Live preview during editing

* 🎨 **Edit Signature**

  * Resize, recolor, and adjust pen thickness

* 🔄 **Toggle View**

  * Switch between signature mode and document preview

* 📥 **Export Signed File**

  * Download as PDF or image based on user selection

---

## 💼 3. Use Cases

* HR Onboarding – digital document signing
* Loan approval process
* Sales contract signatures
* Internal approval or review workflows
* Consent form or check-in desk confirmations

---

## ⚙️ 4. Installation Guide

### ✅ Step 1: Download Plugin

* GitHub or apex.world
* Download entire project or `plugin.sql` file from `/src/`

### ✅ Step 2: Install Plugin

* Open Oracle APEX → **SQL Workshop > SQL Scripts**
* Upload and run `plugin.sql`

### ✅ Step 3: Add Plugin Region

* Navigate to your APEX Page Designer
* Click **+** → Add Region
* Region Type: `eSignDoc`

### ✅ Step 4: Add Supporting Items

* Create a **new region** → Static ID: `items_region`
* Add 3 items:

  * `SIGNATURE_BLOB` → **Type**: Text Area, **Session State**: CLOB
  * `SIGNED_DOC_BLOB` → **Type**: Text Area, **Session State**: CLOB
  * `SIGNED_DOC_FILE_NAME` → **Type**: Text

### ✅ Step 5: Upload Static Files

* Go to **Shared Components > Static Application Files**
* Upload the following:

  * `/css/eSignDoc_style.css`
  * `/js/eSignDoc_script.js`

### ✅ Step 6: Reference Scripts on Page

* Navigate to your page → Page Attributes → Execute When Page Loads:

```html
<link rel="stylesheet" href="#APP_IMAGES#eSignDoc_style.css">
<script src="#APP_IMAGES#eSignDoc_script.js"></script>
```

### ✅ Step 7: Add AJAX Callback Process

* Go to **Processing > AJAX Callback**
* Create new process with exact name: `SAVE_SIGNED_PDF`

#### PL/SQL Sample Code:

```plsql
DECLARE
  l_blob BLOB;
BEGIN
  l_blob := apex_web_service.clobbase642blob(:SIGNED_DOC_BLOB);
  INSERT INTO SIGNED_DOCS (FILENAME, PDF_BLOB)
  VALUES (apex_application.g_x01, l_blob);
END;
```

📌 *Note: Do not rename this process. It must remain `SAVE_SIGNED_PDF` for JavaScript to work.*

---

## 📂 Output Storage Table

```sql
CREATE TABLE SIGNED_DOCS (
  ID         NUMBER GENERATED ALWAYS AS IDENTITY,
  FILENAME   VARCHAR2(255),
  PDF_BLOB   BLOB,
  CREATED_ON TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📣 Contact & Contribution

Feel free to submit issues, contribute features, or fork from GitHub.

## **FOR  THE SOURCE CODE**
_**contact me on whatsapp :+919745795598
linkedin :-  https://www.linkedin.com/in/muhammed-mishab-pp-** _



