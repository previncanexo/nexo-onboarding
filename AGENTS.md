# 🏛️ UX/UI System & Code Review Rules — Previnca Nexo (landing)

> Estas reglas describen el sistema de diseño REAL de esta landing (Vite + React +
> vite-react-ssg, tema claro con marca púrpura/rosa). La revisión de código (`gga`)
> valida contra este archivo: una regla acá debe reflejar cómo está construida la web,
> no un ideal de otro proyecto. Si un cambio se aparta de esto a propósito, explicarlo
> en el commit.

## 0. Stack (contexto técnico)
- **Vite 6 + React 18 SPA**, renderizada a HTML estático en build con **vite-react-ssg** (single-page) y luego hidratada. NO es Next.js: **no existe la directiva `"use client"`** y cualquier sugerencia de agregarla es un falso positivo.
- **Tailwind v4** + estilos inline para valores dinámicos/gradientes (ver regla 5).
- Imágenes responsive con **vite-imagetools** (`?w=...&format=webp&quality=70&as=srcset`).
- Animaciones vía shim propio en `src/app/lib/motion-shim.tsx` (Framer Motion fue removido); efectos infinitos por keyframes CSS en `theme.css`.

## 1. Design Philosophy (The Core)
- **Tema claro y luminoso:** el fondo base de la página es blanco (`#ffffff`, texto `#111111`). Las secciones Hero y Footer son la excepción: usan fondo oscuro con el **gradiente de marca** (`#12053d → #2d1266 → #6535cc → #c94fb5`). NO es "dark mode first" — es claro con acentos oscuros puntuales.
- **Paleta de marca:** púrpura `--purple: #8660ef`, rosa `--pink: #ee5cd0`, durazno `--peach: #e5ab9f`. El gradiente `--gradient-brand` (135deg púrpura→rosa) es el sello visual de CTAs y destacados.
- **Tono cálido y cercano:** es una marca de salud para el público general (incluye adultos mayores). Prioridad a la **legibilidad y la claridad** por sobre el minimalismo extremo. Bordes sutiles, sombras difusas (`--shadow-card`, `--shadow-float`) y "glass" translúcido son parte del lenguaje, no ruido a eliminar.
- **Aire (whitespace):** mantener buena separación vertical entre bloques; las secciones respiran. Usar espaciado fluido con `clamp()` cuando el bloque deba escalar entre mobile y desktop.

## 2. Typography System
- **Títulos (H1–H3): `DM Serif Display`** (serif, vía `font-['DM_Serif_Display']`). Es intencional y es parte de la identidad — NO reemplazar por sans-serif.
- **Cuerpo y UI: `DM Sans`**.
- **Tracking & Leading:** títulos grandes con *letter-spacing* negativo (`tracking-[-1px]` a `tracking-[-3px]`) y leading ajustado (`leading-tight`); párrafos con leading relajado (`leading-relaxed`, ~1.65).
- **Escala fluida:** los títulos del Hero y de sección usan `clamp(min, vw, max)` para escalar entre mobile y desktop (ej. `text-[clamp(26px,7.5vw,42px)]`). No hace falta clavar tamaños fijos en rem.

## 3. Spacing & Radius
- **Escala de Tailwind:** se usa la escala estándar de Tailwind, **incluyendo medios pasos** (`px-3.5`, `py-2.5`, `gap-2.5`) cuando afinan el diseño. No se exige una grilla estricta de 8pt; el criterio es consistencia visual, no múltiplos rígidos.
- **Espaciado fluido:** para padding/márgenes que deban escalar con el viewport, usar `clamp()` (ej. `paddingTop: 'clamp(3.5rem,12vw,7rem)'`).
- **Border-radius:** lenguaje de **curvas suaves y pills**. Botones y chips: `rounded-full` (pill). Tarjetas y contenedores: radios amplios (`rounded-2xl`, `rounded-[28px]`). Evitar esquinas rectas (0px) — no es el estilo de la marca.

## 4. UI Components & Interactivity
- **Botones & CTAs:** el CTA primario ("Quiero mi cobertura") es fondo sólido (blanco sobre oscuro, o gradiente de marca) tipo pill con ícono de flecha y micro-interacción (`hover:scale`, `active:scale-95`). El secundario ("Mi Portal") es outline translúcido. Mantener esa jerarquía.
- **Bordes & glass:** se permiten bordes sutiles (`border-white/12`, `border-white/20`) y superficies translúcidas con `backdrop-filter` **solo en desktop** (ver regla 6: en mobile el blur en elementos fijos es caro y se desactiva).
- **Animaciones:** deben sentirse fluidas. Usar curvas tipo *ease/spring* sutiles (ej. `BLUR_EASE`), no lineales. Las animaciones de entrada y los efectos GPU-pesados (blur reveals por letra, scroll-linked) son **solo desktop**.

## 5. Code Implementation
- **Estilos inline (`style={{...}}`) están PERMITIDOS** y son el patrón establecido en esta landing. Usarlos para: gradientes, valores dinámicos (`opacity`/`scale` según estado), `clamp()`, y *hints* de performance (`willChange`). Para estilos estáticos y repetidos, preferir clases de Tailwind o CSS en `theme.css` cuando mejore la legibilidad — pero NO es obligatorio migrar inline existente.
- **TypeScript** en todo componente. Tipar props.
- **Clases de Tailwind** ordenadas de forma razonable (Layout → Spacing → Typography → Visuals) cuando sea práctico; no es un bloqueante.
- **Extraer** componentes/markup repetido (botones, tarjetas, links) cuando se repita ≥3 veces y aporte legibilidad.
- **Comentarios:** este repo SÍ valora comentarios que expliquen el *porqué* de decisiones no obvias (especialmente las de performance/SSG/iOS). No removerlos por "código autodescriptivo".

## 6. Performance & SSG (reglas duras — mobile first)
> Esta landing tuvo una saga larga de bugs de carga en mobile. Estas reglas son las
> lecciones aprendidas; violarlas reintroduce glitches. El review debe marcarlas.
- **Hidratación sin glitch:** el render inicial del cliente debe COINCIDIR con el HTML del SSG. No condicionar el primer render a `useIsMobile()`/`window` (el SSR no los conoce → re-render y flash al hidratar). Para variantes desktop-only, usar un estado que arranque en `false` y solo suba en desktop tras montar (patrón `desktopReady` con `matchMedia` en `Hero.tsx`), de modo que en mobile no haya re-render.
- **Diferencias por dispositivo en CSS, no en JS:** fondos, `backdrop-filter` y demás estilos que dependan de mobile/desktop van por **media query** (ej. `.nav-pill` en `theme.css`), no por estado JS — así no hay flash al hidratar.
- **Imágenes:** la imagen LCP del Hero va `loading="eager"` + `fetchpriority="high"`. El resto va **`loading="eager"` + `fetchpriority="low"`** (NO `lazy`): empiezan a bajar desde el parseo del HTML, en paralelo vía HTTP/2, pero con prioridad baja para no competir con el LCP. Razón: es una landing que se recorre scrolleando; con `lazy` cada imagen recién arranca al acercarse al viewport → "pop-in" en cada bloque (peor experiencia que el ahorro de bytes, sobre todo en mobile gama baja). El placeholder blur-up base64 inline da preview instantáneo mientras la imagen real llega. Siempre `srcSet` responsive vía imagetools; no servir variantes más grandes que el ancho real de pantalla (mobile no necesita >1080w).
- **Terceros diferidos:** tracking (GA/Meta Pixel) se carga con `requestIdleCallback` (fallback `setTimeout`), nunca render-blocking ni atado al primer tap.
- **GPU en mobile:** `feTurbulence`/grain, `backdrop-filter` en elementos `fixed`, `filter: blur()` animado y scroll-linked transforms van **solo en desktop**.
- **No reflow en scroll:** los handlers de scroll no deben leer `offsetTop`/medidas de layout en cada evento; cachear la medida (ver `App.tsx`).

## 7. Accesibilidad & contenido
- Imágenes decorativas con `alt=""` + `aria-hidden`; las informativas con `alt` descriptivo.
- Targets táctiles cómodos en mobile (apuntar a ~44px en controles principales).
- Respetar `prefers-reduced-motion` (ya hay un override global en `theme.css`).
</content>
