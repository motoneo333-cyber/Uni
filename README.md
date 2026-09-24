# Kine Study

App privada de repetición espaciada (SM-2) para estudiar en casa, organizada
según el plan de estudios 2025 de la Licenciatura en Kinesiología y Fisiatría
(UNAHUR). Ya viene precargada con las 41 materias del plan + Actividades
Curriculares Acreditables, agrupadas por año y cuatrimestre.

## Cómo funciona

- Cada tarjeta (pregunta/respuesta) tiene su propio estado de repaso con el
  algoritmo **SM-2**: cuanto mejor la recordás, más se espacia el próximo repaso.
- En **Estudiar** las tarjetas vencidas de todas las materias se mezclan al
  azar (intercalado) en vez de ir en bloque por materia — ayuda a discriminar
  entre temas parecidos.
- **Materias** es donde cargás las tarjetas: una por una o pegando varias de
  golpe con el formato `pregunta | respuesta | tags(opcional)`, una por línea.
- Acceso protegido con una sola contraseña (pensada para un solo usuario).

## Stack

Next.js 16 (App Router) + Prisma 7 + PostgreSQL + Tailwind CSS. Sin backend
aparte: todo corre como funciones serverless en Vercel.

## Deploy en Vercel (una sola vez, para el año que viene)

### 1. Base de datos Postgres

Necesitás un Postgres accesible desde internet. Cualquiera de estas opciones
tiene plan gratuito y anda bien con Vercel:

- **[Neon](https://neon.tech)** (recomendado, es lo que usa "Vercel Postgres" por debajo)
- **[Supabase](https://supabase.com)**
- Vercel → tu proyecto → pestaña **Storage** → **Create Database** → Postgres (Neon)

Copiá la **cadena de conexión pooled** (con `?sslmode=require`, o en Supabase
usá el puerto `6543` de pgBouncer).

### 2. Subir el proyecto a Vercel

1. Empujá este repo a GitHub (ya está en la rama `claude/study-methods-career-a05dxe`; fusionala a `main` o importá esa rama directamente).
2. En [vercel.com/new](https://vercel.com/new), importá el repo.
3. En **Environment Variables** cargá:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | la cadena de conexión de Neon/Supabase |
   | `APP_PASSWORD` | la contraseña con la que vas a entrar a la app |
   | `APP_SECRET` | una cadena larga y random (`openssl rand -hex 32`) |

4. Deploy. Vercel corre `npm install` → `postinstall` genera el cliente de
   Prisma → `npm run build`.

### 3. Crear las tablas y cargar las materias

Con la `DATABASE_URL` de producción en tu `.env` local (o exportada en la
terminal), corré una sola vez desde tu máquina:

```bash
npm install
npm run db:push   # crea las tablas en la base de datos
npm run db:seed   # carga las 41 materias del plan + ACA
```

Listo — entrá a tu URL de Vercel, poné la contraseña y empezá a cargar
tarjetas por materia.

## Desarrollo local

```bash
cp .env.example .env   # completá DATABASE_URL, APP_PASSWORD, APP_SECRET
npm install
npm run db:push
npm run db:seed
npm run dev
```

Abrí `http://localhost:3000`.

## Formato de importación masiva

En la página de cada materia, "Importar varias de una vez" acepta texto con
una tarjeta por línea:

```
¿Qué es la biodisponibilidad? | Fracción de fármaco que llega inalterada a la circulación sistémica | farmacocinética
¿Qué es un agonista parcial? | Fármaco que activa el receptor con eficacia submáxima
```

El tercer campo (tags, separados por coma) es opcional.

## Notas

- `prisma/seed.ts` es **idempotente**: correrlo de nuevo no duplica materias
  ni tarjetas de ejemplo, así que es seguro volver a ejecutarlo si agregás
  materias nuevas al plan.
- El generador de Prisma queda en `app/generated/prisma` (ignorado por git,
  se regenera solo en cada `npm install`/`build`).
- Posible mejora futura: pasos de re-aprendizaje el mismo día para las
  tarjetas marcadas "De nuevo" (hoy vuelven a aparecer recién al día
  siguiente, como en SM-2 clásico).
