# GastoGenie - Guía de Despliegue en Netlify

Este proyecto está configurado para desplegarse fácilmente en Netlify.

## Pasos para el Despliegue:

1. **Exportar el código:**
   - Ve al icono del engranaje en AI Studio Build.
   - Selecciona "Export to GitHub" o "Download ZIP".

2. **Crear sitio en Netlify:**
   - Si usaste GitHub, conecta el repositorio a Netlify.
   - Si descargaste el ZIP, sube el código a un nuevo repositorio o usa `netlify drop`.

3. **Configuración de Build:**
   - Netlify detectará automáticamente:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`

4. **CONFIGURACIÓN CRÍTICA (Variables de Entorno):**
   - En el panel de Netlify, ve a **Site configuration** > **Environment variables**.
   - Añade una nueva variable:
     - **Key:** `GEMINI_API_KEY`
     - **Value:** (Tu clave de API de Gemini que obtienes en https://aistudio.google.com/app/apikey)

5. **Redirecciones:**
   - El archivo `netlify.toml` ya está incluido para manejar las rutas de React (SPA), evitando errores 404 al recargar páginas.

## Desarrollo Local:

```bash
npm install
npm run dev
```
