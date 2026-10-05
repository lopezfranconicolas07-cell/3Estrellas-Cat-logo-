# 3Estrellas — catálogo + administración

## Publicación
Este repositorio contiene `index.html` (catálogo público), `admin.html` (panel privado) y `render.yaml`.

Render debe publicar la raíz (`.`) como sitio estático.

## Panel de administración
Abrir `/admin.html`.

El panel usa Supabase Auth. Solo usuarios cuyo `app_metadata.role` sea `admin` pueden crear, editar, eliminar productos o subir fotos.

### Crear el usuario administrador
1. En Supabase: Authentication → Users → Add user.
2. Crear un usuario con el email y contraseña que quieras usar para el panel.
3. Luego, en Supabase SQL Editor, ejecutar:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'TU_EMAIL';
```

Reemplazá `TU_EMAIL` por el email exacto del usuario creado.

### Qué permite el panel
- Crear productos.
- Editar nombre, categoría, cuotas, precio, talle y stock.
- Subir imágenes directamente a Supabase Storage.
- Eliminar productos.

El catálogo público sigue leyendo los productos desde `public.products`.
