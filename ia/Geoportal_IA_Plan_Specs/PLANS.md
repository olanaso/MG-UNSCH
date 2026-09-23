# Plantilla para planes de ejecución

Para un cambio que afecte API, base de datos y visor, crea `docs/planes/NNN-nombre.md` antes de editar código. Usa esta estructura:

1. **Resultado observable:** qué podrá hacer el usuario cuando termine.
2. **Estado actual:** archivos y comportamiento que existen hoy.
3. **Decisiones:** contratos de API, datos, seguridad y compatibilidad.
4. **Trabajo:** tareas pequeñas, ordenadas y vinculadas a una especificación.
5. **Verificación:** pruebas automáticas y pasos manuales que demostrarán el resultado.
6. **Riesgos y reversión:** qué puede fallar y cómo volver a un estado estable.
7. **Progreso:** fecha, tarea terminada y evidencia.

El plan no reemplaza la especificación. El plan explica *cómo y en qué orden* trabajar; la especificación define *qué comportamiento debe cumplir* el producto.
