const STORAGE_KEYS = {
  users: "aa_users",
  session: "aa_session",
  progress: "aa_progress",
  models: "aa_models",
  categories: "aa_categories"
};

const IS_FILE_MODE = location.protocol === "file:";
const LOGO_SRC = IS_FILE_MODE ? "assets/logotipo-aeternum-atlas.png" : "/assets/logotipo-aeternum-atlas.png";

const roles = {
  user: "Usuário",
  admin: "Administrador",
  institution: "Instituição"
};

const defaultCategories = [
  "Cabeça e pescoço",
  "Tórax",
  "Abdome",
  "Pelve",
  "Membro superior",
  "Membro inferior",
  "Sistema nervoso",
  "Sistema cardiovascular",
  "Sistema respiratório",
  "Sistema digestório",
  "Sistema urinário",
  "Sistema reprodutor",
  "Sistema musculoesquelético"
];

const defaultAnatomyModels = [
  {
    id: "cranio-humano-3d",
    title: "Crânio Humano 3D",
    description: "Estruturas ósseas do neurocrânio e viscerocrânio com marcos anatômicos essenciais.",
    category: "Cabeça e pescoço",
    level: "Básico",
    sketchfab_url: "https://sketchfab.com/3d-models/human-skull-anatomy-demo/embed",
    is_premium: false,
    is_active: true
  },
  {
    id: "coracao-humano-realista",
    title: "Coração Humano Realista",
    description: "Camadas, valvas, grandes vasos e relações clínicas do sistema cardiovascular.",
    category: "Sistema cardiovascular",
    level: "Intermediário",
    sketchfab_url: "https://sketchfab.com/3d-models/heart-anatomy-demo/embed",
    is_premium: true,
    is_active: true
  },
  {
    id: "torax-caixa-toracica",
    title: "Tórax e Caixa Torácica",
    description: "Arcabouço torácico, relações pleuropulmonares e referências de superfície.",
    category: "Tórax",
    level: "Intermediário",
    sketchfab_url: "https://sketchfab.com/3d-models/thorax-demo/embed",
    is_premium: true,
    is_active: true
  },
  {
    id: "sistema-digestorio-completo",
    title: "Sistema Digestório Completo",
    description: "Visão integrada de tubo digestivo, glândulas anexas e vascularização associada.",
    category: "Abdome",
    level: "Avançado",
    sketchfab_url: "https://sketchfab.com/3d-models/digestive-system-demo/embed",
    is_premium: true,
    is_active: true
  },
  {
    id: "membro-superior-ossos-musculos",
    title: "Membro Superior - Ossos e Músculos",
    description: "Cintura escapular, braço, antebraço e mão com organização muscular funcional.",
    category: "Membro superior",
    level: "Intermediário",
    sketchfab_url: "https://sketchfab.com/3d-models/upper-limb-demo/embed",
    is_premium: true,
    is_active: true
  }
];

const courses = [
  { title: "Anatomia topográfica aplicada", kind: "Curso", premium: true },
  { title: "Radiologia do tórax", kind: "Radiologia", premium: true },
  { title: "Introdução ao estudo 3D", kind: "Vídeo", premium: false }
];

const databaseSchema = {
  users: ["id", "name", "email", "password_hash", "password_salt", "user_type", "institution", "country", "role", "subscription_status", "subscription_plan", "subscription_started_at", "subscription_renews_at", "payment_provider", "trial_started_at", "trial_ends_at", "created_at"],
  anatomy_models: ["id", "title", "description", "category", "level", "cover_image_url", "sketchfab_url", "is_premium", "is_active", "clinical_notes", "learning_objectives", "access_count", "created_at"],
  user_progress: ["id", "user_id", "model_id", "progress_status", "completed_at", "favorite"],
  subscriptions: ["id", "user_id", "plan_name", "status", "start_date", "end_date", "payment_provider"],
  courses: ["id", "title", "description", "cover_image_url", "video_url", "is_premium", "created_at"]
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 3;
const VALID_SUBSCRIPTION_STATES = ["trial", "active", "expired", "cancelled"];
const subscriptionPlans = [
  {
    id: "student-monthly",
    name: "Plano Estudante Mensal",
    price: "R$ 50/mês",
    cycle: "monthly",
    cta: "Assinar agora",
    checkout: true,
    recommended: false,
    benefits: [
      "Acesso aos modelos 3D premium",
      "Atlas anatômico",
      "Radiologia básica",
      "Vídeos educacionais",
      "Progresso de estudo",
      "Favoritos"
    ]
  },
  {
    id: "student-annual",
    name: "Plano Estudante Anual",
    price: "R$ 480/ano",
    cycle: "annual",
    cta: "Assinar agora",
    checkout: true,
    recommended: true,
    benefits: [
      "Todos os benefícios do plano mensal",
      "Economia de 20%",
      "Acesso prioritário a novos conteúdos"
    ]
  },
  {
    id: "teacher",
    name: "Plano Professor",
    price: "Sob consulta",
    cycle: "consult",
    cta: "Falar com consultor",
    checkout: false,
    recommended: false,
    benefits: [
      "Acesso completo",
      "Recursos para aula",
      "Organização de conteúdos",
      "Suporte institucional"
    ]
  },
  {
    id: "institutional",
    name: "Plano Institucional",
    price: "Sob consulta",
    cycle: "consult",
    cta: "Falar com consultor",
    checkout: false,
    recommended: false,
    benefits: [
      "Múltiplos usuários",
      "Painel institucional",
      "Relatórios de uso",
      "Licenciamento para universidades"
    ]
  }
];
const seededCredentials = {
  "demo@aeternumatlas.com": {
    salt: "seed-demo-salt",
    hash: "bf647766e18378010ab284035498bf4871ad6c316d22a506ff42cbbfc9a670c3"
  },
  "admin@aeternumatlas.com": {
    salt: "seed-admin-salt",
    hash: "d0905a176e3397648b17c7ad3966b0f74a3bc3b44deb88857280ad33ff25c5e8"
  }
};

const app = document.querySelector("#app");
const modalRoot = document.querySelector("#modal-root");
let modelFilters = { search: "", category: "Todas", level: "Todos" };
let adminEditingModelId = null;

function icon(name) {
  const icons = {
    cube: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2 3.5 6.6v10.8L12 22l8.5-4.6V6.6L12 2Z"/><path d="m12 12 8.5-5.4M12 12 3.5 6.6M12 12v10"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 0 4 19.5v-15Z"/></svg>',
    scan: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2"/><path d="M8 12h8M12 8v8"/></svg>',
    video: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 10 4.5-2.7v9.4L15 14"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    help: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 0 1 5 1.1c0 1.9-2.5 2-2.5 3.9"/><path d="M12 17h.01"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    shield: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'
  };
  return icons[name] || icons.cube;
}

function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function normalizeEmail(value) {
  return sanitizeText(value).toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(value) {
  return sanitizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || safeId();
}

function createTrialEndDate(start = new Date()) {
  return new Date(start.getTime() + TRIAL_DAYS * DAY_MS).toISOString();
}

function normalizeModel(model) {
  return {
    id: model.id || slugify(model.title),
    title: sanitizeText(model.title),
    description: sanitizeText(model.description),
    category: sanitizeText(model.category) || "Cabeça e pescoço",
    level: sanitizeText(model.level) || "Básico",
    cover_image_url: sanitizeText(model.cover_image_url),
    sketchfab_url: sanitizeText(model.sketchfab_url),
    is_premium: Boolean(model.is_premium),
    is_active: model.is_active !== false,
    clinical_notes: sanitizeText(model.clinical_notes) || "Correlação clínica preparada para revisão guiada.",
    learning_objectives: sanitizeText(model.learning_objectives) || "Identificar estruturas principais; reconhecer relações anatômicas; aplicar o conteúdo a casos clínicos.",
    access_count: Number(model.access_count || 0),
    created_at: model.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function getModels() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.models) || "null");
  if (saved) return saved.map(normalizeModel);
  const models = defaultAnatomyModels.map((model, index) => normalizeModel({ ...model, access_count: [184, 132, 98, 74, 64][index] || 0 }));
  saveModels(models);
  return models;
}

function saveModels(models) {
  localStorage.setItem(STORAGE_KEYS.models, JSON.stringify(models.map(normalizeModel)));
}

function uniqueModelId(title, models) {
  const base = slugify(title);
  let candidate = base;
  let count = 2;
  while (models.some(model => model.id === candidate)) {
    candidate = `${base}-${count}`;
    count += 1;
  }
  return candidate;
}

function getCategories() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.categories) || "null");
  if (saved) return saved.map(sanitizeText).filter(Boolean);
  saveCategories(defaultCategories);
  return [...defaultCategories];
}

function saveCategories(items) {
  const unique = [...new Set(items.map(sanitizeText).filter(Boolean))];
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(unique));
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function getPlanById(planId) {
  return subscriptionPlans.find(plan => plan.id === planId);
}

function renewalDateForPlan(plan, start = new Date()) {
  const date = new Date(start);
  if (plan?.cycle === "annual") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

function createCheckoutSession(planId, user = getSession()) {
  const plan = getPlanById(planId);
  if (!plan || !user) return null;
  return {
    id: safeId(),
    provider: "mock-gateway",
    gateway_ready: ["stripe", "mercado_pago", "custom"].join(","),
    user_id: user.id,
    plan_id: plan.id,
    plan_name: plan.name,
    amount_label: plan.price,
    created_at: new Date().toISOString()
  };
}

function updateSubscriptionStatus(userId, status, planName, options = {}) {
  const users = getUsers();
  const index = users.findIndex(user => user.id === userId);
  if (index < 0) return null;
  users[index] = {
    ...users[index],
    subscription_status: status,
    subscription_plan: planName || users[index].subscription_plan,
    subscription_started_at: options.started_at ?? users[index].subscription_started_at,
    subscription_renews_at: options.renews_at ?? users[index].subscription_renews_at,
    payment_provider: options.payment_provider ?? users[index].payment_provider ?? "mock-gateway"
  };
  saveUsers(users);
  return users[index];
}

function cancelSubscription(userId = getSession()?.id) {
  const user = getUsers().find(item => item.id === userId);
  if (!user) return null;
  return updateSubscriptionStatus(userId, "cancelled", user.subscription_plan, {
    started_at: user.subscription_started_at,
    renews_at: user.subscription_renews_at,
    payment_provider: user.payment_provider || "mock-gateway"
  });
}

function createSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value) {
  if (!crypto.subtle) {
    throw new Error("Hash seguro indisponível neste navegador.");
  }
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt = createSalt()) {
  return {
    password_salt: salt,
    password_hash: await sha256Hex(`${salt}:${password}`)
  };
}

async function verifyPassword(password, user) {
  if (!user?.password_salt || !user?.password_hash) return false;
  const candidate = await sha256Hex(`${user.password_salt}:${password}`);
  return candidate === user.password_hash;
}

function sanitizeUserRecord(user) {
  const source = user || {};
  const { password, confirm, terms, ...cleanUser } = source;
  const status = VALID_SUBSCRIPTION_STATES.includes(source.subscription_status) ? source.subscription_status : "expired";
  return {
    ...cleanUser,
    name: sanitizeText(source.name),
    email: normalizeEmail(source.email),
    user_type: sanitizeText(source.user_type),
    institution: sanitizeText(source.institution),
    country: sanitizeText(source.country),
    role: ["user", "admin", "institution"].includes(source.role) ? source.role : "user",
    subscription_status: status,
    subscription_plan: sanitizeText(source.subscription_plan),
    payment_provider: sanitizeText(source.payment_provider),
    created_at: source.created_at || new Date().toISOString()
  };
}

function resolveSubscriptionStatus(user, persist = true) {
  if (!user) return null;
  let nextStatus = user.subscription_status;
  if (nextStatus === "trial" && user.trial_ends_at && new Date(user.trial_ends_at).getTime() <= Date.now()) {
    nextStatus = "expired";
  }
  if (nextStatus !== user.subscription_status && persist) {
    const users = getUsers();
    const index = users.findIndex(item => item.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], subscription_status: nextStatus };
      saveUsers(users);
    }
  }
  return nextStatus;
}

function subscriptionNotice(status) {
  if (status === "active") return "Assinatura ativa.";
  if (status === "trial") return "Conta em período gratuito.";
  if (status === "expired") return "Seu período gratuito expirou.";
  if (status === "cancelled") return "Assinatura cancelada.";
  return "Acesso gratuito.";
}

function getUsers() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "null");
  if (saved) return saved;
  const now = new Date();
  const initial = [
    {
      id: "u-demo",
      name: "Marina Oliveira",
      email: "demo@aeternumatlas.com",
      password_salt: seededCredentials["demo@aeternumatlas.com"].salt,
      password_hash: seededCredentials["demo@aeternumatlas.com"].hash,
      user_type: "Estudante",
      institution: "Universidade Aeternum",
      country: "Brasil",
      role: "user",
      subscription_status: "trial",
      subscription_plan: "Prova gratuita",
      trial_started_at: now.toISOString(),
      trial_ends_at: createTrialEndDate(now),
      created_at: now.toISOString()
    },
    {
      id: "u-admin",
      name: "Admin Aeternum",
      email: "admin@aeternumatlas.com",
      password_salt: seededCredentials["admin@aeternumatlas.com"].salt,
      password_hash: seededCredentials["admin@aeternumatlas.com"].hash,
      user_type: "Instituição",
      institution: "Aeternum Atlas",
      country: "Brasil",
      role: "admin",
      subscription_status: "active",
      subscription_plan: "Institucional",
      subscription_started_at: now.toISOString(),
      subscription_renews_at: renewalDateForPlan({ cycle: "annual" }, now),
      payment_provider: "mock-gateway",
      trial_started_at: null,
      trial_ends_at: null,
      created_at: now.toISOString()
    }
  ];
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(initial));
  return initial;
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users.map(sanitizeUserRecord)));
}

async function migrateLegacyUsers() {
  const users = getUsers();
  let changed = false;
  const migrated = [];
  for (const rawUser of users) {
    const user = sanitizeUserRecord(rawUser);
    const seeded = seededCredentials[user.email];
    const looksHashed = /^[a-f0-9]{64}$/i.test(user.password_hash || "");

    if (!user.password_salt || !looksHashed) {
      const legacyPassword = seeded ? null : rawUser.password_hash;
      const secure = seeded
        ? { password_salt: seeded.salt, password_hash: seeded.hash }
        : await hashPassword(String(legacyPassword || ""));
      user.password_salt = secure.password_salt;
      user.password_hash = secure.password_hash;
      changed = true;
    }

    if (!VALID_SUBSCRIPTION_STATES.includes(user.subscription_status)) {
      user.subscription_status = "expired";
      changed = true;
    }

    if (user.subscription_status === "trial" && !user.trial_ends_at) {
      const startedAt = user.trial_started_at ? new Date(user.trial_started_at) : new Date(user.created_at || Date.now());
      user.trial_started_at = startedAt.toISOString();
      user.trial_ends_at = createTrialEndDate(startedAt);
      changed = true;
    }

    if (user.subscription_status === "trial" && new Date(user.trial_ends_at).getTime() <= Date.now()) {
      user.subscription_status = "expired";
      changed = true;
    }

    if (user.subscription_status === "active" && !user.subscription_renews_at) {
      const startedAt = user.subscription_started_at ? new Date(user.subscription_started_at) : new Date();
      user.subscription_started_at = startedAt.toISOString();
      user.subscription_renews_at = renewalDateForPlan({ cycle: "monthly" }, startedAt);
      user.payment_provider = user.payment_provider || "mock-gateway";
      changed = true;
    }

    migrated.push(user);
  }

  if (changed) saveUsers(migrated);
}

function getSession() {
  const id = localStorage.getItem(STORAGE_KEYS.session);
  const user = getUsers().find(item => item.id === id);
  if (!user) return null;
  const status = resolveSubscriptionStatus(user);
  return { ...user, subscription_status: status };
}

function setSession(userId) {
  localStorage.setItem(STORAGE_KEYS.session, userId);
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.session);
  navigate("/");
}

function hasPremium(user = getSession()) {
  const status = resolveSubscriptionStatus(user);
  return status === "active" || status === "trial";
}

function navigate(path) {
  if (IS_FILE_MODE) {
    history.pushState({}, "", `#${path}`);
  } else {
    history.pushState({}, "", path);
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function requireAuth() {
  const user = getSession();
  if (!user) {
    navigate("/login");
    return null;
  }
  return user;
}

function requireAdmin() {
  const user = requireAuth();
  if (!user) return null;
  if (user.role !== "admin") {
    toast("Acesso administrativo restrito.");
    navigate("/dashboard");
    return null;
  }
  return user;
}

function page(path = location.pathname) {
  if (IS_FILE_MODE) {
    return (location.hash.replace(/^#/, "") || "/").replace(/\/$/, "") || "/";
  }
  return path.replace(/\/$/, "") || "/";
}

function publicHeader() {
  return `
    <header class="public-header">
      <div class="container header-inner">
        <div class="header-left">
          <a class="brand" href="/" data-link>
            <img src="${LOGO_SRC}" alt="Aeternum Atlas">
            <span class="brand-name"><strong>Aeternum Atlas</strong><span>Biblioteca Anatômica 3D</span></span>
          </a>
          <div class="header-tools" aria-label="Ferramentas rápidas">
            <button class="icon-btn" type="button" aria-label="Buscar">${icon("search")}</button>
            <button class="icon-btn" type="button" aria-label="Notificações">${icon("bell")}</button>
            <button class="icon-btn" type="button" aria-label="Ajuda">${icon("help")}</button>
          </div>
        </div>
        <nav class="nav-actions" aria-label="Acesso">
          <a class="btn btn-outline btn-uppercase" href="/login" data-link>Iniciar sessão</a>
          <a class="btn btn-teal btn-uppercase" href="/register" data-link>Registrar-se</a>
        </nav>
      </div>
    </header>
  `;
}

function renderHome() {
  app.innerHTML = `
    <div class="app home-app">
      ${publicHeader()}
      <main>
        <section class="hero home-hero">
          <div class="container hero-center">
            <div class="eyebrow">Medical Technology & 3D Anatomy Platform</div>
            <h1>Aeternum Atlas</h1>
            <div class="subtitle">Biblioteca Anatômica 3D</div>
            <p class="home-tagline">O corpo humano, eternizado em conhecimento.</p>
            <div class="trial-banner trial-card">
              <div>
                <strong>Comece sua prova gratuita de 3 dias</strong>
                <span>Crie sua conta e explore modelos anatômicos 3D ultra realistas.</span>
              </div>
              <a class="btn btn-teal btn-uppercase" href="/register" data-link>Probar gratis</a>
            </div>
          </div>
        </section>
        <section class="module-section content-section">
          <div class="container">
            <div class="section-head">
              <div>
                <h2>Conteúdos anatômicos</h2>
                <p>Uma biblioteca visual para explorar, comparar e revisar anatomia humana com profundidade.</p>
              </div>
              <span class="lock-chip">${icon("lock")} Conteúdos bloqueados para visitantes</span>
            </div>
            <div class="content-grid">
              ${homeModule("Modelos 3D", "Explore estruturas humanas em três dimensões.", "cube", true, false)}
              ${homeModule("Atlas", "Mapas anatômicos por sistema e região.", "book", false, true)}
              ${homeModule("Radiologia", "Anatomia seccional e correlações clínicas.", "scan", false, true)}
              ${homeModule("Vídeos", "Aulas visuais para revisão guiada.", "video", false, true)}
              ${homeModule("Conteúdo", "Notas, resumos e materiais complementares.", "shield", false, true)}
              ${homeModule("Cursos", "Trilhas para estudantes e docentes.", "book", false, true)}
            </div>
          </div>
        </section>
      </main>
      <footer class="public-footer">Aeternum Atlas © 2026 — Medical Technology & 3D Anatomy Platform</footer>
    </div>
  `;
}

function homeModule(title, text, iconName, featured = false, premium = true) {
  return `
    <article class="content-card ${featured ? "featured" : ""}">
      <img src="${LOGO_SRC}" alt="" loading="lazy">
      <div class="content-card-overlay"></div>
      <div class="content-card-body">
        <div class="module-icon">${icon(iconName)}</div>
        ${premium ? `<span class="premium-lock" aria-label="Conteúdo premium">${icon("lock")}</span>` : ""}
        <h3>${title}</h3>
        <p>${text}</p>
      </div>
    </article>
  `;
}

function renderAuth(type) {
  const isRegister = type === "register";
  app.innerHTML = `
    <main class="auth-page">
      <section class="auth-card ${isRegister ? "wide" : ""}">
        <a class="brand" href="/" data-link>
          <span class="brand-mark">AA</span>
          <span class="brand-name"><strong>Aeternum Atlas</strong><span>Biblioteca Anatômica 3D</span></span>
        </a>
        <div style="margin-top: 24px">
          <div class="eyebrow">${isRegister ? "Nova conta" : "Acesso seguro"}</div>
          <h1>${isRegister ? "Criar conta" : "Iniciar sessão"}</h1>
          <p class="lead">${isRegister ? "Ative sua prova gratuita e prepare seu acesso aos módulos premium." : "Entre para continuar seus estudos anatômicos."}</p>
        </div>
        <form id="${isRegister ? "registerForm" : "loginForm"}" novalidate>
          ${isRegister ? registerFields() : loginFields()}
          <div class="form-error" id="formError" role="alert"></div>
          <button class="btn btn-primary btn-full" type="submit">${isRegister ? "Criar conta" : "Entrar"}</button>
        </form>
        <div class="row-actions" style="margin-top: 18px">
          ${isRegister
            ? '<a class="btn btn-ghost btn-full" href="/login" data-link>Ja tenho conta</a>'
            : '<a class="btn btn-ghost" href="/register" data-link>Criar nova conta</a><button class="btn btn-ghost" data-forgot>Esqueci minha senha</button>'}
        </div>
      </section>
    </main>
  `;
  if (isRegister) attachRegister();
  else attachLogin();
}

function registerFields() {
  return `
    <div class="form-grid">
      ${field("name", "Nome completo")}
      ${field("email", "E-mail", "email")}
      ${field("password", "Senha", "password")}
      ${field("confirm", "Confirmar senha", "password")}
      <label class="field">
        <span>Tipo de usuário</span>
        <select name="user_type" required>
          <option value="">Selecione</option>
          <option>Estudante</option>
          <option>Professor</option>
          <option>Profissional da saúde</option>
          <option>Instituição</option>
        </select>
        <small></small>
      </label>
      ${field("institution", "Universidade ou instituição")}
      ${field("country", "País")}
      <label class="checkbox-line field full">
        <input name="terms" type="checkbox" required>
        <span>Aceito os termos de uso e a política de privacidade.</span>
      </label>
    </div>
  `;
}

function loginFields() {
  return `
    ${field("email", "E-mail", "email")}
    ${field("password", "Senha", "password")}
    <p style="color: var(--muted); font-size: .9rem">Demo: demo@aeternumatlas.com / demo12345. Admin: admin@aeternumatlas.com / admin12345.</p>
  `;
}

function field(name, label, type = "text") {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="${type}" required>
      <small></small>
    </label>
  `;
}

function attachLogin() {
  document.querySelector("#loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const email = normalizeEmail(data.email);
    const password = String(data.password || "");
    const user = getUsers().find(item => normalizeEmail(item.email) === email);
    const validPassword = user ? await verifyPassword(password, user) : false;
    if (!user || !validPassword) {
      setFormError("E-mail ou senha inválidos.");
      return;
    }
    setSession(user.id);
    const status = resolveSubscriptionStatus(user);
    toast(status === "expired" ? "Seu período gratuito expirou." : subscriptionNotice(status));
    navigate("/dashboard");
  });
}

function attachRegister() {
  document.querySelector("#registerForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const name = sanitizeText(data.name);
    const email = normalizeEmail(data.email);
    const password = String(data.password || "");
    const confirm = String(data.confirm || "");
    const userType = sanitizeText(data.user_type);
    const institution = sanitizeText(data.institution);
    const country = sanitizeText(data.country);
    const errors = [];
    if (!name) errors.push("Nome completo é obrigatório.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Informe um e-mail válido.");
    if (password.length < 8) errors.push("A senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirm) errors.push("A confirmação de senha precisa ser igual à senha.");
    if (!userType) errors.push("Tipo de usuário é obrigatório.");
    if (!data.terms) errors.push("Aceite os termos de uso e a política de privacidade.");
    if (getUsers().some(user => normalizeEmail(user.email) === email)) errors.push("Já existe uma conta com este e-mail.");
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }
    const users = getUsers();
    const now = new Date();
    const securePassword = await hashPassword(password);
    const user = {
      id: safeId(),
      name,
      email,
      ...securePassword,
      user_type: userType,
      institution,
      country,
      role: userType === "Instituição" ? "institution" : "user",
      subscription_status: "trial",
      subscription_plan: "Prova gratuita",
      trial_started_at: now.toISOString(),
      trial_ends_at: createTrialEndDate(now),
      created_at: now.toISOString()
    };
    users.push(user);
    saveUsers(users);
    setSession(user.id);
    toast("Conta criada com sucesso.");
    navigate("/dashboard");
  });
}

function setFormError(message) {
  document.querySelector("#formError").textContent = message;
}

function shell(content, activePath = page()) {
  const user = requireAuth();
  if (!user) return;
  const status = resolveSubscriptionStatus(user);
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <a class="brand" href="/dashboard" data-link>
          <img src="${LOGO_SRC}" alt="Aeternum Atlas">
          <span class="brand-name"><strong>Aeternum Atlas</strong><span>${roles[user.role] || "Usuário"}</span></span>
        </a>
        <nav class="sidebar-nav">
          ${navLink("/dashboard", "Inicio", "shield", activePath)}
          ${navLink("/models", "Modelos 3D", "cube", activePath)}
          ${navLink("/atlas", "Atlas Anatômico", "book", activePath)}
          ${navLink("/radiology", "Radiologia", "scan", activePath)}
          ${navLink("/videos", "Vídeos", "video", activePath)}
          ${navLink("/courses", "Cursos", "book", activePath)}
          ${navLink("/subscription", "Minha assinatura", "shield", activePath)}
          ${navLink("/profile", "Perfil", "user", activePath)}
          ${user.role === "admin" ? navLink("/admin", "Admin", "shield", activePath) : ""}
        </nav>
        <div class="sidebar-footer">
          <button class="btn btn-ghost btn-full" data-logout>Sair</button>
        </div>
      </aside>
      <section class="main-area">
        <header class="topbar">
          <button class="btn btn-ghost mobile-menu" data-menu>${icon("menu")} Menu</button>
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <div style="color: var(--muted); font-size: .9rem">${escapeHtml(user.subscription_plan)} - ${subscriptionLabel(status)}</div>
          </div>
          <input class="search-input" style="max-width: 320px" placeholder="Buscar conteúdo anatômico">
        </header>
        <main class="content">${content}</main>
      </section>
    </div>
  `;
}

function navLink(href, label, iconName, activePath) {
  return `<a class="nav-link ${activePath === href ? "active" : ""}" href="${href}" data-link>${icon(iconName)} ${label}</a>`;
}

function subscriptionLabel(status) {
  if (status === "active") return "Assinatura ativa.";
  if (status === "trial") return "Teste gratuito.";
  if (status === "expired") return "Seu período gratuito expirou.";
  if (status === "cancelled") return "Assinatura cancelada.";
  return "Sem assinatura.";
}

function statusClass(status) {
  if (["trial", "active", "expired", "cancelled", "premium", "free", "blocked"].includes(status)) {
    return status;
  }
  return "blocked";
}

function trialDaysRemaining(user) {
  if (!user?.trial_ends_at || resolveSubscriptionStatus(user, false) !== "trial") return 0;
  return Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / DAY_MS));
}

function renderDashboard() {
  const user = requireAuth();
  if (!user) return;
  const status = resolveSubscriptionStatus(user);
  const days = trialDaysRemaining(user);
  const models = getModels();
  const categories = getCategories();
  const content = `
    <div class="page-title">
      <div>
        <div class="eyebrow">Dashboard</div>
        <h1>Inicio</h1>
        <p>Continue sua rotina de estudo com modelos, cursos e recomendacoes.</p>
      </div>
      <a class="btn btn-primary" href="/models" data-link>Abrir modelos 3D</a>
    </div>
    <section class="panel" style="margin-bottom: 18px">
      <h3>${subscriptionLabel(status)}</h3>
      <p>${status === "trial" ? `Você tem ${days} dia${days === 1 ? "" : "s"} de acesso premium temporário.` : subscriptionNotice(status)}</p>
    </section>
    <div class="grid cols-4">
      ${metric(models.filter(model => model.is_active).length, "Modelos ativos", "cube")}
      ${metric(status === "trial" ? `${days} dias` : subscriptionLabel(status).replace(".", ""), "Status da assinatura", "shield")}
      ${metric("12", "Categorias anatômicas", "book")}
      ${metric("Premium", "Plano atual", "user")}
    </div>
    <div class="grid cols-2" style="margin-top: 18px">
      <section class="panel">
        <h3>Continuar estudando</h3>
        <p>Crânio Humano 3D - estrutura óssea e referências clínicas básicas.</p>
        <button class="btn btn-teal" data-open-model="cranio-humano-3d">Retomar estudo</button>
      </section>
      <section class="panel">
        <h3>Ultimos modelos acessados</h3>
        ${models.slice(0, 3).map(model => `<p>${escapeHtml(model.title)} <span class="status-chip ${model.is_premium ? "premium" : "free"}">${model.is_premium ? "Premium" : "Gratuito"}</span></p>`).join("")}
      </section>
      <section class="panel">
        <h3>Categorias anatômicas</h3>
        <div class="card-row">${categories.slice(0, 8).map(item => `<span class="level-chip">${item}</span>`).join("")}</div>
      </section>
      <section class="panel">
        <h3>Conteúdos recomendados</h3>
        ${courses.map(item => `<p>${item.kind}: ${item.title}</p>`).join("")}
      </section>
    </div>
  `;
  shell(content, "/dashboard");
}

function metric(value, label, iconName) {
  return `
    <article class="card metric">
      <div><strong>${value}</strong><span style="color: var(--muted)">${label}</span></div>
      <div class="stat-icon">${icon(iconName)}</div>
    </article>
  `;
}

function renderModels() {
  const user = requireAuth();
  if (!user) return;
  const list = filteredModels();
  const categories = getCategories();
  shell(`
    <div class="page-title">
      <div>
        <div class="eyebrow">Biblioteca 3D</div>
        <h1>Modelos 3D</h1>
        <p>Explore anatomia por regiao, sistema e nivel de complexidade.</p>
      </div>
    </div>
    <div class="filters">
      <input class="search-input" id="modelSearch" placeholder="Buscar modelo" value="${modelFilters.search}">
      <select class="search-input" id="categoryFilter">
        <option>Todas</option>
        ${categories.map(item => `<option ${item === modelFilters.category ? "selected" : ""}>${item}</option>`).join("")}
      </select>
      <select class="search-input" id="levelFilter">
        ${["Todos", "Básico", "Intermediário", "Avançado"].map(item => `<option ${item === modelFilters.level ? "selected" : ""}>${item}</option>`).join("")}
      </select>
    </div>
    <div class="grid cols-3">
      ${list.map(modelCard).join("")}
    </div>
  `, "/models");
  attachModelFilters();
}

function filteredModels() {
  return getModels().filter(model => {
    const text = `${model.title} ${model.description}`.toLowerCase();
    const matchesSearch = text.includes(modelFilters.search.toLowerCase());
    const matchesCategory = modelFilters.category === "Todas" || model.category === modelFilters.category;
    const matchesLevel = modelFilters.level === "Todos" || model.level === modelFilters.level;
    return model.is_active && matchesSearch && matchesCategory && matchesLevel;
  });
}

function modelCard(model) {
  const locked = model.is_premium && !hasPremium();
  const coverUrl = sanitizeText(model.cover_image_url).replace(/['")\\]/g, "");
  const coverStyle = coverUrl ? ` style="background-image: linear-gradient(135deg, rgba(47, 184, 181, 0.22), rgba(10, 10, 10, 0.74)), url('${escapeHtml(coverUrl)}'); background-size: cover; background-position: center;"` : "";
  return `
    <article class="card model-card">
      <div class="cover"${coverStyle}></div>
      <div class="card-row">
        <span class="level-chip">${escapeHtml(model.level)}</span>
        <span class="status-chip ${locked ? "blocked" : model.is_premium ? "premium" : "free"}">${locked ? "Bloqueado" : model.is_premium ? "Premium" : "Gratuito"}</span>
      </div>
      <h3>${escapeHtml(model.title)}</h3>
      <p>${escapeHtml(model.description)}</p>
      <button class="btn ${locked ? "btn-ghost" : "btn-teal"}" data-open-model="${escapeHtml(model.id)}">${locked ? icon("lock") + " Assinar para abrir" : "Abrir modelo 3D"}</button>
    </article>
  `;
}

function attachModelFilters() {
  const search = document.querySelector("#modelSearch");
  const category = document.querySelector("#categoryFilter");
  const level = document.querySelector("#levelFilter");
  search.addEventListener("input", event => {
    modelFilters.search = event.target.value;
    renderModels();
  });
  category.addEventListener("change", event => {
    modelFilters.category = event.target.value;
    renderModels();
  });
  level.addEventListener("change", event => {
    modelFilters.level = event.target.value;
    renderModels();
  });
}

function openModel(id) {
  const model = getModels().find(item => item.id === id);
  if (!model) return;
  if (!model.is_premium || hasPremium()) {
    saveModels(getModels().map(item => item.id === id ? { ...item, access_count: Number(item.access_count || 0) + 1 } : item));
  }
  navigate(`/models/${model.id}`);
}

function renderModelDetail(id) {
  const user = requireAuth();
  if (!user) return;
  const model = getModels().find(item => item.id === id);
  if (!model) {
    renderNotFound();
    return;
  }
  const canAccess = !model.is_premium || hasPremium(user);
  const statusText = model.is_premium ? "Premium" : "Gratuito";
  shell(`
    <div class="model-detail-header">
      <a class="btn btn-ghost" href="/models" data-link>Voltar</a>
      <div>
        <h1>${escapeHtml(model.title)}</h1>
        <p>${escapeHtml(model.category)}</p>
      </div>
      <span class="status-chip ${model.is_premium ? "premium" : "free"}">${statusText}</span>
    </div>

    <div class="model-study-grid">
      <section>
        <div class="model-viewer-card">
          ${canAccess ? modelViewerFrame(model) : lockedViewerCard()}
        </div>
      </section>

      <aside class="model-info-panel">
        <div class="eyebrow">Modelo anatômico</div>
        <h2>${escapeHtml(model.title)}</h2>
        <div class="card-row">
          <span class="level-chip">${escapeHtml(model.category)}</span>
          <span class="level-chip">${escapeHtml(model.level)}</span>
          <span class="status-chip ${model.is_premium ? "premium" : "free"}">${statusText}</span>
        </div>
        <p>${escapeHtml(model.description)}</p>
        <h3>Objetivos de aprendizagem</h3>
        <ul class="list compact-list">
          ${learningObjectiveItems(model)}
        </ul>
        <h3>Observações clínicas</h3>
        <p>${escapeHtml(model.clinical_notes)}</p>
        <div class="row-actions">
          <button class="btn btn-ghost" data-favorite>Favoritar</button>
          <button class="btn btn-teal" data-complete ${canAccess ? "" : "disabled"}>Concluir estudo</button>
        </div>
      </aside>
    </div>

    <section class="study-tabs-panel">
      <div class="study-tabs" role="tablist" aria-label="Conteúdo do estudo">
        ${studyTabButton("overview", "Visão geral", true)}
        ${studyTabButton("anatomy", "Anatomia")}
        ${studyTabButton("clinical", "Correlações clínicas")}
        ${studyTabButton("quiz", "Quiz rápido")}
        ${studyTabButton("references", "Referências")}
      </div>
      <div class="tab-panel active" data-tab-panel="overview">
        <h3>Visão geral</h3>
        <p>${escapeHtml(model.description)} O módulo destaca relações espaciais, referências topográficas e nomenclatura aplicada.</p>
      </div>
      <div class="tab-panel" data-tab-panel="anatomy">
        <h3>Anatomia</h3>
        <p>Categoria: ${escapeHtml(model.category)}. Nível: ${escapeHtml(model.level)}. Revise estruturas, planos, relações e nomenclatura antes de avançar para correlações clínicas.</p>
      </div>
      <div class="tab-panel" data-tab-panel="clinical">
        <h3>Correlações clínicas</h3>
        <p>${escapeHtml(model.clinical_notes)}</p>
      </div>
      <div class="tab-panel" data-tab-panel="quiz">
        <h3>Quiz rápido</h3>
        <p>1. Identifique três estruturas-chave deste modelo. 2. Descreva uma relação anatômica relevante. 3. Cite uma aplicação clínica.</p>
      </div>
      <div class="tab-panel" data-tab-panel="references">
        <h3>Referências</h3>
        <p>Gray's Anatomy, Terminologia Anatomica, atlas anatômicos institucionais e materiais docentes validados.</p>
      </div>
    </section>

    <section class="panel" style="margin-top: 18px">
      <h3>Link externo / iframe Sketchfab</h3>
      <p>${escapeHtml(model.sketchfab_url)}</p>
    </section>
  `, "/models");
}

function modelViewerFrame(model) {
  const src = sketchfabEmbedSource(model.sketchfab_url);
  if (!src) {
    return `<iframe title="${escapeHtml(model.title)}" srcdoc="${viewerSrcDoc(model)}"></iframe>`;
  }
  return `<iframe title="${escapeHtml(model.title)}" src="${escapeHtml(src)}" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe>`;
}

function lockedViewerCard() {
  return `
    <div class="locked-viewer">
      <div class="locked-icon">${icon("lock")}</div>
      <h3>Modelo premium bloqueado</h3>
      <p>Este modelo faz parte da biblioteca premium Aeternum Atlas.</p>
      <a class="btn btn-teal" href="/subscription" data-link>Assinar para desbloquear</a>
    </div>
  `;
}

function sketchfabEmbedSource(value) {
  const raw = sanitizeText(value);
  if (!raw) return "";
  const iframeMatch = raw.match(/src=["']([^"']+)["']/i);
  const src = iframeMatch ? iframeMatch[1] : raw;
  if (!/^https?:\/\//i.test(src)) return "";
  if (!src.includes("sketchfab.com")) return src;
  if (src.includes("/embed")) return src;
  return src.replace(/\/?(\?.*)?$/, "/embed$1");
}

function learningObjectiveItems(model) {
  return model.learning_objectives
    .split(";")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function studyTabButton(id, label, active = false) {
  return `<button class="tab-button ${active ? "active" : ""}" type="button" data-study-tab="${id}" role="tab">${label}</button>`;
}

function viewerSrcDoc(model) {
  return `
    <style>
      body{margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(circle at center,rgba(47,184,181,.24),transparent 44%),linear-gradient(135deg,#05070b,#111827);color:#f5f5f5;font-family:Inter,Arial,sans-serif;text-align:center}
      strong{display:block;color:#e4cf93;font:700 34px Georgia,serif;margin-bottom:10px}
      span{color:#9fb0c5}
    </style>
    <div><strong>${escapeHtml(model.title)}</strong><span>Área preparada para embed Sketchfab<br>${escapeHtml(model.sketchfab_url)}</span></div>
  `.replaceAll('"', "&quot;");
}

function renderSimpleModule(title, route, text) {
  const user = requireAuth();
  if (!user) return;
  shell(`
    <div class="page-title">
      <div>
        <div class="eyebrow">Modulo</div>
        <h1>${title}</h1>
        <p>${text}</p>
      </div>
    </div>
    <div class="grid cols-3">
      ${courses.map(item => `
        <article class="card model-card">
          <div class="cover"></div>
          <span class="status-chip ${item.premium ? "premium" : "free"}">${item.premium ? "Premium" : "Gratuito"}</span>
          <h3>${item.title}</h3>
          <p>Conteúdo demonstrativo preparado para catálogo, vídeo, curso e materiais complementares.</p>
          <button class="btn ${item.premium && !hasPremium() ? "btn-ghost" : "btn-teal"}" data-premium-check="${item.premium}">${item.premium && !hasPremium() ? icon("lock") + " Assinar agora" : "Abrir conteúdo"}</button>
        </article>
      `).join("")}
    </div>
  `, route);
}

function renderSubscription() {
  const user = requireAuth();
  if (!user) return;
  const status = resolveSubscriptionStatus(user);
  const active = status === "active";
  const currentPlan = escapeHtml(user.subscription_plan || "Nenhum plano ativo");
  const renewal = formatDate(user.subscription_renews_at);
  shell(`
    <div class="page-title">
      <div>
        <div class="eyebrow">Assinatura</div>
        <h1>Minha assinatura</h1>
        <p>Escolha um plano para acessar a biblioteca anatômica 3D premium.</p>
      </div>
    </div>

    <section class="subscription-status-panel">
      <div>
        <span class="status-chip ${statusClass(status)}">${subscriptionLabel(status)}</span>
        <h2>${active ? currentPlan : "Assine para liberar a biblioteca premium"}</h2>
        <p>${active ? `Renovação prevista para ${renewal}.` : "Seu acesso atual permite apenas conteúdos gratuitos, demonstrações ou trial disponível."}</p>
      </div>
      <div class="row-actions">
        ${active ? '<button class="btn btn-ghost" data-cancel-subscription>Cancelar assinatura</button>' : '<button class="btn btn-teal" data-scroll-plans>Assinar agora</button>'}
      </div>
    </section>

    <section id="plans" class="subscription-plans-grid">
      ${subscriptionPlans.map(planCard).join("")}
    </section>

    <section class="panel gateway-panel">
      <h3>Integração de pagamento preparada</h3>
      <p>Fluxo mockado com <code>createCheckoutSession()</code>, <code>updateSubscriptionStatus()</code> e <code>cancelSubscription()</code>, pronto para conexão futura com Stripe, Mercado Pago ou outro gateway.</p>
      <div class="gateway-steps">
        <span>1. Seleção do plano</span>
        <span>2. Sessão de checkout</span>
        <span>3. Confirmação do provedor</span>
        <span>4. Atualização da assinatura</span>
      </div>
    </section>
  `, "/subscription");
}

function planCard(plan) {
  const consult = !plan.checkout;
  return `
    <article class="plan-card-v2 ${plan.recommended ? "recommended" : ""}">
      ${plan.recommended ? '<div class="recommended-badge">Recomendado</div>' : ""}
      <div class="plan-card-head">
        <h3>${escapeHtml(plan.name)}</h3>
        <div class="price">${escapeHtml(plan.price)}</div>
      </div>
      <ul class="list">${plan.benefits.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <button
        class="btn ${consult ? "btn-outline" : "btn-teal"}"
        data-${consult ? "consult-plan" : "checkout-plan"}="${escapeHtml(plan.id)}"
        style="margin-top: auto"
      >${escapeHtml(plan.cta)}</button>
    </article>
  `;
}

function renderProfile() {
  const user = requireAuth();
  if (!user) return;
  shell(`
    <div class="page-title">
      <div>
        <div class="eyebrow">Conta</div>
        <h1>Perfil</h1>
        <p>Dados editáveis do usuário e preferências de idioma.</p>
      </div>
    </div>
    <section class="panel">
      <form class="form-grid" id="profileForm">
        ${fieldWithValue("name", "Nome", user.name)}
        ${fieldWithValue("email", "E-mail", user.email, "email")}
        ${fieldWithValue("institution", "Instituição", user.institution)}
        ${fieldWithValue("country", "País", user.country)}
        <label class="field">
          <span>Tipo de usuário</span>
          <select name="user_type">
            ${["Estudante", "Professor", "Profissional da saúde", "Instituição"].map(item => `<option ${item === user.user_type ? "selected" : ""}>${item}</option>`).join("")}
          </select>
          <small></small>
        </label>
        <label class="field">
          <span>Preferencia de idioma</span>
          <select name="language">
            <option>Portugues</option>
            <option>Espanol</option>
            <option>English</option>
          </select>
          <small></small>
        </label>
        <label class="field full">
          <span>Alterar senha</span>
          <input name="password" type="password" placeholder="Nova senha">
          <small></small>
        </label>
        <button class="btn btn-primary" type="submit">Salvar perfil</button>
      </form>
    </section>
  `, "/profile");
}

function fieldWithValue(name, label, value, type = "text") {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="${type}" value="${escapeHtml(value || "")}">
      <small></small>
    </label>
  `;
}

function renderAdmin(section = "dashboard") {
  const user = requireAdmin();
  if (!user) return;
  const validSections = ["dashboard", "users", "models", "categories", "courses", "videos", "subscriptions", "settings"];
  const activeSection = validSections.includes(section) ? section : "dashboard";
  const content = {
    dashboard: adminDashboardView,
    users: adminUsersView,
    models: adminModelsView,
    categories: adminCategoriesView,
    courses: () => adminContentManagerView("Cursos", "Trilhas educacionais, aulas organizadas e programas de estudo."),
    videos: () => adminContentManagerView("Vídeos", "Biblioteca audiovisual para revisão, demonstrações e aulas rápidas."),
    subscriptions: adminSubscriptionsView,
    settings: adminSettingsView
  }[activeSection]();

  app.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-sidebar" id="sidebar">
        <a class="brand" href="/admin" data-link>
          <img src="${LOGO_SRC}" alt="Aeternum Atlas">
          <span class="brand-name"><strong>Aeternum Atlas</strong><span>Painel Admin</span></span>
        </a>
        <nav class="sidebar-nav admin-nav">
          ${adminNavLink("/admin", "Dashboard", "shield", activeSection === "dashboard")}
          ${adminNavLink("/admin/users", "Usuários", "user", activeSection === "users")}
          ${adminNavLink("/admin/models", "Modelos 3D", "cube", activeSection === "models")}
          ${adminNavLink("/admin/categories", "Categorias", "book", activeSection === "categories")}
          ${adminNavLink("/admin/courses", "Cursos", "book", activeSection === "courses")}
          ${adminNavLink("/admin/videos", "Vídeos", "video", activeSection === "videos")}
          ${adminNavLink("/admin/subscriptions", "Assinaturas", "shield", activeSection === "subscriptions")}
          ${adminNavLink("/admin/settings", "Configurações", "help", activeSection === "settings")}
        </nav>
        <div class="sidebar-footer">
          <a class="btn btn-ghost btn-full" href="/dashboard" data-link>Voltar ao app</a>
          <button class="btn btn-ghost btn-full" data-logout>Sair</button>
        </div>
      </aside>
      <section class="admin-main">
        <header class="topbar admin-topbar">
          <button class="btn btn-ghost mobile-menu" data-menu>${icon("menu")} Menu</button>
          <div>
            <strong>${escapeHtml(user.name)}</strong>
            <div style="color: var(--muted); font-size: .9rem">Administrador do Aeternum Atlas</div>
          </div>
          <button class="btn btn-teal" data-model-new>Novo modelo 3D</button>
        </header>
        <main class="content admin-content">${content}</main>
      </section>
    </div>
  `;
}

function adminNavLink(href, label, iconName, active) {
  return `<a class="nav-link ${active ? "active" : ""}" href="${href}" data-link>${icon(iconName)} ${label}</a>`;
}

function adminPageTitle(eyebrow, title, text, action = "") {
  return `
    <div class="page-title">
      <div>
        <div class="eyebrow">${eyebrow}</div>
        <h1>${title}</h1>
        <p>${text}</p>
      </div>
      ${action}
    </div>
  `;
}

function adminDashboardView() {
  const users = getUsers();
  const activeUsers = users.filter(item => ["trial", "active"].includes(resolveSubscriptionStatus(item, false)));
  const activeSubscriptions = users.filter(item => resolveSubscriptionStatus(item, false) === "active");
  const trialUsers = users.filter(item => resolveSubscriptionStatus(item, false) === "trial");
  const models = getModels();
  const topModels = [...models].sort((a, b) => Number(b.access_count || 0) - Number(a.access_count || 0)).slice(0, 5);
  return `
    ${adminPageTitle("Painel protegido", "Dashboard admin", "Visão executiva de usuários, assinaturas e conteúdos cadastrados.")}
    <div class="grid cols-4 admin-metrics">
      ${metric(users.length, "Total de usuários", "user")}
      ${metric(trialUsers.length, "Usuários em trial", "shield")}
      ${metric(activeSubscriptions.length, "Assinaturas ativas", "shield")}
      ${metric(models.length + courses.length, "Conteúdos cadastrados", "book")}
      ${metric(escapeHtml(topModels[0]?.title || "-"), "Modelo mais acessado", "cube")}
    </div>
    <div class="grid cols-2" style="margin-top: 18px">
      <section class="panel">
        <h3>Modelos mais acessados</h3>
        <div class="admin-list">
          ${topModels.map(model => `<div><strong>${escapeHtml(model.title)}</strong><span>${Number(model.access_count || 0)} acessos</span></div>`).join("")}
        </div>
      </section>
      <section class="panel">
        <h3>Resumo operacional</h3>
        <p>${activeUsers.length} usuários com acesso temporário ou ativo.</p>
        <p>${models.filter(model => model.is_active).length} modelos ativos na biblioteca 3D.</p>
        <p>${getCategories().length} categorias anatômicas disponíveis.</p>
      </section>
    </div>
  `;
}

function adminUsersView() {
  const users = getUsers();
  return `
    ${adminPageTitle("Gestão", "Usuários", "Acompanhe perfis, instituições, países, status e ações administrativas.")}
    <section class="panel table-panel">
      <div class="table-scroll">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Tipo</th>
              <th>Instituição</th>
              <th>País</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>${escapeHtml(user.name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.user_type)}</td>
                <td>${escapeHtml(user.institution)}</td>
                <td>${escapeHtml(user.country)}</td>
                <td>${statusPill(resolveSubscriptionStatus(user, false))}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                  <div class="table-actions">
                    <button class="mini-btn" data-user-view="${escapeHtml(user.id)}">Visualizar</button>
                    <button class="mini-btn" data-user-edit="${escapeHtml(user.id)}">Editar</button>
                    <button class="mini-btn danger" data-user-block="${escapeHtml(user.id)}">Bloquear</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function adminModelsView() {
  const models = getModels();
  const editingModel = models.find(model => model.id === adminEditingModelId);
  return `
    ${adminPageTitle("Biblioteca 3D", "Modelos 3D", "Crie, edite, exclua e ative ou desative modelos anatômicos.", `<button class="btn btn-outline" data-model-new>Novo modelo</button>`)}
    <div class="grid cols-2 admin-edit-grid">
      <section class="panel">
        <h3>${editingModel ? "Editar modelo" : "Criar modelo"}</h3>
        ${adminModelForm(editingModel)}
      </section>
      <section class="panel table-panel">
        <h3>Modelos cadastrados</h3>
        <div class="table-scroll">
          <table class="admin-table">
            <thead><tr><th>Título</th><th>Categoria</th><th>Nível</th><th>Acesso</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              ${models.map(model => `
                <tr>
                  <td>${escapeHtml(model.title)}</td>
                  <td>${escapeHtml(model.category)}</td>
                  <td>${escapeHtml(model.level)}</td>
                  <td>${model.is_premium ? "Premium" : "Gratuito"}</td>
                  <td>${model.is_active ? "Ativo" : "Inativo"}</td>
                  <td>
                    <div class="table-actions">
                      <button class="mini-btn" data-model-edit="${escapeHtml(model.id)}">Editar</button>
                      <button class="mini-btn" data-model-toggle="${escapeHtml(model.id)}">${model.is_active ? "Desativar" : "Ativar"}</button>
                      <button class="mini-btn danger" data-model-delete="${escapeHtml(model.id)}">Excluir</button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function adminModelForm(model) {
  const categories = getCategories();
  const selected = model || {};
  return `
    <form id="adminModelForm" class="form-grid admin-form">
      <input type="hidden" name="id" value="${escapeHtml(selected.id || "")}">
      ${adminInput("title", "Título", selected.title)}
      ${adminInput("cover_image_url", "URL da imagem de capa", selected.cover_image_url)}
      <label class="field">
        <span>Categoria anatômica</span>
        <select name="category" required>
          ${categories.map(item => `<option ${item === selected.category ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
        </select>
        <small></small>
      </label>
      <label class="field">
        <span>Nível</span>
        <select name="level" required>
          ${["Básico", "Intermediário", "Avançado"].map(item => `<option ${item === selected.level ? "selected" : ""}>${item}</option>`).join("")}
        </select>
        <small></small>
      </label>
      <label class="field full">
        <span>Descrição</span>
        <textarea name="description" required>${escapeHtml(selected.description || "")}</textarea>
        <small></small>
      </label>
      <label class="field full">
        <span>URL/iframe do Sketchfab</span>
        <textarea name="sketchfab_url">${escapeHtml(selected.sketchfab_url || "")}</textarea>
        <small></small>
      </label>
      <label class="field full">
        <span>Objetivos de aprendizagem</span>
        <textarea name="learning_objectives">${escapeHtml(selected.learning_objectives || "")}</textarea>
        <small></small>
      </label>
      <label class="field full">
        <span>Observações clínicas</span>
        <textarea name="clinical_notes">${escapeHtml(selected.clinical_notes || "")}</textarea>
        <small></small>
      </label>
      <label class="field">
        <span>Acesso</span>
        <select name="access_type">
          <option value="free" ${selected.is_premium === false ? "selected" : ""}>Gratuito</option>
          <option value="premium" ${selected.is_premium !== false ? "selected" : ""}>Premium</option>
        </select>
        <small></small>
      </label>
      <label class="field">
        <span>Status</span>
        <select name="is_active">
          <option value="true" ${selected.is_active !== false ? "selected" : ""}>Ativo</option>
          <option value="false" ${selected.is_active === false ? "selected" : ""}>Inativo</option>
        </select>
        <small></small>
      </label>
      <div class="row-actions field full">
        <button class="btn btn-primary" type="submit">${model ? "Salvar alterações" : "Criar modelo"}</button>
        <button class="btn btn-ghost" type="button" data-model-new>Limpar</button>
      </div>
    </form>
  `;
}

function adminInput(name, label, value = "") {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" value="${escapeHtml(value || "")}" required>
      <small></small>
    </label>
  `;
}

function adminCategoriesView() {
  const categories = getCategories();
  return `
    ${adminPageTitle("Taxonomia", "Categorias anatômicas", "Gerencie a organização anatômica usada nos modelos 3D.")}
    <div class="grid cols-2">
      <section class="panel">
        <h3>Criar categoria</h3>
        <form id="adminCategoryForm" class="row-actions">
          <input class="search-input" name="category" placeholder="Nova categoria anatômica">
          <button class="btn btn-primary" type="submit">Adicionar</button>
        </form>
      </section>
      <section class="panel">
        <h3>Categorias cadastradas</h3>
        <div class="category-list">
          ${categories.map(item => `<span class="level-chip">${escapeHtml(item)}</span>`).join("")}
        </div>
      </section>
    </div>
  `;
}

function adminSubscriptionsView() {
  const users = getUsers();
  return `
    ${adminPageTitle("Receita", "Assinaturas", "Tabela preparada para integrações futuras com Stripe, Mercado Pago ou outro gateway.")}
    <section class="panel table-panel">
      <div class="table-scroll">
        <table class="admin-table">
          <thead><tr><th>Usuário</th><th>Plano</th><th>Status</th><th>Data de início</th><th>Data de fim</th><th>Provedor</th></tr></thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>${escapeHtml(user.name)}</td>
                <td>${escapeHtml(user.subscription_plan || "Sem plano")}</td>
                <td>${statusPill(resolveSubscriptionStatus(user, false))}</td>
                <td>${formatDate(user.subscription_started_at || user.trial_started_at || user.created_at)}</td>
                <td>${formatDate(user.subscription_renews_at || user.trial_ends_at)}</td>
                <td>${escapeHtml(user.payment_provider || (user.subscription_status === "active" ? "Gateway futuro" : "Mock/local"))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function adminContentManagerView(title, text) {
  return `
    ${adminPageTitle("Conteúdo", title, text)}
    <section class="panel">
      <h3>Gestão em preparação</h3>
      <p>Área visual pronta para receber CRUD dedicado de ${title.toLowerCase()} na próxima etapa.</p>
      <div class="grid cols-3" style="margin-top: 18px">
        ${courses.map(item => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${item.kind} - ${item.premium ? "Premium" : "Gratuito"}</p></article>`).join("")}
      </div>
    </section>
  `;
}

function adminSettingsView() {
  return `
    ${adminPageTitle("Sistema", "Configurações", "Preferências administrativas e estrutura técnica do Aeternum Atlas.")}
    <section class="panel">
      <h3>Estrutura lógica de banco de dados</h3>
      <div class="grid cols-3">${Object.entries(databaseSchema).map(([table, cols]) => `<div class="card"><h3>${table}</h3><p>${cols.join(", ")}</p></div>`).join("")}</div>
    </section>
  `;
}

function statusPill(status) {
  return `<span class="status-chip ${statusClass(status)}">${subscriptionLabel(status)}</span>`;
}

function renderNotFound() {
  app.innerHTML = `${publicHeader()}<main class="container" style="padding:60px 0"><section class="panel"><h1>Pagina nao encontrada</h1><p class="lead">Volte para o inicio da plataforma.</p><a class="btn btn-primary" href="/" data-link>Inicio</a></section></main>`;
}

function showPremiumModal() {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <section class="modal-card">
        <h3>Conteúdo premium bloqueado.</h3>
        <p>Este conteúdo faz parte do plano premium Aeternum Atlas.</p>
        <div class="row-actions">
          <a class="btn btn-primary" href="/subscription" data-link>Assinar agora</a>
          <button class="btn btn-ghost" data-close-modal>Agora nao</button>
        </div>
      </section>
    </div>
  `;
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 2600);
}

function route() {
  const current = page();
  if (current === "/") return renderHome();
  if (current === "/login") return renderAuth("login");
  if (current === "/register") return renderAuth("register");
  if (current === "/dashboard") return renderDashboard();
  if (current === "/models") return renderModels();
  if (current.startsWith("/models/")) return renderModelDetail(current.split("/").pop());
  if (current === "/atlas") return renderSimpleModule("Atlas Anatômico", "/atlas", "Mapas anatômicos e conteúdos de referência por sistema.");
  if (current === "/radiology") return renderSimpleModule("Radiologia", "/radiology", "Área para correlação com imagens diagnósticas e anatomia seccional.");
  if (current === "/videos") return renderSimpleModule("Vídeos", "/videos", "Aulas e demonstrações visuais para revisão guiada.");
  if (current === "/courses") return renderSimpleModule("Cursos", "/courses", "Trilhas estruturadas para estudantes, professores e profissionais.");
  if (current === "/subscription") return renderSubscription();
  if (current === "/profile") return renderProfile();
  if (current === "/admin") return renderAdmin("dashboard");
  if (current.startsWith("/admin/")) return renderAdmin(current.split("/")[2] || "dashboard");
  renderNotFound();
}

function render() {
  modalRoot.innerHTML = "";
  route();
}

document.addEventListener("click", event => {
  const link = event.target.closest("[data-link]");
  if (link) {
    event.preventDefault();
    const href = link.getAttribute("href");
    navigate(href && href.startsWith("/") ? href : new URL(link.href).pathname);
    return;
  }
  const logoutButton = event.target.closest("[data-logout]");
  if (logoutButton) logout();
  const menuButton = event.target.closest("[data-menu]");
  if (menuButton) document.querySelector("#sidebar")?.classList.toggle("open");
  const closeModal = event.target.closest("[data-close-modal]");
  if (closeModal) modalRoot.innerHTML = "";
  const modelButton = event.target.closest("[data-open-model]");
  if (modelButton) openModel(modelButton.dataset.openModel);
  const premiumCheck = event.target.closest("[data-premium-check='true']");
  if (premiumCheck && !hasPremium()) {
    toast("Conteúdo premium bloqueado.");
    showPremiumModal();
  }
  const scrollPlans = event.target.closest("[data-scroll-plans]");
  if (scrollPlans) document.querySelector("#plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const checkoutPlan = event.target.closest("[data-checkout-plan]");
  if (checkoutPlan) {
    const user = getSession();
    const plan = getPlanById(checkoutPlan.dataset.checkoutPlan);
    const session = createCheckoutSession(plan?.id, user);
    if (!user || !plan || !session) {
      toast("Não foi possível iniciar o checkout.");
      return;
    }
    const now = new Date();
    updateSubscriptionStatus(user.id, "active", plan.name, {
      started_at: now.toISOString(),
      renews_at: renewalDateForPlan(plan, now),
      payment_provider: session.provider
    });
    toast("Assinatura ativa.");
    renderSubscription();
  }
  const consultPlan = event.target.closest("[data-consult-plan]");
  if (consultPlan) {
    const plan = getPlanById(consultPlan.dataset.consultPlan);
    toast(`Solicitação para consultor registrada: ${plan?.name || "Plano sob consulta"}.`);
  }
  const cancelButton = event.target.closest("[data-cancel-subscription]");
  if (cancelButton) {
    cancelSubscription();
    toast("Assinatura cancelada.");
    renderSubscription();
  }
  const studyTab = event.target.closest("[data-study-tab]");
  if (studyTab) {
    const target = studyTab.dataset.studyTab;
    document.querySelectorAll("[data-study-tab]").forEach(button => button.classList.toggle("active", button === studyTab));
    document.querySelectorAll("[data-tab-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.tabPanel === target));
  }
  if (event.target.closest("[data-favorite]")) toast("Modelo marcado como favorito.");
  if (event.target.closest("[data-complete]")) toast("Estudo concluido e progresso atualizado.");
  if (event.target.closest("[data-plan]")) toast("Plano selecionado. Gateway de pagamento pronto para integracao futura.");
  if (event.target.closest("[data-forgot]")) toast("Fluxo de recuperacao de senha preparado para API futura.");
  if (event.target.closest("[data-admin-save]")) toast("Modelo salvo no mock administrativo.");
  const newModel = event.target.closest("[data-model-new]");
  if (newModel) {
    adminEditingModelId = null;
    if (page().startsWith("/admin/models")) renderAdmin("models");
    else navigate("/admin/models");
  }
  const editModel = event.target.closest("[data-model-edit]");
  if (editModel) {
    adminEditingModelId = editModel.dataset.modelEdit;
    renderAdmin("models");
  }
  const toggleModel = event.target.closest("[data-model-toggle]");
  if (toggleModel) {
    const models = getModels().map(model => model.id === toggleModel.dataset.modelToggle ? { ...model, is_active: !model.is_active } : model);
    saveModels(models);
    toast("Status do modelo atualizado.");
    renderAdmin("models");
  }
  const deleteModel = event.target.closest("[data-model-delete]");
  if (deleteModel) {
    const model = getModels().find(item => item.id === deleteModel.dataset.modelDelete);
    if (model && window.confirm(`Excluir o modelo "${model.title}"? Esta ação remove o item da biblioteca local.`)) {
      saveModels(getModels().filter(item => item.id !== model.id));
      if (adminEditingModelId === model.id) adminEditingModelId = null;
      toast("Modelo excluído.");
      renderAdmin("models");
    }
  }
  const userView = event.target.closest("[data-user-view]");
  if (userView) {
    const user = getUsers().find(item => item.id === userView.dataset.userView);
    if (user) toast(`${user.name} - ${subscriptionLabel(resolveSubscriptionStatus(user, false))}`);
  }
  const userEdit = event.target.closest("[data-user-edit]");
  if (userEdit) toast("Edição detalhada de usuário preparada para integração futura.");
  const userBlock = event.target.closest("[data-user-block]");
  if (userBlock) {
    const users = getUsers().map(user => user.id === userBlock.dataset.userBlock ? { ...user, subscription_status: "cancelled" } : user);
    saveUsers(users);
    toast("Usuário bloqueado.");
    renderAdmin("users");
  }
});

document.addEventListener("submit", async event => {
  if (event.target.id === "adminModelForm") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const models = getModels();
    const current = models.find(model => model.id === data.id);
    const title = sanitizeText(data.title);
    const description = sanitizeText(data.description);
    if (!title || !description) {
      toast("Título e descrição são obrigatórios.");
      return;
    }
    const savedModel = normalizeModel({
      ...current,
      id: current?.id || uniqueModelId(title, models),
      title,
      description,
      category: sanitizeText(data.category),
      level: sanitizeText(data.level),
      cover_image_url: sanitizeText(data.cover_image_url),
      sketchfab_url: sanitizeText(data.sketchfab_url),
      learning_objectives: sanitizeText(data.learning_objectives),
      clinical_notes: sanitizeText(data.clinical_notes),
      is_premium: data.access_type === "premium",
      is_active: data.is_active === "true",
      access_count: current?.access_count || 0,
      created_at: current?.created_at || new Date().toISOString()
    });
    saveModels(current ? models.map(model => model.id === current.id ? savedModel : model) : [...models, savedModel]);
    adminEditingModelId = savedModel.id;
    toast(current ? "Modelo atualizado." : "Modelo criado.");
    renderAdmin("models");
    return;
  }

  if (event.target.id === "adminCategoryForm") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const category = sanitizeText(data.category);
    if (!category) {
      toast("Informe uma categoria.");
      return;
    }
    const categories = getCategories();
    if (categories.some(item => item.toLowerCase() === category.toLowerCase())) {
      toast("Categoria já cadastrada.");
      return;
    }
    saveCategories([...categories, category]);
    toast("Categoria criada.");
    renderAdmin("categories");
    return;
  }

  if (event.target.id === "profileForm") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const users = getUsers();
    const user = getSession();
    const index = users.findIndex(item => item.id === user.id);
    const updates = {
      name: sanitizeText(data.name),
      email: normalizeEmail(data.email),
      institution: sanitizeText(data.institution),
      country: sanitizeText(data.country),
      user_type: sanitizeText(data.user_type)
    };
    if (data.password) {
      if (String(data.password).length < 8) {
        toast("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }
      Object.assign(updates, await hashPassword(String(data.password)));
    }
    users[index] = { ...users[index], ...updates };
    saveUsers(users);
    toast("Perfil atualizado.");
    renderProfile();
  }
});

window.addEventListener("popstate", render);
window.addEventListener("hashchange", render);

async function bootstrapAuth() {
  try {
    await migrateLegacyUsers();
  } catch (error) {
    console.error(error);
    toast("Não foi possível preparar a autenticação segura neste navegador.");
  }
  render();
}

bootstrapAuth();
