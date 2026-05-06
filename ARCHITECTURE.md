# Aeternum Atlas Architecture

## Stack

- Frontend: React + Vite + TypeScript configuration
- Styling: Tailwind CSS with premium design tokens
- Auth: local mock service prepared for JWT, Auth.js, Supabase or Firebase
- Data: mock repositories prepared for PostgreSQL/Supabase
- Payments: mock checkout layer prepared for Stripe or Mercado Pago
- Deploy: Vercel and Netlify configs included

## Structure

```txt
src/
  assets/
    logo/
    icons/
    anatomy-images/
  components/
    Button/
    Card/
    Header/
    Layout/
    Modal/
    ModelCard/
    ProtectedRoute/
    Sidebar/
    SubscriptionCard/
  data/
    mockCategories.js
    mockCourses.js
    mockModels.js
    mockPlans.js
    mockUsers.js
  pages/
    admin/
    dashboard/
    home/
    login/
    model-detail/
    models/
    profile/
    register/
    subscription/
    viewer/
    settings/
  services/
    authService.js
    modelService.js
    paymentService.js
    storage.js
    subscriptionService.js
  styles/
    globals.css
  utils/
    accessControl.js
    formatters.js
    validators.js
  i18n/
    pt.json
    es.json
    en.json
```

## Replacement Points

- `services/authService.js`: replace localStorage with JWT/Auth.js/Supabase/Firebase.
- `services/modelService.js`: replace mock repository with PostgreSQL/Supabase queries.
- `services/paymentService.js`: replace mock checkout with Stripe Checkout or Mercado Pago Preference.
- `utils/accessControl.js`: central place for role and subscription rules.
- `components/ProtectedRoute`: central private/admin route guard.
- `components/ModelViewer`: replace mock WebGL placeholder with Three.js scene, loaders and selection raycasting.
- `components/LeftInfoPanel`, `BottomSystemBar`, `RightToolbar`: viewer shell prepared for real anatomy layer controls.

## Demo Accounts

- Admin: `admin@aeternumatlas.com` / `admin1234`
- Student: `demo@aeternumatlas.com` / `student123`
