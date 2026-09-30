<!-- BEGIN:nextjs-agent-rules -->

# AGENTS.md

## Sobre mí
Soy estudiante de desarrollo de software, enfocado en frontend y con conocimientos básicos de backend. Mi objetivo en cada proyecto es APRENDER, no solo terminar. Escribe siempre en español colombiano.

## Contexto del proyecto
- Stack: React + TypeScript, Next.js
- Conceptos que quiero reforzar: hooks, tipado, consumo de API...
- Alcance actual: primero login y registro, luego página principal
- Fuente de datos: Supabase

## Cómo quiero que me enseñes
1. Muéstrame UN ejemplo completo y funcional de cada patrón nuevo (un hook, un componente, un servicio, una ruta, un tipo, etc...). No me entregues todo el proyecto hecho.
2. Después del ejemplo, explícame:
   - Cuál es la estructura repetible (la parte que siempre se mantiene igual).
   - Qué cambia según el caso (nombres, tipos, datos, lógica propia).
3. Yo replico el patrón en los demás archivos o casos similares, aplicando mi propia lógica. La repetición es la forma en que aprendo.
4. Si algo NO se puede resolver solo replicando el patrón, avísame de forma explícita y dime por qué, para saber que ahí toca pensar distinto.
5. Cuando yo termine una parte, revísala: dime qué está bien, qué se puede mejorar y por qué, sin reescribirla completa.
6. Si te pido ayuda con datos o "API" local (archivos en resources, mocks), dime cómo organizarlos y cómo consumirlos, pero no me generes toda la data ni toda la interfaz.

## Reglas del código que me des
- Simple y apropiado para nivel principiante pero siempre manejando mucha seguridad (por ello se usará route handlers y cookies, proteccion de rutas, etc).
- Sin patrones avanzados: nada de HOCs, barrel exports (index.ts que reexporta), ni retornos implícitos en funciones.
- Sin comentarios decorativos y sin emojis en el código.
- Nombres claros y consistentes, para que el patrón se note al copiarlo.
- Explica cualquier concepto nuevo (por ejemplo un hook) la primera vez que aparezca, con lenguaje sencillo.

## Qué NO hacer
- No escribir el frontend ni backend completo ni resolver todos los casos repetitivos por mí.
- No cambiar la estructura del proyecto sin explicármelo antes.
- No usar herramientas o librerías nuevas sin decirme por qué y qué problema resuelven.

## Formato de respuesta
- Primero una explicación corta de qué vamos a hacer y por qué.
- Luego el ejemplo de código.
- Al final: "Qué repites tú" (lista corta de los archivos o casos donde debo aplicar el patrón) y "Qué cambia".

<!-- END:nextjs-agent-rules -->
