# DevisiStore 🛒

> Plataforma multi-usuario de catálogos digitales. Cada negocio tiene su propia página pública con productos, imágenes, precios, alta personalización y contacto directo por WhatsApp.

---

## Índice

1. [Características](#características)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Instalación local](#instalación-local)
5. [Variables de entorno](#variables-de-entorno)
6. [Primer arranque](#primer-arranque)
7. [Flujo de uso](#flujo-de-uso)
8. [Despliegue en Hostinger](#despliegue-en-hostinger)
9. [Consideraciones de seguridad](#consideraciones-de-seguridad)
10. [Futuros pasos y mejoras](#futuros-pasos-y-mejoras)
11. [Preguntas frecuentes](#preguntas-frecuentes)

---

## Características

| Módulo | Detalle |
|--------|---------|
| 🔐 Autenticación | Sesiones con `express-session`, contraseñas con `bcrypt` |
| 🔑 Acceso controlado | Solo usuarios con clave de acceso pueden registrarse |
| 🏪 Perfil de negocio | Nombre, logo, descripción, contacto, redes sociales, horario |
| 📦 Catálogo de productos | CRUD completo con imágenes, categorías y estados |
| 🌐 Página pública | URL `/shop/:slug` accesible sin login |
| 💬 Botón WhatsApp | Enlace directo en cada producto y en la cabecera del negocio |
| 🔍 Filtros y búsqueda | Por nombre, descripción y categoría |
| 📄 Paginación | 12 productos por página |
| 👮 Panel admin | Usuarios, claves, negocios |
| 🛡️ Seguridad | Helmet, rate-limit en login, validación de inputs |
| 📱 Diseño responsive | TailwindCSS, mobile-first |

---

## Stack tecnológico

```
Backend:    Node.js + Express.js
Templates:  EJS (server-side rendering)
Base de datos: SQLite (better-sqlite3)  ← reemplazable por PostgreSQL/MySQL
Sesiones:   express-session + connect-sqlite3
Uploads:    Multer
CSS:        TailwindCSS (Play CDN)
Seguridad:  Helmet, express-rate-limit, express-validator, bcrypt
Logging:    Morgan
```

---

## Arquitectura del proyecto

```
devisistore/
├── app.js                    ← Punto de entrada, configuración de Express
├── package.json
├── .env.example
│
├── config/
│   └── database.js           ← Inicialización de SQLite y creación de tablas
│
├── models/                   ← Funciones de acceso a la BD (sin ORM)
│   ├── User.js
│   ├── AccessKey.js
│   ├── Business.js
│   └── Product.js
│
├── controllers/              ← Lógica de negocio y respuesta HTTP
│   ├── authController.js
│   ├── adminController.js
│   ├── dashboardController.js
│   └── shopController.js
│
├── routes/                   ← Definición de rutas Express
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   ├── dashboardRoutes.js
│   └── shopRoutes.js
│
├── middlewares/
│   └── authMiddleware.js     ← isAuth, isAdmin
│
├── views/                    ← Plantillas EJS
│   ├── partials/             ← head, navbar, sidebar, footer, flash
│   ├── home/                 ← Landing page
│   ├── auth/                 ← Login, Register
│   ├── dashboard/            ← Panel del usuario
│   ├── admin/                ← Panel de administración
│   ├── shop/                 ← Catálogo público
│   └── errors/               ← 404, 403, 500
│
├── public/
│   └── uploads/              ← Imágenes subidas por usuarios
│
└── utils/
    └── helpers.js            ← Funciones de utilidad
```

---

## Instalación local

### Requisitos previos

- **Node.js 18+** ([descargar](https://nodejs.org))
- **npm 9+** (viene con Node.js)
- Sistema operativo: Linux, macOS o Windows

### Pasos

```bash
# 1. Clonar o descomprimir el proyecto
cd devisistore

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de entorno
cp .env.example .env

# 4. Editar .env con tus valores (ver sección Variables de entorno)
nano .env   # o usa tu editor favorito

# 5. Iniciar en desarrollo
npm run dev

# 6. Iniciar en producción
npm start
```

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

---

## Variables de entorno

Archivo: `.env`

```env
# Puerto del servidor
PORT=3000

# Entorno (development | production)
NODE_ENV=development

# Secreto para firmar las sesiones (CAMBIAR en producción)
SESSION_SECRET=cambia_esto_por_algo_largo_y_aleatorio

# Ruta del archivo SQLite
DB_PATH=./devisistore.db

# Credenciales del administrador inicial
# Solo se usa la primera vez que se ejecuta la app
ADMIN_EMAIL=admin@tucatalogo.com
ADMIN_PASSWORD=Admin1234!

# Tamaño máximo de imágenes en MB
UPLOAD_MAX_SIZE_MB=5

# Rate limiting en login
LOGIN_MAX_ATTEMPTS=10
LOGIN_WINDOW_MINUTES=15
```

> ⚠️ **Nunca subas el archivo `.env` a Git.** Está en `.gitignore` por defecto.

---

## Primer arranque

Al iniciar por primera vez, la aplicación:

1. **Crea la base de datos** (`devisistore.db`) con todas las tablas.
2. **Crea el usuario administrador** con las credenciales de `.env`.
3. Imprime en consola: `🔑 Admin inicial creado: admin@...`

### Primeros pasos como admin

1. Ve a `/auth/login` e inicia sesión con las credenciales de admin.
2. Ve a `/admin/keys` y haz clic en **"Generar clave"**.
3. Comparte esa clave con el primer usuario que quieras invitar.
4. El usuario va a `/auth/register`, pone su email, contraseña y la clave.
5. Listo — ya puede crear su negocio en `/dashboard/business`.

---

## Flujo de uso

```
Admin genera clave → Usuario se registra con la clave
→ Usuario crea su negocio → Sube productos
→ Comparte /shop/su-slug con sus clientes
→ Clientes ven el catálogo y contactan por WhatsApp
```

### Roles

| Rol | Acceso |
|-----|--------|
| `admin` | Panel `/admin`, gestión de usuarios, claves y negocios |
| `user` | Panel `/dashboard`, su negocio y sus productos |
| (público) | Sólo páginas públicas `/`, `/shop/:slug` |

---

## Despliegue en Hostinger

### Opción A — Hostinger con Node.js (VPS o Business)

Hostinger Business Hosting soporta Node.js directamente desde el panel hPanel.

```bash
# En tu VPS o panel hPanel terminal:

# 1. Subir archivos (via FTP, Git o File Manager)
git clone https://github.com/tu-usuario/devisistore.git
cd devisistore

# 2. Instalar dependencias
npm install --production

# 3. Crear .env con variables de producción
cp .env.example .env
nano .env
  # NODE_ENV=production
  # PORT=3000  (o el que te asigne Hostinger)
  # SESSION_SECRET=clave_muy_larga_y_aleatoria

# 4. Iniciar con PM2 (proceso persistente)
npm install -g pm2
pm2 start app.js --name "devisistore"
pm2 save
pm2 startup  # para que se inicie solo al reiniciar el servidor
```

### Opción B — Configuración en hPanel (Hostinger Business)

1. En hPanel → **Sitios web** → **Node.js**
2. Seleccionar versión Node.js 18 o superior
3. Punto de entrada: `app.js`
4. Variables de entorno: agregar las del `.env` desde la interfaz
5. Hacer clic en **Reiniciar aplicación**

### Configuración de dominio y HTTPS

- En hPanel → **Dominios** → apuntar al directorio del proyecto
- Activar **SSL/HTTPS** gratuito (Let's Encrypt) desde hPanel
- Una vez con HTTPS, cambiar en `.env`: `NODE_ENV=production`
  - Esto activa las cookies seguras (`Secure: true`)

### Persistencia de imágenes subidas

Las imágenes se guardan en `public/uploads/`. En un VPS estándar no hay problema. Si usas un servicio con file system efímero (como algunos PaaS), considera migrar a almacenamiento externo (ver sección Futuros pasos).

---

## Consideraciones de seguridad

### Ya implementado

- ✅ **Helmet**: headers HTTP seguros (CSP, HSTS, XSS protection)
- ✅ **bcrypt** con factor de coste 12 para contraseñas
- ✅ **Rate limiting** en `/auth/login` (10 intentos / 15 min por IP)
- ✅ **express-validator**: validación y sanitización de inputs
- ✅ **Roles**: middleware `isAuth` e `isAdmin` en todas las rutas protegidas
- ✅ **Sesiones httpOnly** para evitar acceso JS a la cookie
- ✅ **Cookies `Secure`** en producción (`NODE_ENV=production`)
- ✅ **Ownership check**: los productos solo pueden editarse por su propietario
- ✅ **Multer**: filtro de tipos de archivo y límite de tamaño

### A implementar antes de producción seria

- [ ] **CSRF protection**: instalar `csurf` o implementar double-submit cookie
  ```bash
  npm install csurf
  ```
- [ ] **Sanitización HTML**: usar `DOMPurify` o `sanitize-html` en campos de texto
  ```bash
  npm install sanitize-html
  ```
- [ ] **Rotación de SESSION_SECRET**: usar valor largo y aleatorio en producción
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] **Logs de auditoría**: registrar eventos de seguridad (login fallido, etc.)
- [ ] **Backup automático** del archivo `devisistore.db`
- [ ] Revisar permisos del directorio `public/uploads/` (solo escritura del proceso Node)

---

## Futuros pasos y mejoras

### 🔷 Prioridad Alta (funcionalidad core)

#### 1. Almacenamiento de imágenes en la nube
Actualmente las imágenes se guardan localmente. Para producción real se recomienda usar un servicio externo:

```bash
npm install @aws-sdk/client-s3  # Amazon S3
# o
npm install cloudinary          # Cloudinary (más sencillo)
```

En `dashboardRoutes.js`, reemplazar el `diskStorage` de Multer por `memoryStorage` y subir el buffer al servicio externo en el controlador.

#### 2. Migrar de SQLite a PostgreSQL
Para múltiples usuarios concurrentes, SQLite puede tener problemas de escritura simultánea.

```bash
npm install pg               # Driver de PostgreSQL
npm install knex             # Query builder (opcional pero recomendado)
```

Cambiar `config/database.js` para conectar con Knex/pg en lugar de `better-sqlite3`. Los modelos apenas necesitarían cambios si usas el mismo patrón de queries.

#### 3. Protección CSRF
```bash
npm install csurf
```
Agregar el middleware en `app.js` y pasar `csrfToken()` a cada formulario de las vistas.

---

### 🔶 Prioridad Media (experiencia de usuario)

#### 4. Dominio propio para cada negocio (subdominio)
Permite que cada negocio acceda con `micafeteria.tucatalogo.com` en vez de `tucatalogo.com/shop/micafeteria`.

Requiere:
- DNS wildcard `*.tucatalogo.com` apuntando al servidor
- Middleware en Express que detecte el subdominio y cargue el negocio correspondiente

```javascript
// middleware de subdominio
app.use((req, res, next) => {
  const host = req.hostname; // ej: micafeteria.tucatalogo.com
  const parts = host.split('.');
  if (parts.length > 2) {
    req.businessSlug = parts[0];
  }
  next();
});
```

#### 5. Galería de múltiples imágenes por producto
Agregar tabla `product_images` con `product_id` y `url`.
Usar Multer con `upload.array('images', 5)` para múltiples archivos.

#### 6. Categorías con ícono y color
Crear tabla `categories` con nombre, color y emoji/icono.
Agregar CRUD en el dashboard.

#### 7. Importación masiva de productos (CSV/Excel)
```bash
npm install papaparse xlsx
```
Agregar ruta `POST /dashboard/products/import` que procese el archivo y cree los productos en lote.

---

### 🔷 Mejoras de UX / Diseño

#### 8. Modo oscuro
Tailwind soporta modo oscuro con la clase `dark:`. Agregar `darkMode: 'class'` en la config de Tailwind y un toggle en la navbar.

#### 9. Vista previa del catálogo en tiempo real
En el dashboard, mostrar un iframe o una ventana emergente con cómo se ve el catálogo público al mismo tiempo que se edita.

#### 10. Compresión automática de imágenes
```bash
npm install sharp
```
En el controlador, procesar la imagen con Sharp antes de guardarla:
```javascript
await sharp(req.file.buffer)
  .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 80 })
  .toFile(outputPath);
```

---

### 🚀 Expansión a SaaS

#### 11. Planes de pago (Freemium → Pro)
Agregar campo `plan` en la tabla `users` (`free | pro | enterprise`).
Limitar el plan `free` a N productos o N negocios.
Integrar pasarela de pago:

```bash
npm install stripe
```

Flujo:
1. Usuario selecciona plan → redirigir a Stripe Checkout
2. Webhook de Stripe actualiza el campo `plan` del usuario
3. Middleware verifica el plan antes de permitir crear más productos

#### 12. Sistema de pedidos
Agregar tabla `orders`:
```sql
CREATE TABLE orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER REFERENCES businesses(id),
  customer_name TEXT,
  customer_phone TEXT,
  items       TEXT,  -- JSON con productos y cantidades
  total       REAL,
  status      TEXT DEFAULT 'pending',
  created_at  TEXT DEFAULT (datetime('now'))
);
```
Los clientes pueden hacer pedidos desde el catálogo y el negocio los ve en su dashboard.

#### 13. Notificaciones por email
```bash
npm install nodemailer
```
Enviar email cuando:
- Un usuario se registra (bienvenida)
- Un admin genera una clave (enviarla por email)
- Se recibe un pedido (si se implementa el sistema de pedidos)

#### 14. Analytics básico
Tabla `page_views` para contar visitas por catálogo:
```sql
CREATE TABLE page_views (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER REFERENCES businesses(id),
  ip_hash     TEXT,
  visited_at  TEXT DEFAULT (datetime('now'))
);
```
Mostrar en el dashboard: "Tu catálogo tuvo X visitas este mes."

#### 15. API REST pública
Exponer los productos de un negocio en JSON para integraciones externas:
```
GET /api/v1/shop/:slug/products
GET /api/v1/shop/:slug/products/:id
```
Autenticar con API key por negocio.

---

## Preguntas frecuentes

**¿Puedo usar MySQL o PostgreSQL en lugar de SQLite?**
Sí. `better-sqlite3` es síncrono y muy simple. Para migrar, reemplaza `config/database.js` con una conexión a tu base de datos y adapta los modelos para usar queries asíncronas (async/await con `pg` o `mysql2`). Los modelos están aislados del resto de la app, por lo que el impacto es mínimo.

**¿Qué pasa si un usuario sube una imagen maliciosa?**
Multer ya filtra por extensión. Para mayor seguridad, añade validación del tipo MIME real con el paquete `file-type`:
```bash
npm install file-type
```

**¿Las imágenes se pierden al reiniciar el servidor?**
En un VPS normal, no. Las imágenes están en `public/uploads/` que es persistente. En servicios PaaS con file system efímero (Heroku, Railway), sí se pierden. Usa almacenamiento en la nube para esos casos.

**¿Cómo cambio el nombre de la plataforma?**
Busca `DevisiStore` en `views/` y `app.js`. También puedes agregar una variable `APP_NAME` en `.env` y leerla desde `app.js` (`res.locals.appName`).

**¿Puedo permitir que los negocios tengan múltiples usuarios?**
Actualmente un usuario = un negocio. Para soportar equipos, agrega una tabla `business_members` con `(business_id, user_id, role)` y actualiza los middlewares de ownership.

---

## Licencia

MIT — libre para uso personal y comercial.

---

*Desarrollado con ❤️ usando Node.js, Express y TailwindCSS.*
