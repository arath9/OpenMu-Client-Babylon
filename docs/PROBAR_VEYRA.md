# Instrucciones para probar Veyra - MU Legacy Evolution

## ¿Qué cambiamos hoy?

### 1. Veyra como personaje por defecto en producción
- **Antes:** Solo funcionaba con `?character=veira` (dev-only)
- **Ahora:** Veyra carga automáticamente sin flags, Classic es el fallback

### 2. No equipar Dragon cuando usas Veyra en offline
- **Problema:** Offline equipaba Dragon Armor por defecto
- **Solución:** Si `?character=veira|veyra`, no equipa Dragon → Veyra visible

### 3. Flag `?character=classic` funcionando
- **Antes:** Variable duplicada, nunca funcionó
- **Ahora:** Fallback correcto al personaje clásico en dev mode

---

## Cómo probar ahora

### Opción A: Modo Offline (sin servidor OpenMU)

```bash
# Desde tu terminal PowerShell/CMD
cd C:/Users/Andres/Documents/Codex/2026-10-24/bu/mu-online/OpenMu-Client-Babylon
bun run dev
```

**Luego abre en navegador:**

| URL | Qué ves |
|-----|---------|
| `http://localhost:5173/offline` | **Veyra sin armor** (cuerpo base negro/obsidiana, torso/límbicos) |
| `http://localhost:5173/offline?character=veira` | Veyra completa con armor turquesa |
| `http://localhost:5173/offline?character=classic` | Personaje MU Classic (fallback) |
| `http://localhost:5173/offline?bare` | Veyra sin Dragon Armor, solo cuerpo base |

### Opción B: Modo con servidor OpenMU

Si tienes el server corriendo en puerto 55900:

```bash
# Levanta proxy (en otra terminal)
cd C:/Users/Andres/Documents/Codex/2026-10-24/bu/mu-online/OpenMu-Client-Babylon
bun run proxy
```

**Luego abre en navegador:**

| URL | Qué ves |
|-----|---------|
| `http://localhost:5173/` | Veyra por defecto conectado al server |
| `http://localhost:5173/?character=classic` | Classic si prefieres comparar |

---

## ¿Qué debes ver?

### Personaje Veyra (por defecto)
- **Apariencia:** Armadura segmentada negra/obsidiana con acentos turquesa
- **Partes:** Head, torso, limbs, armor, boots, gloves (5 partes modulares)
- **Sockets:** Weapon1, Weapon2, Wings disponibles para equipar

### Personaje Classic (con `?character=classic`)
- Apariencia original de MU Online Season 6
- Mismo rig y sockets, diferente geometría/materiales

---

## Verificación de assets

Los archivos generados están en:
```
public/game-assets/Custom/veyra_*.glb
- veyra_head.glb (60 KB)
- veyra_armor.glb (98 KB)
- veyra_body.glb (8.7 MB - rig completo con animaciones)
- veyra_boots.glb (76 KB)
- veyra_gloves.glb (76 KB)
- veyra_pants.glb (54 KB)
```

---

## Solución de problemas

### Si NO ves Veyra:
1. **Hard refresh:** `Ctrl+F5` o `Cmd+Shift+R`
2. **Clear cache:** Open DevTools → Network tab → Check "Disable cache"
3. **Reiniciar server:** Detén y vuelve a ejecutar `bun run dev`

### Si ves Dragon Armor en su lugar:
1. Usa `?character=veira` explícitamente
2. O usa `?bare` para no equipar nada
3. Reinicia completamente (el estado persiste en sesión)

---

## Próximos pasos (Fase 4 - Equipamiento Original)

Una vez validado el personaje, podemos implementar:
- Espadas/armaduras originales con efectos visuales
- Sistema de mejoras progresivas (+10, +15)
- Attachments modulares (gemas, runas)

---

*Documentado: 28 Octubre 2026 - Sesión final*
