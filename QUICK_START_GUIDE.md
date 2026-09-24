# SewaSathi - Quick Start Implementation Guide

## 🚀 IMMEDIATE ACTIONS (Next 24 Hours)

### Priority 1: Critical Bug Fixes

#### 1. Fix Admin Login
**File:** [backend/routes/authRoutes.js](backend/routes/authRoutes.js#L46-L50)
**Issue:** Hardcoded credentials (security risk)
**Fix:**
```javascript
// Change from:
if (phone === 'admin' && password === 'admin123') {

// To environment-based:
if (phone === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
```

#### 2. Fix AI Model Integration
**File:** [backend/routes/aiRoutes.js](backend/routes/aiRoutes.js#L1-L10)
**Issue:** Using Ollama (needs local setup), PRD specifies Gemini 2.5 Flash
**Action:** Switch to Gemini API

```javascript
// Install: npm install @google/generative-ai

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
```

#### 3. Fix Location Timeout
**File:** [frontend/src/components/SahayakDrawer.tsx](frontend/src/components/SahayakDrawer.tsx#L23-L28)
**Issue:** 5 second timeout is too short
**Fix:**
```typescript
// Change from:
{ timeout: 5000 }

// To:
{ timeout: 10000, enableHighAccuracy: true }
```

#### 4. Add Missing Error Boundaries
**Create:** [frontend/src/components/ErrorBoundary.tsx](frontend/src/components/ErrorBoundary.tsx)
```typescript
import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto size-12 text-red-600 mb-4" />
            <h1 className="text-xl font-bold text-red-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-red-700">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-medium
                       hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Priority 2: Quick UI Improvements (4 hours)

#### 1. Add Loading States to All Pages
**Pattern:**
```typescript
if (!ready || !user) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="text-center">
        <div className="inline-flex size-12 items-center justify-center rounded-full 
                       bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse">
          <Sparkles className="size-6 text-white" />
        </div>
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
```

#### 2. Add Toast Notification System
**Create:** [frontend/src/components/Toast.tsx](frontend/src/components/Toast.tsx)
**Then integrate** into API error handling

#### 3. Improve Booking Status Display
**File:** [frontend/src/components/StatusBadge.tsx](frontend/src/components/StatusBadge.tsx)
**Add pulse animation and better icons:**
```typescript
const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', pulse: true },
  assigned: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100', pulse: true },
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', pulse: false },
  cancelled: { icon: X, color: 'text-red-600', bg: 'bg-red-100', pulse: false },
};
```

#### 4. Add Payment UI
**Create:** [frontend/src/components/PaymentModal.tsx](frontend/src/components/PaymentModal.tsx)
```typescript
export function PaymentModal({ booking, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  async function initiatePayment() {
    setLoading(true);
    try {
      const response = await apiFetch('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking._id })
      });
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: response.keyId,
          amount: response.amount,
          currency: 'INR',
          order_id: response.orderId,
          handler: (paymentResponse) => {
            // Payment successful
            onSuccess(paymentResponse);
          },
          prefill: {
            email: 'customer@example.com',
            contact: '9999999999',
          },
        };
        new (window as any).Razorpay(options).open();
      };
      document.body.appendChild(script);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
        <p className="text-sm font-medium text-indigo-900">
          Amount to Pay: ₹{booking.amount}
        </p>
        <p className="text-xs text-indigo-700 mt-2">
          Service: {booking.serviceRequired}
        </p>
      </div>
      
      <button
        onClick={initiatePayment}
        disabled={loading}
        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600
                 text-white rounded-lg font-semibold hover:shadow-lg
                 transition-all disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}
```

#### 5. Add Invoice Download Button
**Update:** [frontend/src/routes/customer.tsx](frontend/src/routes/customer.tsx)
```typescript
async function downloadInvoice(bookingId: string) {
  try {
    const blob = await apiFetchBlob(`/invoices/${bookingId}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${bookingId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    toast.error('Failed to download invoice');
  }
}

// In booking card:
{booking.status === 'completed' && (
  <button
    onClick={() => downloadInvoice(booking._id)}
    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
  >
    <Download className="size-4" />
    Invoice
  </button>
)}
```

---

## 📋 7-DAY IMPLEMENTATION ROADMAP

### Day 1: Foundation & Fixes
- [ ] Fix admin credentials
- [ ] Switch to Gemini AI
- [ ] Add error boundaries
- [ ] Improve loading states
- [ ] Add toast notifications

**Commit:** `refactor: critical bug fixes and foundation improvements`

### Day 2: Core Features
- [ ] Payment UI integration
- [ ] Invoice download functionality
- [ ] Booking cancellation endpoint + UI
- [ ] Enhanced status display
- [ ] Improve location handling

**Commit:** `feat: payment flow and booking management`

### Day 3: Worker Features
- [ ] Worker profile edit page
- [ ] Skill management UI
- [ ] Certificate/document upload
- [ ] Worker availability schedule
- [ ] Earnings tracking chart

**Commit:** `feat: worker profile management and earnings`

### Day 4: Admin Features
- [ ] Worker verification workflow UI
- [ ] Verification queue with document preview
- [ ] One-click verify/reject buttons
- [ ] Admin messaging system (basic)
- [ ] Better analytics dashboard

**Commit:** `feat: admin verification and analytics`

### Day 5: Design Polish
- [ ] Implement new color scheme (indigo/purple gradient)
- [ ] Add animations to all pages
- [ ] Design system components
- [ ] Dark mode support
- [ ] Mobile responsiveness refinement

**Commit:** `style: comprehensive design system implementation`

### Day 6: Advanced Features
- [ ] Rating and review system
- [ ] Search and filtering
- [ ] Favorites/bookmarks
- [ ] Offline fallback (service worker)
- [ ] Chat history persistence

**Commit:** `feat: advanced features and offline support`

### Day 7: Testing & Optimization
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Mobile device testing
- [ ] Accessibility audit
- [ ] Bug fixes and polish

**Commit:** `test: comprehensive testing and optimization`

---

## 🎯 SUCCESS METRICS FOR DEMO (SIH)

### Must Have (100%)
- [ ] Login/Register works for all roles
- [ ] Customer can book service via modal
- [ ] AI Sahayak natural language booking works
- [ ] Admin can verify workers
- [ ] Bookings show correct status
- [ ] Zero unhandled exceptions
- [ ] Responsive on mobile

### Should Have (90%)
- [ ] Payment flow works
- [ ] Invoice generation works
- [ ] Welfare status shows correctly
- [ ] Admin dashboard has all 3 tabs functional
- [ ] Beautiful UI with animations
- [ ] Bilingual support works

### Nice to Have (80%)
- [ ] Dark mode works
- [ ] Offline fallback functional
- [ ] Real-time updates
- [ ] Advanced search
- [ ] Rating system

---

## 🔧 KEY CONFIGURATION UPDATES

### .env file additions
```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password_here

# Razorpay
RAZORPAY_KEY_ID=your_key_here
RAZORPAY_KEY_SECRET=your_secret_here

# Database
MONGO_URI=mongodb://localhost/sewasathi

# JWT
JWT_SECRET=your_jwt_secret_here

# Optional: e-Shram API
ESHRAM_API_KEY=your_api_key
```

---

## 🚨 DEMO CHECKLIST

### Before Live Demo
- [ ] Test all 3 login flows (customer, worker, admin)
- [ ] Create test data: 5+ workers, 3+ bookings
- [ ] Test booking workflow end-to-end
- [ ] Test AI dispatch with sample requests
- [ ] Verify admin verification flow
- [ ] Test on mobile device
- [ ] Test with offline/slow network
- [ ] Verify payment order creation
- [ ] Test invoice generation
- [ ] Check all error messages
- [ ] Test language toggle
- [ ] Monitor console for errors
- [ ] Take screenshots of key flows
- [ ] Practice demo walkthrough

### During Demo
- Have fallback data ready (mock bookings)
- Keep browser devtools closed
- Use Chrome DevTools device emulation for mobile
- Have pre-loaded pages (no slow loads)
- Have backup internet connection
- Record screen for later review

---

## 📚 USEFUL COMMANDS

```bash
# Start dev environment
npm run dev:backend
npm run dev:frontend

# Run tests
npm run test

# Build for production
npm run build

# Format code
npm run format

# Lint code
npm run lint

# Database seeding
npm run seed

# Check dependencies
npm outdated

# Update dependencies
npm update
```

---

## 🎨 QUICK DESIGN TWEAKS

### Change Primary Color
**File:** [frontend/tailwind.config.js](frontend/tailwind.config.js)
```javascript
theme: {
  colors: {
    primary: '#6366F1',  // Indigo
    secondary: '#8B5CF6', // Purple
  }
}
```

### Add Animation
**File:** [frontend/styles.css](frontend/styles.css)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
```

### Dark Mode Toggle
**Add to provider:**
```typescript
const [darkMode, setDarkMode] = useState(() => 
  window.matchMedia('(prefers-color-scheme: dark)').matches
);

useEffect(() => {
  document.documentElement.classList.toggle('dark', darkMode);
}, [darkMode]);
```

---

## 🐛 COMMON ISSUES & FIXES

| Issue | Cause | Fix |
|-------|-------|-----|
| AI dispatch times out | Ollama not running | Switch to Gemini API |
| Payment not working | Razorpay key missing | Add keys to .env |
| Location not found | Permission denied | Improve UX, show fallback |
| Bookings don't show | Auth token invalid | Clear localStorage, re-login |
| Admin can't verify | Middleware issue | Check JWT token |
| Mobile layout broken | CSS not responsive | Add sm: md: lg: breakpoints |
| Slow page load | No lazy loading | Add React.lazy() and Suspense |

---

## 📞 SUPPORT CONTACTS

- Database issues: Check MongoDB connection string
- Frontend errors: Check browser console and network tab
- Backend errors: Check server logs for error messages
- AI issues: Check Gemini API quota and rate limits
- Payment issues: Check Razorpay sandbox credentials

---

This quick-start guide should get you to a demo-ready state in 7 days. Prioritize features based on your timeline and focus on stability over perfection!
