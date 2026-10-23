# IV Concurso de Proyectos de Innovación y Emprendimiento 2026
**Centro de Educación Alternativa «Prof. Herman Ortiz Camargo»**  
**Carrera Técnica Superior en Sistemas Informáticos • Pailón, Santa Cruz, Bolivia**

Sistema informático oficial para la calificación, tabulación y emisión del Acta Oficial de Premiación para los **7 Stands** y **3 Jurados Calificadores**.

---

## 📁 Estructura del Repositorio para GitHub y Render

```text
concurso-de-proyectos/
├── frontend/                     # Aplicación Web (HTML5, TailwindCSS, JavaScript)
│   ├── index.html                # Interfaz principal (Público, Jurados, Administrador)
│   ├── css/styles.css            # Estilos personalizados y reglas de impresión A4/Carta
│   ├── js/
│   │   ├── api.js                # Cliente API (Modo LocalStorage o Modo Cloud Render)
│   │   ├── app.js                # Lógica del concurso, validaciones y generadores
│   │   └── report_assets.js      # Logos institucionales en Base64 autónomo
│   ├── images/                   # Fotografías de los 7 stands y logos oficiales
│   └── Manual_de_Uso_...docx     # Manual oficial de uso en Word descargable
│
├── backend/                      # Servicio API REST para Render y Neon PostgreSQL
│   ├── server.js                 # Servidor Express.js con CORS y endpoints REST
│   ├── db.js                     # Pool de conexión a Neon PostgreSQL con SSL
│   ├── schema.sql                # Script DDL de creación de tablas y datos semilla
│   ├── package.json              # Dependencias (express, pg, cors, dotenv)
│   ├── .env.example              # Plantilla de variables de entorno (DATABASE_URL)
│   └── scripts/init-db.js        # Script de inicialización de tablas en Neon
│
├── render.yaml                   # Configuración de despliegue automático en Render
├── .gitignore                    # Excluye node_modules y archivos temporales
└── README.md                     # Guía completa de uso y despliegue
```

---

## 👥 Roles y Credenciales Oficiales

| Rol | Usuario | Contraseña | Permisos y Funciones |
| :--- | :--- | :--- | :--- |
| **Público General** | *(Libre)* | *(Libre)* | Acceso directo a los 7 proyectos. Visualiza la Nota Centralizada en vivo de los 3 jurados y el Podio oficial al publicarse. |
| **Jurado 1** | `jurado1` | `sistemas1` | Califica los 7 stands. Al guardar, su hoja se sella automáticamente con candado y no puede ser modificada por el jurado. |
| **Jurado 2** | `jurado2` | `sistemas2` | Califica los 7 stands. Al guardar, su hoja se sella automáticamente con candado y no puede ser modificada por el jurado. |
| **Jurado 3** | `jurado3` | `sistemas3` | Califica los 7 stands. Al guardar, su hoja se sella automáticamente con candado y no puede ser modificada por el jurado. |
| **Administrador** | `admin` | `sistemas` | Control total: Modifica notas si hay error, pone a cero hojas individuales, pone a cero todo para reiniciar, dirime desempates y oficializa resultados. |

---

## 🚀 Guía de Despliegue Paso a Paso (GitHub + Render + Neon)

### Paso 1: Crear la Base de Datos en Neon (PostgreSQL Gratuito)
1. Ingresa a [https://neon.tech](https://neon.tech) e inicia sesión con GitHub o Google.
2. Crea un nuevo proyecto llamado `concurso-proyectos-2026`.
3. En la sección **Dashboard**, copia tu cadena de conexión (**Connection String**). Se verá así:  
   `postgresql://neondb_owner:tu_password@ep-cool-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. En la pestaña **SQL Editor** de Neon, pega el contenido del archivo `backend/schema.sql` y presiona **Run**. Esto creará todas las tablas y stands iniciales.

---

### Paso 2: Subir el Repositorio a GitHub
Abre la terminal en la carpeta principal `D:\concurso de proyectos` y ejecuta:

```bash
git init
git add .
git commit -m "Sistema oficial de concurso de proyectos 2026"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/concurso-de-proyectos.git
git push -u origin main
```

---

### Paso 3: Desplegar el Backend en Render
1. Ingresa a [https://render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio `concurso-de-proyectos`.
4. Render detectará automáticamente la configuración o puedes completarla así:
   - **Name:** `concurso-sistemas-api`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** `Free`
5. En la sección **Environment Variables**, agrega:
   - `DATABASE_URL` = *(Pega aquí la cadena de conexión que copiaste de Neon)*
6. Haz clic en **Deploy Web Service**.
7. Una vez desplegado, Render te dará una URL pública, por ejemplo:  
   `https://concurso-sistemas-api.onrender.com`

---

### Paso 4: Conectar el Frontend al Backend de Render
1. Abre el archivo `frontend/js/api.js`.
2. En las primeras líneas (`API_CONFIG`), cambia:
   ```javascript
   const API_CONFIG = {
     USE_BACKEND: true, // Cambia de false a true
     BASE_URL: 'https://concurso-sistemas-api.onrender.com/api', // Tu URL de Render
     // ...
   };
   ```
3. Guarda el cambio y haz commit a GitHub:
   ```bash
   git add frontend/js/api.js
   git commit -m "Conectar frontend a Render API"
   git push
   ```

---

### Paso 5: Publicar el Frontend Gratis (GitHub Pages)
1. En tu repositorio de GitHub, ve a **Settings** > **Pages**.
2. En **Source**, selecciona `Deploy from a branch`.
3. Selecciona la rama `main` y la carpeta `/frontend` (o `/root` si prefieres).
4. Haz clic en **Save**. En 1 minuto tendrás tu enlace web público listo para compartir con los jurados mediante código QR.

---

## 🏆 Premiación Oficial (Podio de Ganadores)
* **1.º Gran Campeón:** Bs. 500 en efectivo + Trofeo Institucional + Certificado de Honor.
* **2.º Lugar de Honor:** Bs. 300 en efectivo + Medalla de Plata + Certificado de Honor.
* **3.º Lugar de Honor:** Bs. 150 en efectivo + Medalla de Bronce + Certificado de Honor.
