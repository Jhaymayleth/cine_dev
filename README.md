<div align="center">

<br/>

```text
███╗   ███╗██╗███╗   ██╗███████╗██████╗  ██████╗ ██╗   ██╗ █████╗ ██╗
████╗ ████║██║████╗  ██║██╔════╝██╔══██╗██╔═══██╗╚██╗ ██╔╝██╔══██╗██║
██╔████╔██║██║██╔██╗ ██║█████╗  ██████╔╝██║   ██║ ╚████╔╝ ███████║██║
██║╚██╔╝██║██║██║╚██╗██║██╔══╝  ██╔══██╗██║   ██║  ╚██╔╝  ██╔══██║██║
██║ ╚═╝ ██║██║██║ ╚████║███████╗██║  ██║╚██████╔╝   ██║   ██║  ██║██║
╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝
```

**Plataforma digital para vivir y reservar experiencias de cine**

<br/>

[![Status](https://img.shields.io/badge/status-en%20desarrollo-orange?style=for-the-badge)](https://github.com/Jhaymayleth/cine_dev)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Language](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![API](https://img.shields.io/badge/API-Postman%20Mock%20Server-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](https://www.postman.com/)

<br/>

</div>

---

## Descripcion

**MineRoyal** es una plataforma web para descubrir peliculas, consultar la cartelera y preparar la compra de entradas de cine.

El proyecto esta organizado como un sistema full stack escalable, con un frontend moderno y una base backend modular preparada para implementar progresivamente los casos de uso del negocio.

> [!NOTE]
> Durante la etapa actual, el frontend consume endpoints de un Mock Server de Postman. El backend propio se encuentra estructurado y preparado para reemplazar el mock cuando el contrato API este definido y validado.

---

## Tabla de contenidos

- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Stack tecnologico](#stack-tecnologico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo de negocio](#flujo-de-negocio)
- [Seguridad](#seguridad)
- [Instalacion](#instalacion)
- [Roadmap](#roadmap)
- [Documentacion](#documentacion)
- [Autor](#autor)

---

## Funcionalidades

<table>
<tr>
<td width="50%">

### Experiencia cinematografica

- Landing page con identidad visual de MineRoyal
- Cartelera de peliculas
- Busqueda por titulo
- Filtros por genero y clasificacion
- Peliculas destacadas
- Proximos estrenos
- Detalle de pelicula
- Trailers y sinopsis
- Seleccion de ubicacion, ciudad y sede
- Consulta de funciones, fechas y formatos

</td>
<td width="50%">

### Cuenta y compra

- Registro de usuarios
- Inicio de sesion
- Persistencia de sesion
- Perfil protegido
- Promociones
- Membresia y beneficios
- Seleccion de asientos, prevista en el backend
- Carrito y confiteria, previstos en el backend
- Ordenes, pagos y tickets QR, previstos en el backend

**Roles previstos**

| Rol | Descripcion |
|---|---|
| Cliente | Consulta cartelera y compra entradas |
| Personal | Gestion operativa del cine |
| Administrador | Control del catalogo y la plataforma |

</td>
</tr>
</table>

---

## Arquitectura

```text
                         ┌─────────────────────────┐
                         │        MINEROYAL         │
                         │ Plataforma de cine       │
                         └────────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │       Frontend           │
                         │   Next.js + TypeScript   │
                         │   App Router + Tailwind  │
                         └────────────┬────────────┘
                                      │ REST API
                         ┌────────────▼────────────┐
                         │   Postman Mock Server    │
                         │      Desarrollo actual   │
                         └────────────┬────────────┘
                                      │ Integracion futura
                         ┌────────────▼────────────┐
                         │       Backend API        │
                         │ Node.js + Express + TS   │
                         └────────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │       PostgreSQL         │
                         │       Sequelize ORM      │
                         └─────────────────────────┘
```

La separacion permite desarrollar la experiencia del usuario y el dominio del negocio de forma independiente, manteniendo un contrato API comun.

---

## Stack tecnologico

| Capa | Tecnologias |
|---|---|
| Frontend | Next.js, React, TypeScript, App Router, Tailwind CSS |
| Estado y datos | TanStack Query, Zustand, Axios |
| Formularios | React Hook Form, Zod |
| Backend | Node.js, Express, TypeScript |
| Persistencia | PostgreSQL, Sequelize |
| Seguridad | JWT, cookies HTTP-only, bcrypt, CORS |
| Calidad | Jest, TypeScript, ESLint |
| Operaciones | Docker Compose, OpenAPI |

---

## Estructura del proyecto

```text
MINEROYAL/
│
├── multicine-frontend-jose/       # Aplicacion Next.js
│   ├── app/                       # App Router y layouts
│   ├── src/components/            # Componentes reutilizables
│   ├── src/features/              # Modulos de experiencia de usuario
│   ├── src/services/              # Clientes de API
│   ├── src/routes/                # Router legacy en migracion progresiva
│   ├── src/store/                 # Estado global
│   └── src/validations/           # Validacion de formularios
│
├── multicine-backend-jose/        # Backend modular preparado
│   ├── src/core/                  # Infraestructura transversal
│   ├── src/modules/               # Dominios de negocio
│   ├── src/models/                # Modelos Sequelize
│   ├── src/database/              # Inicializacion, migraciones y seeders
│   ├── src/routes/                # Composicion de rutas
│   ├── tests/                     # Pruebas y fixtures
│   └── docs/                      # Arquitectura y contratos
│
├── docs/                          # Documentacion general
└── README.md
```

### Dominios del backend

```text
auth · users · locations · catalog · scheduling · booking
checkout · payments · tickets · promotions · memberships
notifications · admin
```

Cada dominio esta preparado para crecer con sus propias rutas, controladores, servicios, repositorios, tipos y contratos.

---

## Flujo de negocio

```text
Seleccionar ubicacion
        ↓
Consultar cartelera
        ↓
Elegir pelicula
        ↓
Elegir fecha y funcion
        ↓
Seleccionar asientos
        ↓
Bloquear asientos temporalmente
        ↓
Revisar carrito y promociones
        ↓
Procesar pago
        ↓
Crear orden y tickets QR
        ↓
Consultar confirmacion e historial
```

El frontend actual cubre principalmente la experiencia de descubrimiento, ubicacion, cartelera y detalle. El Mock Server de Postman permanece como fuente de datos mientras se construye el backend propio.

---

## Seguridad

> [!WARNING]
> Nunca subas archivos `.env`, claves JWT, credenciales ni tokens al repositorio.

- Variables publicas del frontend mediante `NEXT_PUBLIC_*`.
- Validacion de formularios con Zod.
- JWT y cookies HTTP-only para sesiones.
- bcrypt para contrasenas.
- CORS configurado por entorno.
- Precios y disponibilidad validados en el servidor.
- Bloqueo temporal de asientos antes de confirmar una compra.
- Pagos reales delegados a un proveedor especializado.

---

## Instalacion

### Requisitos previos

- Node.js >= 20
- npm >= 10
- Docker y Docker Compose, opcionales para PostgreSQL

### Clonar el repositorio

```bash
git clone https://github.com/Jhaymayleth/cine_dev.git
cd cine_dev
```

### Frontend

```bash
cd multicine-frontend-jose
npm install
cp .env.example .env.local
npm run dev
```

El frontend se ejecuta con Next.js. Durante esta etapa debe continuar usando el Mock Server de Postman:

```env
NEXT_PUBLIC_API_URL=https://33dfb5ad-947a-4c04-a41b-eb42ed5ee8f5.mock.pstmn.io
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_APP_NAME=Multicine
```

Comandos principales:

```bash
npm run dev
npm run typecheck
npm run build
npm run start
npm run lint
```

### Backend

El backend propio es una estructura modular en preparacion y no reemplaza aun la API mock utilizada por el frontend.

```bash
cd multicine-backend-jose
npm install
cp .env.example .env
npm run build
npm run dev
```

Para iniciar PostgreSQL:

```bash
docker compose --env-file .env up -d
```

---

## Documentacion

- [Arquitectura del backend](multicine-backend-jose/docs/ARCHITECTURE.md)
- [Contrato inicial de la API](multicine-backend-jose/docs/API-CONTRACT.md)
- [Migracion del frontend a Next.js](multicine-frontend-jose/README-NEXT.md)
- [Documentacion del backend](multicine-backend-jose/README.md)

---

## Roadmap

### Fase 1 — Fundacion

- [x] Separacion de frontend y backend
- [x] Migracion de la copia frontend a Next.js
- [x] Arquitectura modular del backend
- [x] Configuracion del entorno de desarrollo
- [x] Contrato inicial de integracion

### Fase 2 — Experiencia de cartelera

- [x] Seleccion inicial de ubicacion
- [x] Landing cinematografica
- [x] Cartelera y filtros visuales
- [x] Detalle de pelicula
- [ ] Migracion completa de rutas a App Router
- [ ] Consumo estable de cartelera desde el contrato definitivo

### Fase 3 — Compra de entradas

- [ ] Funciones reales por cine, fecha y formato
- [ ] Mapa de asientos
- [ ] Bloqueo temporal de asientos
- [ ] Carrito y confiteria
- [ ] Promociones aplicadas al total
- [ ] Checkout

### Fase 4 — Operacion y pagos

- [ ] Integracion con proveedor de pagos
- [ ] Generacion de tickets QR
- [ ] Historial de compras
- [ ] Membresia y puntos
- [ ] Notificaciones
- [ ] Panel administrativo

### Fase 5 — Calidad y despliegue

- [ ] Pruebas unitarias y de integracion
- [ ] Pruebas end-to-end
- [ ] Observabilidad y logs
- [ ] CI/CD
- [ ] Despliegue de frontend y backend

---

## Convenciones de trabajo

- Mantener frontend y backend como aplicaciones independientes.
- No cambiar el Mock Server hasta cerrar el contrato de integracion.
- Implementar cada caso de uso dentro de su dominio.
- Mantener la logica de negocio en servicios y no en controladores.
- No versionar secretos ni archivos de entorno locales.
- Ejecutar `typecheck`, `build` y pruebas antes de integrar cambios.
- Usar Conventional Commits y Pull Requests.

---

## Autor

<div align="center">

**Jose Mauricio Rangel Nunez**

Proyecto de desarrollo de software full stack y portafolio personal.

[![GitHub](https://img.shields.io/badge/GitHub-Jhaymayleth-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Jhaymayleth)

<br/>

*Proyecto educativo y de portafolio.*

</div>
