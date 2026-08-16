# 🎨 Aeternum 26.1 Liquid Glass — Design Tokens

Este documento detalha o catálogo oficial de tokens CSS do sistema **Aeternum 26.1**.

---

## 1. Cores e Atmosfera

```css
:root {
  /* Atmosfera de Fundo */
  --aeternum-bg-void: #02080b;
  --aeternum-bg-deep: #041216;
  --aeternum-bg-elevated: #071a1f;

  /* Materiais de Vidro */
  --aeternum-glass-neutral: rgba(10, 27, 32, 0.56);
  --aeternum-glass-strong: rgba(8, 25, 30, 0.72);
  --aeternum-glass-soft: rgba(24, 47, 52, 0.28);
  --aeternum-glass-modal: rgba(4, 15, 18, 0.88);

  /* Linhas e Contornos */
  --aeternum-line-subtle: rgba(137, 230, 225, 0.13);
  --aeternum-line-default: rgba(137, 230, 225, 0.25);
  --aeternum-line-focus: rgba(87, 245, 237, 0.66);
  --aeternum-line-gold: rgba(217, 185, 101, 0.35);

  /* Escala Teal (Interação & Foco) */
  --aeternum-teal-300: #8bf5ef;
  --aeternum-teal-400: #5ce8e2;
  --aeternum-teal-500: #2bcac4;
  --aeternum-teal-600: #159e9b;

  /* Escala Gold (Autoridade & Editorial) */
  --aeternum-gold-300: #f1d98f;
  --aeternum-gold-400: #d9b965;
  --aeternum-gold-500: #b89342;

  /* Tipografia & Contraste */
  --aeternum-text-primary: #f4f2ea;
  --aeternum-text-secondary: #b8c3c6;
  --aeternum-text-tertiary: #7f9499;

  /* Estados do Sistema */
  --aeternum-success: #50e1af;
  --aeternum-warning: #e8c56a;
  --aeternum-danger: #ee7785;
  --aeternum-info: #5ce8e2;
}
```

---

## 2. Tipografia e Escalas Fluidas

```css
:root {
  --type-display-xl: clamp(3.4rem, 7vw, 7.5rem);
  --type-display-lg: clamp(2.6rem, 5vw, 5.2rem);
  --type-title-xl: clamp(2rem, 3.5vw, 3.8rem);
  --type-title-lg: clamp(1.6rem, 2.5vw, 2.8rem);
  --type-title-md: clamp(1.25rem, 1.8vw, 1.75rem);
  --type-body-lg: clamp(1rem, 1.2vw, 1.25rem);
  --type-body-md: 1rem;
  --type-body-sm: 0.875rem;
  --type-label: 0.75rem;
}
```

---

## 3. Espaçamento (Grid de 8 Pontos)

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
}
```

---

## 4. Raios de Curvatura (Border Radius)

```css
:root {
  --radius-control: 14px;
  --radius-button: 999px;
  --radius-card: 24px;
  --radius-panel: 30px;
  --radius-modal: 34px;
}
```

---

## 5. Movimento e Curvas de Transição

```css
:root {
  --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);

  --motion-fast: 140ms;
  --motion-standard: 240ms;
  --motion-slow: 420ms;
  --motion-ambient: 6s;
}
```
