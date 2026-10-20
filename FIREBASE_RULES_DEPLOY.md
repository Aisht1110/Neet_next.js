# 🔐 Firebase Firestore Security Rules — NEET Counselling

These are the **hardened** rules. They lock the paywall so entitlement
(`isPremium`, `tierType`, `paymentStatus`, `paymentId`) can only ever be written
by the trusted backend (the Cloudflare payment Worker via the Admin SDK), never
by the browser.

## How to deploy

1. Go to **Firebase Console** → your project (`neet-coounselling-web`) → **Firestore Database** → **Rules** tab.
2. **Delete everything** in the editor.
3. **Copy the entire block below** and paste it in.
4. Click **Publish**.
5. Wait ~30 seconds, then re-test (see "Verify" below).

> This is the same content as `firestore.rules` in this repo. Keep both in sync.

---

## ⬇️ COPY EVERYTHING BELOW THIS LINE ⬇️

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions for security checks
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    // ─────────────────────────────────────
    //  1. USERS COLLECTION (/users/{uid})
    //  Shared across Web & Mobile App
    // ─────────────────────────────────────
    match /users/{uid} {
      // User can read their own profile
      allow read: if isOwner(uid);

      // New accounts are ONLY ever created as free. Entitlement fields are
      // written exclusively by the trusted backend (payment Worker) using the
      // Admin SDK, which bypasses these rules.
      allow create: if isOwner(uid)
                    && (!('isPremium' in request.resource.data) || request.resource.data.isPremium == false)
                    && (!('tierType' in request.resource.data) || request.resource.data.tierType == 'free')
                    && (!('paymentStatus' in request.resource.data) || request.resource.data.paymentStatus == 'none')
                    && (!('paymentId' in request.resource.data) || request.resource.data.paymentId == '');

      // Users may update profile details (name, rank, score, category, count,
      // last login) but can NEVER modify entitlement fields from the client.
      // Tier grants are applied server-side by the payment Worker (Admin SDK).
      allow update: if isOwner(uid)
                    && !request.resource.data.diff(resource.data).affectedKeys().hasAny([
                      'isPremium', 'paymentId', 'paymentStatus', 'tierType',
                      'amountPaise', 'premiumTier', 'verifiedAt', 'upgradedAt'
                    ]);

      // User can permanently delete their account profile (Delete Account feature)
      allow delete: if isOwner(uid);
    }

    // ─────────────────────────────────────
    //  2. WISHLISTS COLLECTION (/wishlists/{uid})
    // ─────────────────────────────────────
    match /wishlists/{uid} {
      // Document owner has full read/write access to their saved colleges
      allow read, write: if isOwner(uid);
    }

    // ─────────────────────────────────────
    //  3. CHOICES (Choice Filling) COLLECTION (/choices/{uid})
    // ─────────────────────────────────────
    match /choices/{uid} {
      // Document owner has full read/write access to their choice filling order
      allow read, write: if isOwner(uid);
    }

    // ─────────────────────────────────────
    //  4. COUPONS COLLECTION (/coupons/{code})
    // ─────────────────────────────────────
    match /coupons/{code} {
      // Any authenticated user can read discount coupons for validation
      allow read: if isAuthenticated();

      // Only Admin / Backend can create or edit discount coupons
      allow write: if false;
    }

    // ─────────────────────────────────────
    //  5. PENDING PAYMENTS COLLECTION (/pending_payments/{paymentId})
    //     Owned by the trusted payment Worker (Admin SDK). Clients may read
    //     their own order statuses but cannot create/alter them.
    // ─────────────────────────────────────
    match /pending_payments/{paymentId} {
      allow read: if isAuthenticated()
                  && resource.data.uid == request.auth.uid;

      allow create, update, delete: if false;
    }

    // ─────────────────────────────────────
    //  6. PAYMENTS COLLECTION (/payments/{paymentId})
    //     Server-written audit records. The trusted payment Worker (Admin SDK)
    //     creates these after Razorpay signature verification. Clients may read
    //     receipts for the restore flow but can NEVER write here, so a forged
    //     receipt can never be fabricated from the browser.
    // ─────────────────────────────────────
    match /payments/{paymentId} {
      allow read: if isAuthenticated();

      // Writes happen exclusively via the Admin SDK in the payment Worker.
      allow create, update, delete: if false;
    }

    // ─────────────────────────────────────
    //  7. PREDICTION HISTORY COLLECTION (/history/{docId})
    // ─────────────────────────────────────
    match /history/{docId} {
      // User can read and delete their own calculation history
      allow read, delete: if isAuthenticated()
                          && resource.data.uid == request.auth.uid;

      // User can save calculation history records
      allow create: if isAuthenticated()
                    && request.resource.data.uid == request.auth.uid;

      // History entries are immutable (no edit allowed)
      allow update: if false;
    }

    // ─────────────────────────────────────
    //  8. SUPPORT & FEEDBACK COLLECTION (/support/{docId})
    // ─────────────────────────────────────
    match /support/{docId} {
      // Authenticated users can submit feedback/support queries
      allow create: if isAuthenticated()
                    && request.resource.data.uid == request.auth.uid;

      allow read: if isAuthenticated()
                  && resource.data.uid == request.auth.uid;

      allow update, delete: if false;
    }

    // ─────────────────────────────────────
    //  DEFAULT DENY ALL OTHER COLLECTIONS
    // ─────────────────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## ⬆️ COPY EVERYTHING ABOVE THIS LINE ⬆️

---

## What changed vs. the old rules (why this matters)

| Collection | Old behaviour | New behaviour |
|---|---|---|
| `/users/{uid}` **create** | Allowed creating a profile that was **already `isPremium: true`** with any 6-char `paymentId`. | Must be created **free** (`isPremium:false`, `tierType:'free'`, `paymentStatus:'none'`, `paymentId:''`). |
| `/users/{uid}` **update** | Allowed the client to set `isPremium:true` + `tierType:'pro_vip'` + `paymentId` itself. | Client **cannot touch** `isPremium`, `paymentId`, `paymentStatus`, `tierType`, `amountPaise`, `premiumTier`, `verifiedAt`, `upgradedAt`. Only the Admin SDK (Worker) can. |
| `/payments/{paymentId}` | Client could **create/update** its own `completed` receipt. | **Read-only** for clients. Only the Admin SDK (Worker) writes receipts. This blocks forged receipts used in the "restore pass" flow. |
| `/pending_payments/{paymentId}` | Client could **create/update** pending orders. | **Read-only** for clients. The Worker owns these. |

**Note:** There is no `/wishlists` or `/choices` change — those were already owner-only and remain fine.

---

## ⚠️ IMPORTANT — Admin SDK bypasses these rules

These rules **only restrict the browser/mobile client**. The payment Worker uses a
**service account (Admin SDK)**, which *bypasses* security rules entirely. That is
intentional and required: the Worker is the *only* thing that may grant a paid
tier, and it does so *after* verifying the Razorpay signature.

So after publishing these rules:
- ✅ A user editing `localStorage` or calling Firestore from devtools **cannot** unlock VIP.
- ✅ A user **cannot** forge a `/payments` receipt to "restore" a pass.
- ✅ The Worker's `/api/verify-payment` still writes the real tier successfully.

---

## Verify it works

1. **Free user cannot self-upgrade via Firestore**
   - Sign in in the web app, open DevTools → Console, and try:
     ```js
     // load the SDK however the app does, then attempt a bad write
     // Expected: "Missing or insufficient permissions"
     ```
   - Or simply set `localStorage.setItem('neet_user_is_premium','true')`, reload → you must **stay free**.

2. **Real payment still works**
   - Buy a test pass. Firestore Console → `users/{uid}` should show `isPremium:true` and `tierType` written **by the Worker**, and a `/payments/{id}` doc created.

3. **Restore flow still works**
   - Account → "Restore Pass" with a real `pay_...` id → should succeed because the Worker-created `/payments` doc is readable.

If a real payment suddenly stops granting access after publishing these rules,
it means the Worker is writing with the **client SDK instead of the Admin SDK** —
re-check the Worker's `FIREBASE_SERVICE_ACCOUNT_*` secrets.
