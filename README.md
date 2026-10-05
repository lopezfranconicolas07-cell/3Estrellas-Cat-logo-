# 3Estrellas — Catálogo Web

Paquete listo para subir a GitHub y publicar como Static Site en Render.

## Archivos
- `index.html` — catálogo.
- `render.yaml` — configuración de publicación.

## Publicar
1. Crear un repositorio en GitHub llamado `3estrellas-catalogo`.
2. Subir `index.html` y `render.yaml` a la raíz.
3. En Render elegir **New → Static Site** y conectar ese repositorio.
4. Dejar vacío **Build Command** y usar `.` como **Publish Directory** si Render lo solicita.
5. Crear el sitio.

El catálogo consulta `public.products` de Supabase. Si Supabase no responde, muestra el catálogo incorporado como respaldo.
