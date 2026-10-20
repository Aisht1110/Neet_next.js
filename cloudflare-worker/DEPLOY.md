# ⚡ NEET Counselling — Cloudflare Worker Deployment & Payment Setup Guide

This guide walks you through deploying the Cloudflare Worker serverless payment backend (`neet-payment-worker`) directly from your terminal, configuring secrets, and setting up Razorpay Webhooks.

---

## 🛠️ Step 1: Install Wrangler & Login to Cloudflare

From the project root or terminal:

```bash
# 1. Navigate to the cloudflare-worker folder
cd cloudflare-worker

# 2. Login to your Cloudflare account (opens browser)
npx wrangler login
```

---

## 🚀 Step 2: Deploy the Cloudflare Worker

Deploy the worker code to Cloudflare Edge:

```bash
npx wrangler deploy
```

Once deployment completes, Wrangler will print your live worker URL:
```text
Published neet-payment-worker (0.91 sec)
  https://neet-payment-worker.<your-subdomain>.workers.dev
```

Copy this URL — you will paste it into `js/payment.js` or `window.PAYMENT_CONFIG.workerBaseUrl`.

---

## 🔑 Step 3: Set Worker Secrets in Terminal

Run each command in PowerShell / Terminal. When prompted, paste the corresponding value:

### 1. Razorpay Key ID
```bash
npx wrangler secret put RAZORPAY_KEY_ID
```
*Enter: `rzp_test_...` or your Live Key ID `rzp_live_...` from [Razorpay Dashboard](https://dashboard.razorpay.com/#/app/keys).*

### 2. Razorpay Key Secret
```bash
npx wrangler secret put RAZORPAY_KEY_SECRET
```
*Enter: Your Razorpay Key Secret from Dashboard $\rightarrow$ Settings $\rightarrow$ API Keys.*

### 3. Razorpay Webhook Secret
```bash
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
```
*Enter: Any secure random secret string you choose (e.g. `neet_webhook_sec_2026`). You will use this same string in Step 4.*

### 4. Firebase Service Account Email
```bash
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_EMAIL
```
*Enter: `firebase-adminsdk-xxxxx@neet-coounselling-web.iam.gserviceaccount.com` (from your Firebase Service Account JSON).*

### 5. Firebase Service Account Key (Base64-encoded Private Key)
```bash
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_KEY
```

> **How to get the Base64 Private Key on Windows (PowerShell):**
> 1. Go to [Firebase Console](https://console.firebase.google.com/) $\rightarrow$ **Project Settings** $\rightarrow$ **Service Accounts** $\rightarrow$ **Generate New Private Key**.
> 2. Open the downloaded JSON file and copy the `private_key` string (starting with `-----BEGIN PRIVATE KEY-----`).
> 3. In PowerShell, encode it to Base64:
> ```powershell
> [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("-----BEGIN PRIVATE KEY-----`nMIIEv...`n-----END PRIVATE KEY-----`n"))
> ```
> 4. Paste that Base64 string into `npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_KEY`.

---

## 🪝 Step 4: Configure Webhook in Razorpay Dashboard

1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** $\rightarrow$ **Webhooks** $\rightarrow$ **Add New Webhook**.
3. **Webhook URL**: `https://neet-payment-worker.<your-subdomain>.workers.dev/webhook`
4. **Secret**: Enter the exact secret string you configured in Step 3 for `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**:
   - Check **`payment.captured`**
   - Check **`order.paid`**
6. Click **Create Webhook**.

---

## 🎯 Step 5: Test Endpoints & Health Check

Test your live worker health endpoint in browser or terminal:

```bash
curl https://neet-payment-worker.<your-subdomain>.workers.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "neet-payment-worker",
  "project": "neet-coounselling-web",
  "timestamp": "2026-08-14T..."
}
```

---

## 💳 NEET Counselling Pricing & Tier Matrix

| Pass Tier | Price | User Badge | Features Included |
| :--- | :--- | :--- | :--- |
| **Basic Pass 2026** | **₹149** | ⚡ PRO Plus | Full Predictor (700+ colleges), AIQ (15%) Cutoffs, Wishlist & Device Sync |
| **Season Pass 2026** | **₹299** | 👑 PRO VIP | All Basic Features + State Quota (85%), Smart Choice Filling Algorithm, Bond Penalty & Fees, All Rounds |
| **Upgrade to Season**| **₹150** | 👑 PRO VIP | Upgrade difference for existing Basic Pass holders |

### Active Launch Promo Coupons:
- `NEET2026` — ₹50 Flat Off
- `EARLYBIRD` — ₹50 Early Bird Discount
- `MEDICO50` — ₹50 Future Medicos Discount
- `DOCTOR100` — ₹100 Off on Season Pass

---

## 🔍 Live Monitoring & Debugging

To stream live logs from the worker while testing transactions:

```bash
npx wrangler tail
```
