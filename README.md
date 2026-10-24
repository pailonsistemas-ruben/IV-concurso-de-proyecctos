# IV Concurso de Proyectos de Innovación y Emprendimiento 2026
**Centro de Educación Alternativa «Prof. Herman Ortiz Camargo»**  
**Carrera de Sistemas Informáticos • Pailón, Santa Cruz, Bolivia**

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

## 👥 Manual de Usuario y Asignación de Roles

> [!IMPORTANT]
> **Política de Seguridad y Confidencialidad de Credenciales:**  
> Por motivos de transparencia, integridad y estricta seguridad del concurso, **no se publican usuarios ni contraseñas** en esta documentación. Las credenciales de acceso para cada rol (**Jurado 1, Jurado 2, Jurado 3** y **Administrador**) serán asignadas e informadas de manera personal, privada y directa por la **Comisión Organizadora y Dirección del CEA** a cada responsable antes del inicio de la jornada de evaluación.

---

### 1. Rol Público / Estudiantes / Asistentes Generales
* **Acceso:** Libre y directo desde cualquier dispositivo (teléfono, tablet o computadora) mediante enlace web o escaneo de código QR, sin necesidad de iniciar sesión.
* **Funcionalidades:**
  1. **Galería de Stands:** Exploración visual y técnica de los 7 stands participantes (fotografía, título del proyecto, modalidad y nómina de integrantes).
  2. **Detalle del Proyecto:** Al hacer clic en un stand, se despliega la descripción completa del proyecto y la tabla de calificaciones individuales registradas por cada jurado.
  3. **Nota Centralizada en Vivo:** Monitoreo transparente del avance del concurso con el promedio general ponderado.
  4. **Podio Oficial de Premiación:** Una vez que la administración oficialice y publique los resultados, se activa el podio en la parte superior con los 3 proyectos galardonados (1.º Gran Campeón, 2.º Lugar y 3.º Lugar) junto a sus premios oficiales.
  5. **Hojas y Actas Públicas:** Posibilidad de abrir o descargar la Hoja Oficial de Calificación membretada de cualquier stand con su respectivo código QR institucional.

---

### 2. Rol Jurado Calificador (Jurado 1, Jurado 2, Jurado 3)
* **Acceso:** Inicia sesión con su rol asignado mediante el botón **"Ingresar"** en la barra superior. El sistema admite mayúsculas y minúsculas indistintamente para facilitar la digitación en teclados móviles.
* **Funcionalidades:**
  1. **Identificación Activa:** En el encabezado del sistema se confirma en todo momento el jurado autenticado (ej. *Jurado 1*, *Jurado 2* o *Jurado 3*).
  2. **Evaluación de los 7 Stands:** Al seleccionar un stand y presionar **"Calificar"**, se abre la Hoja de Evaluación Digital interactiva.
  3. **Rúbrica de 4 Criterios Oficiales (Total: 100 puntos):**
     * **Innovación y Creatividad (0 a 25 pts):** Originalidad de la propuesta y valor diferencial.
     * **Demostración Práctica y Funcionalidad (0 a 25 pts):** Funcionamiento en vivo del prototipo o servicio.
     * **Impacto y Relevancia en Pailón (0 a 25 pts):** Utilidad comunitaria y solución de problemas locales.
     * **Exposición y Defensa Técnica (0 a 25 pts):** Dominio temático, claridad y desenvolvimiento del equipo.
  4. **Puntuación Ágil:** Dispone de botones rápidos (+5, +10, +15, +20, +25) y cálculo automático inmediato del puntaje total.
  5. **Observaciones Técnicas:** Espacio de hasta dos líneas para sugerencias y devoluciones constructivas que figurarán en el acta.
  6. **Sellado Oficial de Seguridad:** Una vez que el jurado guarda su evaluación, la nota queda **SELLADA automáticamente con candado de seguridad**, impidiendo ediciones accidentales.
  7. **Impresión / Descarga Membretada:** El jurado puede descargar o imprimir la Hoja Oficial de Calificación en formato membretado con código QR y firmas.

---

### 3. Rol Administrador (Docente / Comisión Organizadora / Dirección)
* **Acceso:** Exclusivo para la administración del certamen mediante credenciales asignadas de alto nivel.
* **Funcionalidades:**
  1. **Panel de Consolidado y Tabulación General:** Vista centralizada con la matriz completa de los 7 stands evaluados por los 3 jurados, promedios en vivo y orden de mérito provisional.
  2. **Supervisión de Estados en Tiempo Real:** Monitor que alerta cuántos jurados faltan calificar cada stand y cuándo la tabulación ha sido completada al 100%.
  3. **Control y Auditoría de Notas:** Capacidad exclusiva de modificar notas justificadas si algún jurado cometió un error material de digitación, o reiniciar individualmente la hoja de un stand.
  4. **Detección Automática de Empates:** Alerta visual instantánea si dos o más stands obtienen el mismo promedio en los puestos de honor.
  5. **Resolución y Dirimición de Desempates:** Módulo oficial para establecer la posición definitiva registrando la cláusula fundamentada de desempate, la cual se plasma formalmente en el acta final.
  6. **Publicación Oficial de Resultados:** Control del botón para publicar el podio oficial a la vista de todo el público y participantes.
  7. **Generación del Acta Oficial de Premiación:**
     * Emisión en documento HTML/PDF membretado listo para impresión en tamaño Carta/A4.
     * Contiene el Cuadro de Honor (1.º, 2.º y 3.º puesto), la Matriz General de los 7 stands, la Cláusula de Fe Pública o Desempate, y las firmas oficiales de: **Jurado Calificador 1**, **Jurado Calificador 2**, **Jurado Calificador 3**, **Docente / Administrador** y **Director**.
  8. **Exportación de Datos:** Descarga de la matriz completa en formato CSV para respaldos de archivo y auditoría académica.

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
