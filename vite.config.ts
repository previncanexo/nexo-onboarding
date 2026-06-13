import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'


// Difiere la HIDRATACIÓN hasta después del primer pintado.
// Problema medido: el HTML del SSG está listo a los ~0.4s y se ve perfecto SIN JS,
// pero al ejecutar el módulo de entrada, la hidratación de React ocupa el hilo
// principal y el navegador no pinta NADA hasta ~2.3s (peor en mobile gama baja).
// Solución: en vez de cargar el módulo de entrada como <script type="module"> (que
// el navegador ejecuta apenas termina de parsear, antes de pintar), lo inyectamos
// recién tras el primer frame pintado (requestIdleCallback / doble rAF). Así el
// navegador pinta el contenido del SSG de inmediato y la hidratación corre después.
function deferHydration() {
  return {
    name: 'defer-hydration',
    enforce: 'post' as const,
    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string) {
        return html.replace(
          /<script type="module"[^>]*\ssrc="([^"]+)"><\/script>/,
          (_m: string, src: string) =>
            `<script>(function(){var done=false;function go(){if(done)return;done=true;` +
            `var s=document.createElement('script');s.type='module';s.crossOrigin='anonymous';` +
            `s.src=${JSON.stringify(src)};document.head.appendChild(s);}` +
            // Doble rAF = correr DESPUÉS del primer frame pintado (no antes, como hacía
            // requestIdleCallback con timeout corto). setTimeout = backstop si la pestaña
            // está en segundo plano (rAF no dispara ahí).
            `if('requestAnimationFrame'in window){requestAnimationFrame(function(){requestAnimationFrame(go);});}` +
            `setTimeout(go,1500);})();</script>`
        )
      },
    },
  }
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  // SSG (vite-react-ssg): desactivar la extracción de CSS crítico.
  // Con critical CSS, el resto del CSS carga async y en conexiones lentas el contenido
  // below-the-fold (y el overlay del menú, oculto por clase) se ve SIN ESTILO/roto hasta
  // que llega. Cargando el CSS completo render-blocking (~14KB gzip, instantáneo) todo
  // sale con estilo desde el primer pintado.
  ssgOptions: {
    beastiesOptions: false,
  },
  plugins: [
    figmaAssetResolver(),
    deferHydration(),
    // Genera variantes responsive (srcset) de las imágenes en build.
    imagetools(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
