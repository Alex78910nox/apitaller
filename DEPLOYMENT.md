# 🚀 Guía de Despliegue - Sistema QR Habitech

## 📋 Checklist Pre-Despliegue

### ✅ Archivos Verificados para Producción

- [x] **escaner-qr.html** - URL de API dinámica (detecta automáticamente local/producción)
- [x] **servidor.js** - Enlaces relativos funcionan en cualquier dominio
- [x] **qrController.js** - Endpoints funcionan con rutas relativas
- [x] **Dependencias** - `qrcode` y `jsonwebtoken` instalados

---

## 🌐 URLs Dinámicas

### **Detección Automática en `escaner-qr.html`:**

```javascript
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'     // Desarrollo
    : window.location.origin;      // Producción
```

### **Funcionamiento:**

| Entorno | Hostname | API_URL |
|---------|----------|---------|
| Local | `localhost:3000` | `http://localhost:3000` |
| Render | `tu-app.onrender.com` | `https://tu-app.onrender.com` |

---

## 🔧 Variables de Entorno en Render

Asegúrate de tener estas variables configuradas en Render:

```env
# Base de datos
DATABASE_URL=postgresql://neondb_owner:...

# Email (Brevo)
BREVO_API_KEY=xkeysib-...
BREVO_FROM_EMAIL=alexsapereyra@gmail.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Puerto (Render lo asigna automáticamente)
PORT=3000
```

---

## 📱 Endpoints del Sistema QR

### **Todos funcionan con rutas relativas:**

```
POST   /api/qr/generar          - Genera QR permanente
GET    /api/qr/usuario/:id      - Obtiene QR del usuario
POST   /api/qr/validar          - Valida QR y registra acceso
DELETE /api/qr/desactivar/:id   - Desactiva QR
GET    /api/qr/historial/:id    - Historial de accesos
```

---

## 🧪 Pruebas Pre-Despliegue

### **1. Probar localmente:**
```bash
node servidor.js
```
Abrir: `http://localhost:3000/public/escaner-qr.html`

### **2. Verificar que funcione:**
- ✅ Escáner QR carga correctamente
- ✅ Puede generar QR
- ✅ Puede validar QR
- ✅ Registra en base de datos

---

## 🚀 Desplegar a Render

### **Paso 1: Commit y Push**
```bash
git add .
git commit -m "Sistema QR completo con URLs dinámicas para producción"
git push origin master
```

### **Paso 2: Render detecta los cambios**
- Se despliega automáticamente
- Instala dependencias (`npm install`)
- Ejecuta `npm start` o `node servidor.js`

### **Paso 3: Verificar en Producción**
```
https://tu-app.onrender.com/public/escaner-qr.html
```

---

## 🔐 Seguridad en Producción

### **CORS está habilitado:**
```javascript
app.use(cors()); // Permite peticiones desde cualquier origen
```

### **Archivos estáticos servidos:**
```javascript
app.use('/public', express.static('public'));
```

---

## 📊 Monitoreo Post-Despliegue

### **Verificar:**
1. ✅ Escáner QR carga sin errores de CORS
2. ✅ Librería jsQR carga desde CDN
3. ✅ API responde a `/api/qr/generar`
4. ✅ API responde a `/api/qr/validar`
5. ✅ Registros se guardan en base de datos Neon

### **Logs útiles:**
```javascript
console.log('🌐 API URL detectada:', API_URL); // En consola del navegador
```

---

## 🐛 Troubleshooting

### **Error: Cannot GET /public/escaner-qr.html**
**Solución:** Verificar que exista:
```javascript
app.use('/public', express.static('public'));
```

### **Error: API URL undefined**
**Solución:** La detección automática en escaner-qr.html funciona así:
```javascript
window.location.origin // En Render será https://tu-app.onrender.com
```

### **Error: CORS blocked**
**Solución:** Verificar que `app.use(cors())` esté antes de las rutas.

---

## 🎯 URLs Finales

### **Producción (después de desplegar):**
- Landing: `https://tu-app.onrender.com`
- Escáner: `https://tu-app.onrender.com/public/escaner-qr.html`
- API: `https://tu-app.onrender.com/api/qr/*`

### **App Móvil (React Native):**
```javascript
const API_URL = 'https://tu-app.onrender.com';
```

---

## ✅ Sistema Listo para Producción

Todo está configurado para funcionar automáticamente en:
- ✅ Desarrollo local (localhost:3000)
- ✅ Producción Render (https://*.onrender.com)
- ✅ Cualquier otro dominio

**No necesitas cambiar nada manualmente cuando despliegues.**
