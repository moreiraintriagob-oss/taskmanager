# Declaración de uso de inteligencia artificial

## 1. Herramientas utilizadas y momentos de uso

Se utilizó ChatGPT con asistencia de Codex durante la preparación, integración y revisión del proyecto TaskManager. La ayuda comprendió explicar el entorno de trabajo, proponer y generar código para los archivos, revisar errores, ampliar funciones y orientar las pruebas en el navegador. La implementación se ajustó por etapas al conocer la rúbrica completa, incluyendo prioridades, ordenamiento, API, CustomEvent y funcionamiento offline. También se recibió apoyo para organizar el informe y comprender cómo registrar versiones en GitHub. .

## 2. Prompts utilizados durante el desarrollo

Se emplearon instrucciones para obtener una estructura inicial y facilitar la incorporación de cambios completos en el editor. Dos prompts reales fueron: «revisa el siguiente codigo y dime donde esta el error» y «explicame como funciona la siguiente linea y por que no esta funcionando». Estas peticiones orientaron la generación de los archivos y las versiones sucesivas. Las respuestas se utilizaron como apoyo de desarrollo, junto con explicaciones sobre su funcionamiento y los procedimientos de comprobación.

## 3. Ajustes y revisión del código sugerido

La primera propuesta requería ampliaciones para cumplir la rúbrica completa: incorporar prioridades, fecha de creación, ordenamiento con sort y carga automática de JSONPlaceholder cuando no existieran datos locales. También se ajustó la distinción entre una clave inexistente y una lista vacía guardada para evitar reimportaciones, y se incorporaron identificadores para prevenir duplicados. El dashboard se conectó mediante CustomEvent y se añadió service-worker.js para conservar los archivos de la aplicación. Estos ajustes se prepararon con asistencia de IA y se incorporaron al proyecto por etapas; no se atribuyen exclusivamente a correcciones manuales independientes.


