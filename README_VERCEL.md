# GastoGenie - Guía de Despliegue en Vercel

El error que viste (`No Output Directory named "build"`) ocurre porque este proyecto usa **Vite**, el cual genera una carpeta llamada `dist`, pero Vercel busca por defecto una llamada `build`.

## Pasos exactos para solucionar el error:

1. **Importar el proyecto en Vercel:**
   - Conecta tu repositorio de GitHub a Vercel.

2. **Configuración del proyecto (Build & Development Settings):**
   - En el paso donde Vercel te muestra "Build Settings", **NO** elijas "Create React App".
   - Asegúrate de que detecte **Vite** como el framework.
   - Si no lo detecta automáticamente, cambia el **Output Directory** de `build` a **`dist`**.
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`

3. **Variables de Entorno (Environment Variables):**
   - Ve a la pestaña **Environment Variables** en la configuración de tu proyecto en Vercel.
   - Agrega la variable:
     - **Key:** `GEMINI_API_KEY`
     - **Value:** (Tu clave de API de Gemini sacada de https://aistudio.google.com/app/apikey)

4. **Desplegar:**
   - Dale clic a **Deploy**.

## ¿Por qué añadí `vercel.json`?
He incluido un archivo `vercel.json` en la raíz del proyecto. Esto servirá para que:
- Las rutas de React funcionen correctamente (evita el error 404 al recargar la página).
- Vercel sepa exactamente cómo manejar el tráfico.

## Resumen técnico para Vercel:
- **Framework Preset:** `Vite` (o `Other` si no aparece).
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node.js Version:** 18 o superior.
