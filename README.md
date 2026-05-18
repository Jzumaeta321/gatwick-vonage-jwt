# Gatwick Vonage JWT Server

Servidor Express que genera tokens JWT para Vonage Voice API y realiza llamadas de emergencia.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/api/vonage/generate-jwt` | Genera un JWT válido |
| GET | `/api/vonage/ncco` | Retorna el mensaje de emergencia (NCCO) |
| GET | `/api/vonage/test-call?to=NUMERO` | Llamada de prueba |
| POST | `/api/vonage/call` | Llamada desde n8n (body JSON) |

---

## Deploy en Vercel (Recomendado)

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Clonar/copiar el proyecto y entrar a la carpeta
```bash
cd llamadas-Gatwick
```

### 3. Desplegar
```bash
vercel
```

### 4. Configurar variables de entorno en Vercel
En el dashboard de Vercel → tu proyecto → Settings → Environment Variables:

```
VONAGE_API_KEY=d82b5d9b
VONAGE_API_SECRET=9L4UhlHJEuBqDsMR
VONAGE_NUMBER=12015471160
ALLOWED_ORIGINS=*
```

### 5. Redesplegar para aplicar variables
```bash
vercel --prod
```

---

## Deploy en Railway

### 1. Crear proyecto en railway.app
- New Project → Deploy from GitHub repo (o subir carpeta)

### 2. Agregar variables de entorno en Railway
En tu servicio → Variables:
```
VONAGE_API_KEY=d82b5d9b
VONAGE_API_SECRET=9L4UhlHJEuBqDsMR
VONAGE_NUMBER=12015471160
ALLOWED_ORIGINS=*
```

Railway detecta automáticamente Node.js y usa `npm start`.

---

## Pruebas con curl

### Generar JWT
```bash
curl -X POST https://tu-servidor.vercel.app/api/vonage/generate-jwt
```

### Ver NCCO
```bash
curl https://tu-servidor.vercel.app/api/vonage/ncco
```

### Llamada de prueba
```bash
curl "https://tu-servidor.vercel.app/api/vonage/test-call?to=51972619000"
```

### Llamada desde n8n (HTTP Request node)
```
Method: POST
URL: https://tu-servidor.vercel.app/api/vonage/call
Body (JSON):
{
  "to": "51972619000"
}
```

---

## Uso desde n8n

En n8n usa el nodo **HTTP Request**:

**Para generar JWT:**
- Method: `POST`
- URL: `https://tu-servidor.vercel.app/api/vonage/generate-jwt`
- Response: `{ "jwt": "eyJ..." }`

**Para hacer una llamada directa:**
- Method: `POST`
- URL: `https://tu-servidor.vercel.app/api/vonage/call`
- Body (JSON): `{ "to": "{{ $json.numero_destino }}" }`

---

## Instalación local

```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm run dev
```
