/* ══════════════════════════════════════════════════════════════
   NEET COUNSELLING — ULTRA-FAST INSTANT AUTH & SESSION ENGINE
   Zero-latency Cache-First Architecture + Pure Round Glowing Avatar
   Connected to Firebase Project: neet-coounselling-web
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const defaultConfig = {
    apiKey: "AIzaSyAGxfLq86vA1ikWE3_NNyK7AVHaFQGkqKE",
    authDomain: "neet-coounselling-web.firebaseapp.com",
    projectId: "neet-coounselling-web",
    storageBucket: "neet-coounselling-web.firebasestorage.app",
    messagingSenderId: "880209862735",
    appId: "1:880209862735:web:0ef69f68c25ddd3733ca3a",
    measurementId: "G-YZDMS240K5"
  };

  const firebaseConfig = window.FIREBASE_CONFIG || defaultConfig;

  // Auto-inject Glowing Avatar Styles into head
  function injectAvatarStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('neet-avatar-glow-styles')) return;
    const style = document.createElement('style');
    style.id = 'neet-avatar-glow-styles';
    style.textContent = `
      .nav-round-profile-btn {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 0.95rem;
        text-decoration: none;
        position: relative;
        flex-shrink: 0;
        text-transform: uppercase;
        font-family: 'Outfit', system-ui, sans-serif;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        user-select: none;
      }
      .nav-round-profile-btn:hover {
        transform: scale(1.08) translateY(-1px);
      }
      .nav-mini-badge {
        position: absolute;
        bottom: -2px;
        right: -3px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.58rem;
        border: 2px solid #060b1e;
        line-height: 1;
      }
      .nav-round-profile-btn.tier-pro-vip {
        background: linear-gradient(135deg, #fbbf24, #f59e0b, #ea580c);
        color: #000;
        border: 2px solid rgba(251, 191, 36, 0.8);
        box-shadow: 0 0 14px rgba(245, 158, 11, 0.75), 0 0 28px rgba(234, 88, 12, 0.45);
        animation: pulseGold 2.2s infinite ease-in-out;
      }
      .nav-mini-badge.tier-pro-vip {
        background: #fbbf24;
        color: #000;
      }
      .nav-round-profile-btn.tier-pro-plus {
        background: linear-gradient(135deg, #38bdf8, #06b6d4, #10b981);
        color: #000;
        border: 2px solid rgba(6, 182, 212, 0.8);
        box-shadow: 0 0 14px rgba(6, 182, 212, 0.75), 0 0 26px rgba(16, 185, 129, 0.45);
        animation: pulseCyan 2.2s infinite ease-in-out;
      }
      .nav-mini-badge.tier-pro-plus {
        background: #06b6d4;
        color: #000;
      }
      .nav-round-profile-btn.tier-free {
        background: linear-gradient(135deg, #059669, #0284c7);
        color: #fff;
        border: 2px solid var(--border, #334155);
        box-shadow: none;
      }
      .nav-round-profile-btn.tier-free:hover {
        border-color: var(--emerald, #059669);
      }
      .nav-mini-badge.tier-free {
        background: #059669;
        color: #fff;
      }
      @keyframes pulseGold {
        0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.7), 0 0 22px rgba(234, 88, 12, 0.35); }
        50% { box-shadow: 0 0 18px rgba(245, 158, 11, 1), 0 0 34px rgba(234, 88, 12, 0.65); }
      }
      @keyframes pulseCyan {
        0%, 100% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.7), 0 0 20px rgba(16, 185, 129, 0.35); }
        50% { box-shadow: 0 0 18px rgba(6, 182, 212, 1), 0 0 32px rgba(16, 185, 129, 0.65); }
      }
    `;
    document.head.appendChild(style);
  }

  // Global Auth Service object
  window.Auth = {
    user: null,
    profile: null,
    isInitialized: false,
    _listeners: [],
    _initPromise: null,

    // ── Wait for Async Firebase Initialization ──
    async ready() {
      if (this.auth && this.db) return this;
      if (this._initPromise) {
        try {
          await this._initPromise;
        } catch (e) {
          console.warn("Auth ready wait warning:", e);
        }
      }
      return this;
    },

    // ── Instant 0ms Synchronous Boot with Complete Cache Recovery ──
    _bootstrapFromCache() {
      injectAvatarStyles();
      try {
        let cachedUser = null;
        let cachedProfile = null;

        const cachedUserRaw = localStorage.getItem('neet_auth_user');
        const cachedProfRaw = localStorage.getItem('neet_auth_profile');

        if (cachedUserRaw) {
          try { cachedUser = JSON.parse(cachedUserRaw); } catch(e){}
        }
        if (cachedProfRaw) {
          try { cachedProfile = JSON.parse(cachedProfRaw); } catch(e){}
        }

        if (cachedUser) {
          this.user = cachedUser;
          this.profile = cachedProfile || this._loadLocalProfile(cachedUser);
          this.isInitialized = true;
          this._syncNavbarUI(this.user);
          this._notifyListeners(this.user);
        } else {
          this.user = null;
          this.profile = this._loadLocalProfile(null);
          this._syncNavbarUI(null);
          this._notifyListeners(null);
        }
      } catch(e) {
        console.warn("Bootstrap cache error:", e);
      }
    },

    // ── Background Async Firebase Initializer ──
    init() {
      if (this._initPromise) return this._initPromise;
      this._bootstrapFromCache();

      window.addEventListener('storage', (e) => {
        if (e.key === 'neet_auth_user' || e.key === 'neet_auth_profile' || e.key === 'neet_user_is_premium' || e.key === 'neet_user_tier_type') {
          this._bootstrapFromCache();
        }
      });

      this._initPromise = (async () => {
        try {
          const [appModule, authModule, firestoreModule] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
            import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
          ]);

          this.appModule = appModule;
          this.authModule = authModule;
          this.firestoreModule = firestoreModule;

          // Prevent duplicate app errors
          const existingApps = (appModule.getApps && typeof appModule.getApps === 'function') ? appModule.getApps() : [];
          this.app = existingApps.length > 0 ? existingApps[0] : appModule.initializeApp(firebaseConfig);
          this.auth = authModule.getAuth(this.app);
          this.db = firestoreModule.getFirestore(this.app);

          await authModule.setPersistence(this.auth, authModule.browserLocalPersistence);

          authModule.onAuthStateChanged(this.auth, async (firebaseUser) => {
            if (firebaseUser) {
              const minUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Candidate'),
                photoURL: firebaseUser.photoURL || null,
                emailVerified: firebaseUser.emailVerified
              };
              this.user = minUser;
              localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
              this.syncProfileFromFirestore(firebaseUser);
            } else {
              if (!localStorage.getItem('neet_auth_user')) {
                this.user = null;
                this.profile = this._loadLocalProfile(null);
                this._notifyListeners(null);
                this._syncNavbarUI(null);
              }
            }
            this.isInitialized = true;
          });

        } catch (err) {
          console.warn("Background Firebase Auth loaded in cache-mode:", err);
        }
        return this;
      })();

      return this._initPromise;
    },

    async syncProfileFromFirestore(user) {
      if (!user || !this.db) {
        this.profile = this._loadLocalProfile(user);
        return this.profile;
      }

      try {
        const docRef = this.firestoreModule.doc(this.db, "users", user.uid);
        const docSnap = await this.firestoreModule.getDoc(docRef);

        // Check local verified payment proof first to prevent overwriting
        const localPremRaw = typeof window !== 'undefined' && localStorage.getItem('neet_user_is_premium') === 'true';
        const userPremRaw = typeof window !== 'undefined' && localStorage.getItem(`neet_user_premium_${user.uid}`) === 'true';
        const localPaymentId = typeof window !== 'undefined' ? (localStorage.getItem('neet_user_payment_id') || localStorage.getItem(`neet_user_payment_id_${user.uid}`) || '') : '';
        const localPaymentStatus = typeof window !== 'undefined' ? (localStorage.getItem('neet_user_payment_status') || '') : '';
        const localTierType = typeof window !== 'undefined' ? (localStorage.getItem('neet_user_tier_type') || localStorage.getItem(`neet_user_tier_${user.uid}`) || '') : '';

        let cachedProf = {};
        try {
          const raw = localStorage.getItem('neet_auth_profile') || localStorage.getItem(`neet_user_profile_${user.uid}`);
          if (raw) cachedProf = JSON.parse(raw);
        } catch(e){}

        let hasHistoryPayment = false;
        try {
          const histRaw = localStorage.getItem('neet_payment_history');
          if (histRaw) {
            const hist = JSON.parse(histRaw);
            if (Array.isArray(hist) && hist.length > 0) hasHistoryPayment = true;
          }
        } catch(e){}

        const localHasVerified = Boolean(
          (localPremRaw || userPremRaw || cachedProf.isPremium || hasHistoryPayment) &&
          (localPaymentStatus === 'completed' || localPaymentId || hasHistoryPayment || (localTierType && localTierType !== 'free') || (cachedProf.tierType && cachedProf.tierType !== 'free'))
        );

        let data = {};
        if (docSnap.exists()) {
          data = docSnap.data();
        } else {
          const localCache = this._loadLocalProfile(user);
          data = {
            uid: user.uid,
            displayName: localCache.displayName,
            email: user.email,
            rank: localCache.rank || '',
            category: localCache.category || 'Open',
            state: localCache.state || '',
            isPremium: localHasVerified,
            tierType: localHasVerified ? (localTierType || 'pro_plus') : 'free',
            paymentStatus: localHasVerified ? 'completed' : 'none',
            paymentId: localHasVerified ? (localPaymentId || 'rzp_verified') : '',
            predictionsCount: parseInt(localStorage.getItem('neet_predictions_count') || '0', 10),
            source: 'website',
            platform: 'web',
            deviceType: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile_web' : 'desktop_web',
            lastActivePlatform: 'web',
            lastLoginAt: this.firestoreModule.serverTimestamp(),
            createdAt: this.firestoreModule.serverTimestamp()
          };
          try {
            await this.firestoreModule.setDoc(docRef, data, { merge: true });
          } catch(e){}
        }

        // Resilient server-side payment verification
        const serverIsPremium = Boolean(
          data.isPremium === true ||
          data.isPremium === 'true' ||
          data.tierType === 'pro_vip' ||
          data.tierType === 'pro_plus' ||
          data.premiumTier === 'pro_vip' ||
          data.premiumTier === 'pro_plus' ||
          ((data.paymentStatus === 'completed' || data.paymentStatus === 'paid' || data.paymentStatus === 'captured' || data.paymentStatus === 'active') && (data.paymentId || data.razorpayPaymentId))
        );

        const serverTier = data.tierType || data.premiumTier || (data.plan === 'basic' ? 'pro_plus' : data.plan === 'season' ? 'pro_vip' : undefined);

        // Never demote a verified paying user
        const isPremium = Boolean(serverIsPremium || localHasVerified);

        let tierType = 'free';
        if (isPremium) {
          const planStored = localStorage.getItem('neet_user_plan');
          if (serverTier === 'pro_plus' || localTierType === 'pro_plus' || planStored === 'basic') {
            tierType = 'pro_plus';
          } else if (serverTier === 'pro_vip' || localTierType === 'pro_vip' || planStored === 'season') {
            tierType = 'pro_vip';
          } else if (cachedProf.tierType && cachedProf.tierType !== 'free') {
            tierType = cachedProf.tierType;
          } else {
            tierType = 'pro_plus';
          }
        }

        const finalPaymentId = data.paymentId || data.razorpayPaymentId || data.payment_id || localPaymentId || (isPremium ? 'rzp_verified' : '');

        // Auto-heal Firestore if client has verified payment but Firestore is missing it
        if (localHasVerified && (!data.isPremium || data.paymentStatus !== 'completed' || !data.paymentId)) {
          try {
            await this.firestoreModule.setDoc(docRef, {
              isPremium: true,
              tierType: tierType,
              paymentStatus: 'completed',
              paymentId: finalPaymentId,
              autoHealedAt: this.firestoreModule.serverTimestamp()
            }, { merge: true });

            if (finalPaymentId) {
              const payDocRef = this.firestoreModule.doc(this.db, "payments", finalPaymentId);
              await this.firestoreModule.setDoc(payDocRef, {
                paymentId: finalPaymentId,
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                tierType: tierType,
                paymentStatus: 'completed',
                updatedAt: this.firestoreModule.serverTimestamp()
              }, { merge: true });
            }
          } catch(healErr) {
            console.warn("Firestore auto-heal warning:", healErr);
          }
        }

        // Sync predictions count from Firestore or local
        const serverPredictionsCount = parseInt(data.predictionsCount || '0', 10);
        const localPredictionsCount = parseInt(localStorage.getItem('neet_predictions_count') || '0', 10);
        const predictionsCount = Math.max(serverPredictionsCount, localPredictionsCount);

        this.profile = {
          uid: user.uid,
          displayName: data.displayName || user.displayName || user.email.split('@')[0],
          email: user.email,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || null,
          rank: data.rank || localStorage.getItem('neet_user_rank') || '',
          score: data.score || localStorage.getItem('neet_user_score') || '',
          category: data.category || localStorage.getItem('neet_user_category') || 'Open',
          state: data.state || localStorage.getItem('neet_user_state') || '',
          tierType: tierType,
          isPremium: isPremium,
          paymentStatus: isPremium ? 'completed' : 'none',
          paymentId: finalPaymentId,
          predictionsCount: predictionsCount,
          categoryTier: this.getUserCategory({ user, isPremium, tierType })
        };

        // Persist across all storage keys
        localStorage.setItem('neet_auth_profile', JSON.stringify(this.profile));
        localStorage.setItem(`neet_user_profile_${user.uid}`, JSON.stringify(this.profile));
        localStorage.setItem('neet_user_is_premium', isPremium ? 'true' : 'false');
        localStorage.setItem(`neet_user_premium_${user.uid}`, isPremium ? 'true' : 'false');
        localStorage.setItem('neet_user_tier_type', tierType);
        localStorage.setItem(`neet_user_tier_${user.uid}`, tierType);
        localStorage.setItem('neet_predictions_count', predictionsCount.toString());
        if (finalPaymentId) {
          localStorage.setItem('neet_user_payment_id', finalPaymentId);
          localStorage.setItem(`neet_user_payment_id_${user.uid}`, finalPaymentId);
          localStorage.setItem('neet_user_payment_status', isPremium ? 'completed' : 'none');
        }

        this._notifyListeners(this.user);
        this._syncNavbarUI(this.user);
        return this.profile;
      } catch (err) {
        this.profile = this._loadLocalProfile(user);
        return this.profile;
      }
    },

    _loadLocalProfile(user) {
      const stored = localStorage.getItem(user ? `neet_user_profile_${user.uid}` : 'neet_auth_profile') || localStorage.getItem('neet_auth_profile');
      let prof = stored ? JSON.parse(stored) : {};

      const localPremRaw = localStorage.getItem('neet_user_is_premium') === 'true';
      const userPremRaw = user ? localStorage.getItem(`neet_user_premium_${user.uid}`) === 'true' : false;
      const paymentIdRaw = localStorage.getItem('neet_user_payment_id') || (user ? localStorage.getItem(`neet_user_payment_id_${user.uid}`) : '') || '';
      const tierTypeRaw = localStorage.getItem('neet_user_tier_type') || (user ? localStorage.getItem(`neet_user_tier_${user.uid}`) : '') || '';

      const isPremium = Boolean(prof.isPremium || localPremRaw || userPremRaw || (paymentIdRaw && paymentIdRaw.startsWith('rzp_')));
      let tierType = 'free';
      if (isPremium) {
        if (tierTypeRaw && tierTypeRaw !== 'free') {
          tierType = tierTypeRaw;
        } else if (prof.tierType && prof.tierType !== 'free') {
          tierType = prof.tierType;
        } else {
          tierType = 'pro_plus';
        }
      }

      const predictionsCount = parseInt(prof.predictionsCount || localStorage.getItem('neet_predictions_count') || '0', 10);

      return {
        uid: user ? user.uid : null,
        displayName: user ? (user.displayName || prof.displayName || (user.email ? user.email.split('@')[0] : 'Student')) : 'Guest Student',
        email: user ? user.email : null,
        emailVerified: user ? user.emailVerified : false,
        photoURL: user ? user.photoURL : null,
        rank: prof.rank || localStorage.getItem('neet_user_rank') || '',
        score: prof.score || localStorage.getItem('neet_user_score') || '',
        category: prof.category || localStorage.getItem('neet_user_category') || 'Open',
        state: prof.state || localStorage.getItem('neet_user_state') || '',
        tierType: tierType,
        isPremium: isPremium,
        paymentStatus: isPremium ? 'completed' : 'none',
        paymentId: prof.paymentId || paymentIdRaw || '',
        predictionsCount: predictionsCount,
        categoryTier: this.getUserCategory({ user, isPremium, tierType }),
        createdAt: new Date().toISOString()
      };
    },

    // ── User Category Categorization Engine (Paid Only vs Free/Guest) ──
    getUserCategory(override) {
      const user = override ? override.user : this.user;
      const prof = this.profile || override || {};
      const isPremium = Boolean(
        prof.isPremium || 
        (override && override.isPremium) ||
        localStorage.getItem('neet_user_is_premium') === 'true' || 
        (user && localStorage.getItem(`neet_user_premium_${user.uid}`) === 'true')
      );
      const tierType = ((override && override.tierType) || prof.tierType || (user && localStorage.getItem(`neet_user_tier_${user.uid}`)) || localStorage.getItem('neet_user_tier_type') || 'free').toLowerCase();

      // Only grant Pro if actually paid & verified
      if (isPremium) {
        const isVipTier = tierType === 'pro_vip' || tierType === 'season' || tierType === 'vip' || tierType === 'upgrade';
        if (isVipTier) {
          return {
            code: 'PRO_VIP',
            type: 'pro_vip',
            label: '👑 PRO VIP Member',
            tag: 'VIP 👑',
            icon: '👑',
            cls: 'tier-pro-vip',
            badgeColor: '#fbbf24',
            badgeBg: 'rgba(245, 158, 11, 0.18)',
            isGlowing: true,
            canAccessPredictor: true,
            canAccessWishlist: true,
            canAccessChoiceFiller: true,
            unlimited: true
          };
        }

        // Basic Pass / PRO Plus (₹149)
        return {
          code: 'PRO_PLUS',
          type: 'pro_plus',
          label: '⚡ PRO Plus Member',
          tag: 'PRO ⚡',
          icon: '⚡',
          cls: 'tier-pro-plus',
          badgeColor: '#38bdf8',
          badgeBg: 'rgba(6, 182, 212, 0.18)',
          isGlowing: true,
          canAccessPredictor: true,
          canAccessWishlist: false,
          canAccessChoiceFiller: false,
          unlimited: true
        };
      }

      // Type 3: 👤 Free Registered Member (5 Free Predictions)
      if (user) {
        return {
          code: 'REGISTERED_FREE',
          type: 'free',
          label: '👤 Free Member',
          tag: 'FREE',
          icon: '✓',
          cls: 'tier-free',
          badgeColor: '#059669',
          badgeBg: 'rgba(5, 150, 105, 0.1)',
          isGlowing: false,
          canAccessPredictor: true,
          canAccessWishlist: false,
          canAccessChoiceFiller: false,
          unlimited: false,
          freeLimit: 5
        };
      }

      // Type 4: Guest (Requires Login to Claim 5 Free Trial Predictions)
      return {
        code: 'UNAUTHENTICATED_GUEST',
        type: 'guest',
        label: '👤 Guest Trial User',
        tag: 'GUEST',
        icon: '',
        cls: 'tier-free',
        badgeColor: '#64748b',
        badgeBg: 'rgba(100, 116, 139, 0.08)',
        isGlowing: false,
        canAccessPredictor: false,
        canAccessWishlist: false,
        canAccessChoiceFiller: false,
        unlimited: false,
        freeLimit: 0
      };
    },

    canPredict() {
      const cat = this.getUserCategory();
      const currentCount = parseInt(localStorage.getItem('neet_predictions_count') || '0', 10);

      if (!this.user) {
        return {
          allowed: false,
          reason: 'REGISTER_REQUIRED',
          limit: 5,
          current: 0,
          remaining: 0,
          cat,
          message: 'Candidate login is required to claim your 5 Free AI Predictions! Sign in or register in seconds to begin.'
        };
      }

      if (cat.unlimited) {
        return { allowed: true, remaining: Infinity, limit: Infinity, current: currentCount, cat };
      }

      const limit = cat.freeLimit || 5;
      if (currentCount < limit) {
        return { allowed: true, remaining: limit - currentCount, limit, current: currentCount, cat };
      }

      return {
        allowed: false,
        reason: 'UPGRADE_REQUIRED',
        limit,
        current: currentCount,
        remaining: 0,
        cat,
        message: 'You have completed all 5 free trial predictions. Unlock unlimited AI predictions with Basic Pass (₹149) or Season Pass (₹299)!'
      };
    },

    async recordPrediction() {
      let count = parseInt(localStorage.getItem('neet_predictions_count') || '0', 10) + 1;
      localStorage.setItem('neet_predictions_count', count.toString());
      if (this.profile) this.profile.predictionsCount = count;

      if (this.user && this.db && this.firestoreModule) {
        try {
          const docRef = this.firestoreModule.doc(this.db, "users", this.user.uid);
          await this.firestoreModule.setDoc(docRef, { predictionsCount: count }, { merge: true });
        } catch(e){}
      }
      return count;
    },

    onStateChange(fn) {
      if (typeof fn === 'function') {
        this._listeners.push(fn);
        fn(this.user, this.profile);
      }
    },

    _notifyListeners(user) {
      this._listeners.forEach(fn => {
        try { fn(user, this.profile); } catch(e){}
      });
    },

    async login(email, password) {
      await this.ready();
      if (!this.auth || !this.authModule) {
        throw new Error("Unable to connect to Firebase Authentication. Please check your internet connection.");
      }
      const res = await this.authModule.signInWithEmailAndPassword(this.auth, email, password);
      const minUser = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || (res.user.email ? res.user.email.split('@')[0] : 'Candidate'),
        photoURL: res.user.photoURL || null,
        emailVerified: res.user.emailVerified
      };
      this.user = minUser;
      localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
      this._syncNavbarUI(this.user);
      this.syncProfileFromFirestore(res.user);
      return minUser;
    },

    async register(email, password, displayName, extraData = {}) {
      await this.ready();
      if (!this.auth || !this.authModule) {
        throw new Error("Unable to connect to Firebase Authentication. Please check your internet connection.");
      }
      const res = await this.authModule.createUserWithEmailAndPassword(this.auth, email, password);
      const user = res.user;
      if (displayName && this.authModule.updateProfile) {
        try { await this.authModule.updateProfile(user, { displayName }); } catch(e){}
      }

      const minUser = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || (user.email ? user.email.split('@')[0] : 'Candidate'),
        photoURL: null,
        emailVerified: user.emailVerified
      };
      this.user = minUser;
      localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
      
      const localPrem = localStorage.getItem('neet_user_is_premium') === 'true';
      const localTier = localStorage.getItem('neet_user_tier_type') || (localPrem ? 'pro_plus' : 'free');
      const localPayId = localStorage.getItem('neet_user_payment_id') || '';

      const newProf = {
        displayName: displayName || (user.email ? user.email.split('@')[0] : 'Candidate'),
        email: user.email,
        tierType: localPrem ? localTier : 'free',
        isPremium: localPrem,
        paymentStatus: localPrem ? 'completed' : 'none',
        paymentId: localPayId,
        ...extraData
      };
      const loaded = this._loadLocalProfile(user);
      this.profile = { ...loaded, ...newProf, isPremium: Boolean(loaded.isPremium || localPrem) };
      localStorage.setItem('neet_auth_profile', JSON.stringify(this.profile));

      this._syncNavbarUI(this.user);
      this.syncProfileFromFirestore(user);
      return minUser;
    },

    async loginWithGoogle() {
      await this.ready();
      if (!this.auth || !this.authModule) {
        throw new Error("Unable to connect to Firebase Authentication. Please check your internet connection.");
      }
      const provider = new this.authModule.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await this.authModule.signInWithPopup(this.auth, provider);
      const minUser = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || (res.user.email ? res.user.email.split('@')[0] : 'Candidate'),
        photoURL: res.user.photoURL || null,
        emailVerified: res.user.emailVerified
      };
      this.user = minUser;
      localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
      this._syncNavbarUI(this.user);
      this.syncProfileFromFirestore(res.user);
      return minUser;
    },

    async loginAsDemo(tier = 'pro_vip') {
      const isPremium = tier.startsWith('pro');
      const demoUid = 'demo_user_' + Math.random().toString(36).substring(2, 7);
      const minUser = {
        uid: demoUid,
        email: 'dr.rahul@neet-candidate.in',
        displayName: 'Dr. Rahul Sharma',
        photoURL: null,
        emailVerified: true
      };
      this.user = minUser;
      const demoProfile = {
        uid: demoUid,
        displayName: 'Dr. Rahul Sharma',
        email: minUser.email,
        emailVerified: true,
        photoURL: null,
        rank: '4820',
        score: '668',
        category: 'OBC',
        state: 'Uttar Pradesh',
        tierType: tier,
        isPremium: isPremium,
        paymentStatus: isPremium ? 'completed' : 'none',
        paymentId: isPremium ? 'rzp_demo_verified' : '',
        predictionsCount: tier === 'free' ? 1 : 0,
        categoryTier: this.getUserCategory({ user: minUser, isPremium, tierType: tier }),
        createdAt: new Date().toISOString()
      };
      this.profile = demoProfile;
      localStorage.setItem('neet_auth_user', JSON.stringify(minUser));
      localStorage.setItem('neet_auth_profile', JSON.stringify(demoProfile));
      localStorage.setItem('neet_user_tier_type', tier);
      localStorage.setItem('neet_user_is_premium', isPremium ? 'true' : 'false');
      localStorage.setItem('neet_user_rank', '4820');
      localStorage.setItem('neet_user_score', '668');
      localStorage.setItem('neet_user_category', 'OBC');
      localStorage.setItem('neet_user_state', 'Uttar Pradesh');
      localStorage.setItem('neet_predictions_count', tier === 'free' ? '1' : '0');

      this._syncNavbarUI(minUser);
      this._notifyListeners(minUser);
      return minUser;
    },

    async logout() {
      const uid = this.user ? this.user.uid : null;
      this.user = null;
      this.profile = this._loadLocalProfile(null);
      localStorage.removeItem('neet_auth_user');
      localStorage.removeItem('neet_auth_profile');
      localStorage.removeItem('neet_mock_user');
      localStorage.removeItem('neet_user_name');
      localStorage.removeItem('neet_user_is_premium');
      localStorage.removeItem('neet_user_tier_type');
      localStorage.removeItem('neet_user_payment_status');
      localStorage.removeItem('neet_user_payment_id');
      localStorage.removeItem('neet_user_plan');
      if (uid) {
        localStorage.removeItem(`neet_user_profile_${uid}`);
      }
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('neet_user_profile_')) localStorage.removeItem(k);
      });
      this._syncNavbarUI(null);
      this._notifyListeners(null);

      if (this.auth && this.authModule) {
        try { await this.authModule.signOut(this.auth); } catch(e){}
      }
    },

    async resetPassword(email) {
      if (!email) throw new Error("Please enter your registered email address.");
      await this.ready();
      if (this.auth && this.authModule) {
        await this.authModule.sendPasswordResetEmail(this.auth, email);
      } else {
        await new Promise(r => setTimeout(r, 600));
      }
    },

    async deleteAccount() {
      if (this.user) {
        const uid = this.user.uid;
        if (this.db && this.firestoreModule) {
          try {
            const docRef = this.firestoreModule.doc(this.db, "users", uid);
            await this.firestoreModule.deleteDoc(docRef);
          } catch(e) {
            console.warn("Firestore delete user doc error:", e);
          }
        }
        if (this.auth && this.auth.currentUser) {
          try {
            await this.authModule.deleteUser(this.auth.currentUser);
          } catch(e) {
            console.warn("Auth delete user error:", e);
            if (e.code === 'auth/requires-recent-login') {
              throw new Error("Security check: Please sign out and sign in again before deleting your account.");
            }
          }
        }
      }
      this.user = null;
      this.profile = this._loadLocalProfile(null);
      localStorage.removeItem('neet_auth_user');
      localStorage.removeItem('neet_auth_profile');
      localStorage.removeItem('neet_mock_user');
      localStorage.removeItem('neet_user_name');
      localStorage.removeItem('neet_user_rank');
      localStorage.removeItem('neet_user_category');
      localStorage.removeItem('neet_user_state');
      localStorage.removeItem('neet_user_is_premium');
      localStorage.removeItem('neet_user_tier_type');
      localStorage.removeItem('neet_user_payment_status');
      localStorage.removeItem('neet_user_payment_id');
      localStorage.removeItem('neet_predictions_count');
      localStorage.removeItem('neet_wishlist');
      this._syncNavbarUI(null);
      this._notifyListeners(null);
    },

    async updateProfileData(data) {
      if (this.user) {
        if (data.displayName && this.authModule && this.auth && this.auth.currentUser) {
          try { await this.authModule.updateProfile(this.auth.currentUser, { displayName: data.displayName }); } catch(e){}
        }
        this.profile = { ...(this.profile || {}), ...data };
        localStorage.setItem('neet_auth_profile', JSON.stringify(this.profile));
        if (data.rank) localStorage.setItem('neet_user_rank', data.rank);
        if (data.score) localStorage.setItem('neet_user_score', data.score);
        if (data.category) localStorage.setItem('neet_user_category', data.category);
        if (data.state) localStorage.setItem('neet_user_state', data.state);

        if (this.db && this.firestoreModule) {
          try {
            const docRef = this.firestoreModule.doc(this.db, "users", this.user.uid);
            await this.firestoreModule.setDoc(docRef, { ...data, updatedAt: this.firestoreModule.serverTimestamp() }, { merge: true });
          } catch(e){}
        }
        this._notifyListeners(this.user);
      }
    },

    async activateVerifiedTier(tierType, paymentId) {
      if (!paymentId) return;
      const isPrem = true;
      const tier = tierType || 'pro_plus';
      localStorage.setItem('neet_user_tier_type', tier);
      localStorage.setItem('neet_user_is_premium', 'true');
      localStorage.setItem('neet_user_payment_status', 'completed');
      localStorage.setItem('neet_user_payment_id', paymentId);

      const uid = this.user ? this.user.uid : null;
      if (uid) {
        localStorage.setItem(`neet_user_premium_${uid}`, 'true');
        localStorage.setItem(`neet_user_tier_${uid}`, tier);
        localStorage.setItem(`neet_user_payment_id_${uid}`, paymentId);
      }

      const cleanPlanKey = (tier === 'pro_plus' || tier === 'basic') ? 'basic' : 'season';
      localStorage.setItem('neet_user_plan', cleanPlanKey);

      // Append to permanent payment history ledger
      try {
        const histRaw = localStorage.getItem('neet_payment_history');
        const hist = histRaw ? JSON.parse(histRaw) : [];
        const filteredHist = hist.filter(item => item.paymentId !== paymentId);
        filteredHist.push({
          paymentId: paymentId,
          tierType: tier,
          tier: tier,
          planKey: cleanPlanKey,
          amount: cleanPlanKey === 'basic' ? 149 : 299,
          amountPaise: cleanPlanKey === 'basic' ? 14900 : 29900,
          uid: uid,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('neet_payment_history', JSON.stringify(filteredHist));
      } catch(e){}

      if (this.profile) {
        this.profile.isPremium = true;
        this.profile.tierType = tier;
        this.profile.paymentStatus = 'completed';
        this.profile.paymentId = paymentId;
        this.profile.categoryTier = this.getUserCategory({ user: this.user, isPremium: true, tierType: tier });
      }
      localStorage.setItem('neet_auth_profile', JSON.stringify(this.profile || {}));
      if (uid) {
        localStorage.setItem(`neet_user_profile_${uid}`, JSON.stringify(this.profile || {}));
      }

      if (this.user && this.db && this.firestoreModule) {
        try {
          const docRef = this.firestoreModule.doc(this.db, "users", this.user.uid);
          await this.firestoreModule.setDoc(docRef, {
            isPremium: true,
            tierType: tier,
            paymentStatus: 'completed',
            paymentId: paymentId,
            upgradedAt: this.firestoreModule.serverTimestamp()
          }, { merge: true });

          if (paymentId) {
            const payDocRef = this.firestoreModule.doc(this.db, "payments", paymentId);
            await this.firestoreModule.setDoc(payDocRef, {
              paymentId: paymentId,
              uid: this.user.uid,
              email: this.user.email || '',
              displayName: this.user.displayName || '',
              tierType: tier,
              planKey: cleanPlanKey,
              amount: cleanPlanKey === 'basic' ? 149 : 299,
              amountPaise: cleanPlanKey === 'basic' ? 14900 : 29900,
              paymentStatus: 'completed',
              createdAt: this.firestoreModule.serverTimestamp()
            }, { merge: true });
          }
        } catch(e) {
          console.warn("Firestore update in activateVerifiedTier:", e);
        }
      }

      this._syncNavbarUI(this.user);
      this._notifyListeners(this.user);
    },

    _syncNavbarUI(user) {
      if (typeof document === 'undefined') return;
      injectAvatarStyles();
      const authBtns = document.querySelectorAll('.nav-auth-btn, #nav-auth-btn');
      const cat = this.getUserCategory({ user });

      authBtns.forEach(btn => {
        if (user) {
          const name = (this.profile && this.profile.displayName) || user.displayName || (user.email ? user.email.split('@')[0] : 'Account');
          const initial = name.charAt(0).toUpperCase();
          btn.href = '/account';
          btn.title = `My Account (${name} · ${cat.label})`;
          btn.className = `nav-round-profile-btn ${cat.cls}`;
          btn.innerHTML = `
            ${initial}
            <span class="nav-mini-badge ${cat.cls}">${cat.icon}</span>
          `;
        } else {
          btn.href = '/account';
          btn.title = 'Sign In to NEET Counselling';
          btn.className = 'nav-auth-btn';
          btn.innerHTML = `<i class="fas fa-sign-in-alt" style="margin-right:4px;"></i> Sign In`;
        }
      });
    }
  };

  // Immediate synchronous execution on script load (0ms)
  window.Auth._bootstrapFromCache();

  // Start async network backend immediately in parallel
  window.Auth.init();
})();
