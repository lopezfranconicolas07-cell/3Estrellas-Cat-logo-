# 3Estrellas — catálogo + administración

Archivos en la raíz:
- `index.html`: catálogo público.
- `admin.html`: panel privado de administración.
- `render.yaml`: configuración de Render.

El catálogo lee los productos desde Supabase y mantiene los productos embebidos como respaldo.

Supabase:
- URL: https://pwiakszymoicfqxvkchm.supabase.co
- Tabla: `public.products`
- Storage bucket: `product-images`

IMPORTANTE: el panel exige un usuario de Supabase Auth cuyo `app_metadata.role` sea `admin`. Nunca poner una service-role key en estos archivos.
