# 🎩 Virtual Try-On con IA - Guía de Configuración

Tu proyecto Kingsley Caps ahora tiene una característica **única y diferente**: prueba virtual de gorras con análisis de IA.

## ✨ Qué hace

Los usuarios pueden:
1. **Subir una foto** de sí mismos
2. **Seleccionar una gorra** del catálogo
3. **Recibir un análisis detallado** de cómo se vería con esa gorra, incluyendo:
   - Descripción del usuario
   - Visualización estilizada con la gorra
   - Compatibilidad (excelente/buena/moderada)
   - Recomendaciones de accesorios complementarios
   - Probabilidad de que sea viral en redes sociales

## 🚀 Instalación y Configuración

### 1. Obtener API Key de Claude

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** en el panel de control
4. Crea una nueva API Key
5. Cópiala (será algo como `sk-ant-v7-...`)

### 2. Configurar Variables de Entorno

En el servidor (`server/.env`), agrega:

```env
ANTHROPIC_API_KEY=sk-ant-v7-TU_API_KEY_AQUI
```

**⚠️ IMPORTANTE**: Nunca commitees tu .env con la API Key. Git ya ignora `.env` por defecto.

### 3. Dependencias Instaladas

Las siguientes librerías ya están instaladas:
- `@anthropic-ai/sdk` - SDK de Claude
- `sharp` - Procesamiento de imágenes

### 4. Archivos Modificados

**Backend:**
- `server/src/services/aiService.js` - Nueva función `analyzeVirtualTryOn`
- `server/src/controllers/productController.js` - Nueva función `tryOn`
- `server/src/routes/productRoutes.js` - Nuevo endpoint `/api/products/:productId/try-on`

**Frontend:**
- `client/src/components/products/VirtualTryOn.jsx` - Nuevo componente React
- `client/src/pages/ProductDetail.jsx` - Integración del componente

## 📡 Endpoint API

### POST `/api/products/:productId/try-on`

**Headers:**
```
Authorization: Bearer [token]
Content-Type: multipart/form-data
```

**Parámetros:**
- `productId` - ID del producto (gorra)
- `userPhoto` - Archivo de imagen del usuario
- `capImage` - Archivo de imagen de la gorra

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "analysis": {
      "userDescription": "Usuario con tono de piel medio, cabello oscuro...",
      "styleWithCap": "Se vería genial con esta gorra, le daría un look casual pero sofisticado...",
      "compatibility": "excelente",
      "recommendations": [
        "Combina bien con jeans azul oscuro",
        "Perfecto para un look street style"
      ],
      "viralChance": "alto"
    },
    "message": "¡Análisis completado! Mira cómo se vería la gorra contigo."
  }
}
```

## 💻 Uso en la Interfaz

1. Navega a cualquier página de detalles de un producto (gorra)
2. Desplázate hacia abajo
3. Encontrarás la sección **"🎩 Prueba Virtual de la Gorra"**
4. Sube una foto tuya (JPG, PNG - máx 10MB)
5. Sube una imagen de la gorra (o deja que use la del producto)
6. Haz clic en **"✨ Ver Resultado"**
7. Espera a que Claude analice las imágenes (10-20 segundos)
8. ¡Mira el resultado!

## 🔍 Cómo Funciona Internamente

1. **Frontend**: Recolecta dos archivos (foto usuario + imagen gorra)
2. **Upload**: Envía ambas imágenes al servidor como multipart/form-data
3. **Backend**: 
   - Lee los archivos del servidor
   - Convierte a Base64
   - Envía a Claude Vision API con un prompt específico
4. **Claude Vision API**:
   - Analiza ambas imágenes
   - Genera un análisis detallado
   - Devuelve JSON con los resultados
5. **Frontend**: Muestra los resultados de forma bonita con animaciones

## 💰 Costos

Cada análisis usa:
- **Vision tokens** de Claude (~1000-2000 tokens por análisis)
- **Texto tokens** para la respuesta (~500-1000 tokens)

Con el plan gratuito de Anthropic tienes crédito limitado. Después necesitarás un plan de pago.

## 🎨 Personalización

### Cambiar el Prompt de Análisis

En `server/src/services/aiService.js`, busca la función `analyzeVirtualTryOn` y modifica el texto en:

```javascript
text: `Analiza estas dos imágenes:
...
[PUEDES CAMBIAR TODO ESTO]
...`
```

### Cambiar Estilos del Componente

En `client/src/components/products/VirtualTryOn.jsx`, todos los estilos son Tailwind CSS. Puedes cambiar colores, tamaños, etc.

### Cambiar Modelo de Claude

En `server/src/services/aiService.js`, cambia:

```javascript
model: 'claude-3-5-sonnet-20241022', // Cambia a otro modelo
```

Modelos disponibles:
- `claude-3-5-sonnet-20241022` (Recomendado - mejor balance)
- `claude-3-opus-20250219` (Más potente pero más caro)
- `claude-3-haiku-20250307` (Más rápido pero menos preciso)

## 🐛 Troubleshooting

### Error: "ANTHROPIC_API_KEY is not set"
- Verifica que tu `.env` tenga la variable configurada
- Reinicia el servidor después de agregar la variable

### Error: "Invalid image format"
- Asegúrate que las imágenes sean JPG o PNG válidas
- Intenta con imágenes más claras y de buen tamaño

### Error: "Timeout"
- El análisis tardó más de lo esperado
- Intenta con imágenes más pequeñas
- Verifica tu conexión a internet

### Análisis lento
- Es normal, Claude toma 10-20 segundos para analizar dos imágenes
- La latencia depende de tu conexión y carga de servidores

## 🚨 Consideraciones de Seguridad

1. **Las imágenes se guardan temporalmente** en el servidor
2. **Deberías agregar limpieza** de archivos temporales después de usarlos
3. **Validar que los usuarios no suban contenido ofensivo**
4. **Rate limiter** ya está configurado en el servidor

## 📈 Ideas para Expandir

1. **Guardar resultados**: Permitir que usuarios guarden sus pruebas virtuales
2. **Compartir en redes**: Generar imágenes de alta calidad para compartir
3. **Análisis de color**: Recomendar colores basados en el análisis
4. **Comparativa**: Probar múltiples gorras y compararlas
5. **AI Avatar**: Generar un avatar del usuario con la gorra

## ❓ Preguntas Frecuentes

**¿Mis fotos son privadas?**
- Sí, se procesan localmente en tu servidor y se envían a Claude solo durante el análisis
- Los archivos se guardan temporalmente en `server/uploads/`

**¿Puedo usarlo sin API Key?**
- No, necesitas una API Key válida de Anthropic

**¿Funciona sin internet?**
- No, necesita conexión para acceder a Claude Vision API

**¿Puedo compartir la API Key?**
- No, es confidencial. Si lo haces, desactívala inmediatamente en console.anthropic.com

---

¡Listo! Tu proyecto ahora tiene una característica de IA única que te diferencia de la competencia. 🚀
