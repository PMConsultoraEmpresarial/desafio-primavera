/*
 * DESAFÍO PRIMAVERA — Contenido del caso VERA INDUSTRIAS
 *
 * Este archivo contiene únicamente CONTENIDO y CRITERIOS de validación.
 * La lógica que los evalúa vive en logica.js; la interfaz, en app.js.
 * Se carga tanto en el navegador (window.CASO) como en Node (require).
 */
(function (global) {
  'use strict';

  var CASO = {
    experiencia: 'DESAFÍO PRIMAVERA',
    subtitulo: '¿Hubo realmente una transformación?',
    empresa: 'VERA INDUSTRIAS',
    limiteSegundos: 12 * 60,

    equipos: [
      { id: 'NEXA', nombre: 'NEXA Consultores' },
      { id: 'AGORA', nombre: 'ÁGORA Consultores' }
    ],

    contexto: {
      titulo: 'VERA INDUSTRIAS — 90 DÍAS DE TRANSFORMACIÓN',
      parrafos: [
        'VERA INDUSTRIAS es una empresa mediana que decidió transformar su manera de trabajar.',
        'Durante 90 días recibió acompañamiento para optimizar procesos, incorporar herramientas de inteligencia artificial, acompañar a sus líderes, desarrollar capacidades del equipo y realizar seguimiento de indicadores.'
      ],
      cita: 'Vimos cambios, pero necesitamos saber si realmente hubo una transformación y qué deberíamos hacer a continuación.',
      citaAutor: 'Dirección de VERA INDUSTRIAS',
      cierre: 'El equipo consultor debe analizar la evidencia disponible y construir una conclusión.'
    },

    /* ------------------------------------------------------------------
     * ENUNCIADO: cómo se juega. Se lee antes de iniciar, con el
     * cronómetro detenido, y queda disponible durante el desafío.
     * ------------------------------------------------------------------ */
    instrucciones: {
      titulo: 'CÓMO SE JUEGA',
      intro: 'Lean esta pantalla con el equipo. El cronómetro arranca cuando presionen INICIAR DESAFÍO.',
      pasos: [
        'Cinco etapas, en orden. Cada una se abre al cerrar la anterior.',
        'Cada etapa trae su enunciado con la información que necesitan. No hay nada escondido para buscar.',
        'Una sola respuesta por etapa, acordada entre los cinco integrantes.',
        'Si la respuesta no se sostiene con la evidencia, la app lo avisa y pueden volver a intentar. El error queda registrado.'
      ],
      reglasTitulo: 'TIEMPO Y RECURSOS',
      reglas: [
        'El cronómetro arranca al iniciar y no se detiene.',
        'Hay cinco recursos de análisis. Cada uno se usa una sola vez y suma segundos al TIEMPO TOTAL. Pueden no usar ninguno.',
        'El desafío se cierra cuando el TIEMPO TOTAL llega a 12:00. Los segundos de los recursos cuentan para ese límite.'
      ],
      etapasTitulo: 'LAS CINCO ETAPAS',
      cierre: 'No gana el que termina primero. Primero se evalúa si la conclusión es válida; después, cómo se administraron el tiempo y los recursos.'
    },

    /* ------------------------------------------------------------------
     * TARJETAS DE INFORMACIÓN
     * petalo: en qué etapa se desbloquea. 0 = sólo por recurso/decisión.
     * ------------------------------------------------------------------ */
    datos: [
      {
        id: 'd01', codigo: 'DATO 01', area: 'OPERACIONES', tono: 'menta', petalo: 1,
        lineas: [
          'Tiempo promedio de resolución: 42 → 29 minutos.',
          'Retrabajo: 18% → 11%.',
          'Cumplimiento de plazos: 71% → 86%.'
        ],
        nota: 'Mediciones del sistema operativo de la empresa, período completo de 90 días.'
      },
      {
        id: 'd02', codigo: 'DATO 02', area: 'IA', tono: 'cielo', petalo: 1,
        lineas: [
          'Proceso A: utilización efectiva 82%.',
          'Proceso B: utilización efectiva 31%.',
          'Proceso C: utilización efectiva 76%.'
        ],
        nota: 'Utilización efectiva: proporción de casos resueltos con la herramienta habilitada para ese proceso.'
      },
      {
        id: 'd03', codigo: 'DATO 03', area: 'PERSONAS', tono: 'lila', petalo: 1,
        lineas: [
          'Comprensión de la nueva forma de trabajo: 4,2 / 5.',
          'Confianza utilizando herramientas: 3,1 / 5.',
          'Percepción de mejora en el trabajo diario: 4,0 / 5.',
          'Participación en el acompañamiento: 78%.'
        ],
        nota: 'Relevamiento interno autoadministrado al cierre de los 90 días.'
      },
      {
        id: 'd04', codigo: 'DATO 04', area: 'PROCESOS', tono: 'rosa', petalo: 1,
        lineas: [
          'De 5 procesos intervenidos: 3 rediseñados completamente.',
          '1 rediseñado parcialmente.',
          '1 sin modificaciones.'
        ],
        nota: 'Registro de avance del equipo de procesos.'
      },
      {
        id: 'd05', codigo: 'DATO 05', area: 'DIRECCIÓN', tono: 'durazno', petalo: 1,
        lineas: [
          'La empresa esperaba reducir tiempos.',
          'Disminuir retrabajos.',
          'Aumentar autonomía.',
          'Lograr adopción efectiva de IA.'
        ],
        cita: 'No queremos una conclusión basada solamente en percepciones.',
        nota: 'Acta de inicio del acompañamiento y pedido de la Dirección.'
      },
      {
        id: 'd06', codigo: 'DATO 06', area: 'COMPARACIÓN POR PROCESO', tono: 'cielo', petalo: 2,
        tabla: {
          columnas: ['Proceso', 'Antes', 'Después', 'Intervención', 'Utilización de IA'],
          filas: [
            ['A', '45 min', '29 min', 'Completa', '82%'],
            ['B', '40 min', '39 min', 'Parcial', '31%'],
            ['C', '41 min', '27 min', 'Completa', '76%'],
            ['D', '43 min', '43 min', 'Sin intervención', 'Sin IA']
          ]
        },
        nota: 'El quinto proceso intervenido no cuenta con medición de tiempos comparable.'
      },
      {
        id: 'd07', codigo: 'DATO 07', area: 'NUEVA INFORMACIÓN', tono: 'durazno', petalo: 3,
        lineas: [
          'Durante el mismo período, VERA INDUSTRIAS incorporó 8 personas al área con mayor volumen operativo.',
          'El área de mayor volumen operativo concentra los procesos A y B.',
          'La empresa también modificó el sistema de turnos, con alcance en toda la operación.'
        ],
        nota: 'Información suministrada por la Dirección con posterioridad al informe de cierre.'
      },
      {
        id: 'd08', codigo: 'DATO 08', area: 'SEGUIMIENTO', tono: 'lila', petalo: 0,
        lineas: [
          'Reuniones de seguimiento realizadas: 11 de 12 previstas.',
          'Indicadores con línea de base previa a la intervención: 3 de 6.',
          'Procesos con responsable asignado al cierre: 3 de 5.',
          'Rotación de personal en el área de mayor volumen: 14% en el período.'
        ],
        nota: 'Información complementaria. Se incorpora al tablero al utilizar el recurso DATO ADICIONAL.'
      }
    ],

    /* ------------------------------------------------------------------
     * RECURSOS DE ANÁLISIS (un uso cada uno)
     * ------------------------------------------------------------------ */
    ayudas: [
      {
        id: 'A', nombre: 'COMBINACIÓN', costo: 40,
        descripcion: 'Presenta una combinación de 3 respuestas posibles para orientar el análisis.',
        contenido: {
          1: [
            'Combinación 1 — Sostenibles: A y C. No sostenibles todavía: B, D y E.',
            'Combinación 2 — Sostenibles: A, C y D. No sostenibles todavía: B y E.',
            'Combinación 3 — Sostenibles: A y D. No sostenibles todavía: B, C y E.'
          ],
          2: [
            'Combinación 1 — Sostenemos la concentración de mejoras y la co-ocurrencia de intervención y adopción; no sostenemos una explicación de un solo factor.',
            'Combinación 2 — Sostenemos la concentración de mejoras y el efecto de la baja adopción en el Proceso B; no sostenemos la generalización a partir del Proceso D.',
            'Combinación 3 — Sostenemos el efecto del rediseño y el efecto de la IA por separado; no sostenemos la co-ocurrencia.'
          ],
          3: [
            'Combinación 1 — Se mantienen los resultados medidos, se modifican las explicaciones de un solo factor, queda en suspenso el peso de cada factor.',
            'Combinación 2 — Se mantienen las explicaciones anteriores, se modifican los resultados medidos, queda en suspenso la adopción.',
            'Combinación 3 — Se mantienen los resultados y las explicaciones, y queda en suspenso únicamente la replicabilidad.'
          ],
          4: [
            'Combinación 1 — Solicitar la verificación que permita separar el efecto del nuevo esquema de turnos del efecto de la intervención.',
            'Combinación 2 — Solicitar la verificación que amplíe la medición de percepciones del equipo.',
            'Combinación 3 — Solicitar la verificación que audite la calidad técnica del rediseño realizado.'
          ],
          5: [
            'Combinación 1 — Afirmar mejoras medidas en procesos con intervención completa, no afirmar el peso de cada factor, recomendar consolidar y escalar lo que demuestre resultados.',
            'Combinación 2 — Afirmar la adopción efectiva de IA en toda la operación, no afirmar las mejoras de tiempos, recomendar escalar de inmediato.',
            'Combinación 3 — Afirmar que la intervención fue la causa de las mejoras, no afirmar la percepción del equipo, recomendar detener el proceso.'
          ]
        }
      },
      {
        id: 'B', nombre: 'PISTA', costo: 25,
        descripcion: 'Orienta sobre qué relación entre los datos conviene revisar, sin revelar la respuesta.',
        contenido: {
          1: ['Revisen qué afirmaciones se apoyan en mediciones y qué afirmaciones se apoyan en percepciones. La Dirección fue explícita al respecto.'],
          2: ['Antes de mirar la utilización de IA, ordenen los procesos por grado de intervención. Hay dos condiciones que se superponen en el mismo proceso.'],
          3: ['Separen las afirmaciones que describen un resultado de las que explican ese resultado. La nueva información no afecta a ambas de la misma manera.'],
          4: ['El recurso a solicitar debe responder a lo que el equipo dejó sin resolver, no a lo que ya está medido.'],
          5: ['La recomendación tiene que poder sostenerse con lo que el equipo afirmó y, al mismo tiempo, con lo que reconoció que todavía no puede afirmar.']
        }
      },
      {
        id: 'C', nombre: 'VERIFICACIÓN', costo: 35,
        descripcion: 'Permite comprobar si la interpretación que están construyendo es consistente con la evidencia disponible.',
        requiereRespuestaEnCurso: true
      },
      {
        id: 'D', nombre: 'DATO ADICIONAL', costo: 50,
        descripcion: 'Desbloquea información complementaria de VERA INDUSTRIAS.',
        desbloqueaDato: 'd08'
      },
      {
        id: 'E', nombre: 'SEGUNDA MIRADA', costo: 60,
        descripcion: 'Señala una posible contradicción o un dato que el equipo todavía no incorporó al análisis.',
        contenido: {
          1: ['Una comprensión de 4,2/5 convive con una confianza de 3,1/5: el equipo entiende la nueva forma de trabajo pero no se siente seguro utilizándola. Y la participación fue del 78%.'],
          2: ['El Proceso B tiene intervención parcial y baja utilización de IA al mismo tiempo. Con esta evidencia no hay forma de establecer cuál de las dos condiciones pesó.'],
          3: ['El Proceso D no recibió intervención y tampoco mejoró, aunque comparte el nuevo esquema de turnos con el resto de la operación.'],
          4: ['De los factores nuevos, la incorporación de personas afecta a un área determinada; el cambio de turnos afecta a toda la operación. No tienen el mismo alcance.'],
          5: ['El 31% de utilización del Proceso B es a la vez un resultado del período y una condición para cualquier escalamiento.']
        }
      }
    ],

    /* ------------------------------------------------------------------
     * PÉTALOS
     * ------------------------------------------------------------------ */
    petalos: [
      {
        n: 1,
        titulo: 'ARMAR EL TABLERO',
        enunciado: 'VERA INDUSTRIAS entrega el tablero de cierre de los 90 días. Ésta es toda la evidencia disponible por ahora.',
        datos: ['d01', 'd02', 'd03', 'd04', 'd05'],
        consigna: 'Clasifiquen cada afirmación: ¿el equipo puede sostenerla con esta evidencia o todavía no?',
        tipo: 'clasificacion',
        columnas: [
          { id: 'si', etiqueta: 'PODEMOS SOSTENER' },
          { id: 'no', etiqueta: 'TODAVÍA NO' }
        ],
        items: [
          { id: 'A', texto: 'Existen mejoras operativas observables.', correcta: 'si' },
          { id: 'B', texto: 'La IA fue la causa principal de las mejoras.', correcta: 'no' },
          { id: 'C', texto: 'Existen procesos donde la transformación todavía no está consolidada.', correcta: 'si' },
          { id: 'D', texto: 'El equipo adoptó exitosamente la nueva forma de trabajo.', correcta: 'no' },
          { id: 'E', texto: 'La intervención puede replicarse inmediatamente en toda la empresa.', correcta: 'no' }
        ],
        devolucionError: 'La evidencia disponible todavía no permite sostener alguna de las afirmaciones clasificadas. Revisen qué mide cada dato y vuelvan a registrar.',
        devolucionOk: 'Clasificación registrada. El tablero queda armado con lo que el equipo puede sostener y con lo que todavía no.'
      },
      {
        n: 2,
        titulo: 'ENCONTRAR EL CAMBIO',
        enunciado: 'Se incorpora al tablero la comparación proceso por proceso.',
        datos: ['d06'],
        consigna: 'Marquen 2 conclusiones que el equipo puede sostener y 1 que todavía no. Las demás quedan sin marcar.',
        tipo: 'seleccion',
        requiere: { si: 2, no: 1 },
        columnas: [
          { id: 'si', etiqueta: 'SOSTENEMOS' },
          { id: 'no', etiqueta: 'NO SOSTENEMOS' }
        ],
        items: [
          { id: '1', texto: 'Las mejoras se concentran en los procesos con intervención completa; donde la intervención fue parcial o inexistente, los tiempos se mantuvieron.', correcta: 'si' },
          { id: '2', texto: 'En los procesos que mejoraron, la intervención completa y la utilización alta de IA se presentan juntas.', correcta: 'si' },
          { id: '3', texto: 'La baja utilización de IA en el Proceso B explica que ese proceso no haya mejorado.', correcta: 'no' },
          { id: '4', texto: 'El Proceso D demuestra que sin IA no hay mejora posible.', correcta: 'no' },
          { id: '5', texto: 'El rediseño de procesos, y no la IA, fue el factor determinante de la mejora.', correcta: 'no' }
        ],
        devolucionError: 'Al menos una de las conclusiones marcadas no se sostiene con la evidencia disponible, o la marcada como no sostenible sí puede sostenerse. Revisen qué condiciones se superponen en cada proceso.',
        devolucionOk: 'Conclusiones registradas. El equipo identificó dónde se concentra el cambio y hasta dónde llega la evidencia.'
      },
      {
        n: 3,
        titulo: 'REVISAR LA LECTURA',
        enunciado: 'La Dirección envía información que no estaba en el informe de cierre.',
        datos: ['d07'],
        consigna: 'Con esta evidencia nueva: ¿qué mantienen, qué modifican y qué dejan en suspenso? Cada elemento va en una sola columna.',
        tipo: 'revision',
        columnas: [
          { id: 'mantenemos', etiqueta: 'MANTENEMOS' },
          { id: 'modificamos', etiqueta: 'MODIFICAMOS' },
          { id: 'suspenso', etiqueta: 'DEJAMOS EN SUSPENSO' }
        ],
        items: [
          { id: 'r1', texto: 'Hay mejoras observables en tiempos de resolución, retrabajo y cumplimiento de plazos.', correcta: 'mantenemos' },
          { id: 'r2', texto: 'Las mejoras se concentran en los procesos con intervención completa.', correcta: 'mantenemos' },
          { id: 'r3', texto: 'El Proceso B no mejoró, aunque pertenece al área que recibió 8 personas y comparte el nuevo esquema de turnos.', correcta: 'mantenemos' },
          { id: 'r4', texto: 'La intervención explica la mejora de los procesos A y C.', correcta: 'modificamos' },
          { id: 'r5', texto: 'La utilización de IA es el factor que diferencia a los procesos que mejoraron.', correcta: 'modificamos' },
          { id: 'r6', texto: 'Cuánto aportó cada factor —intervención, dotación y turnos— a la mejora observada.', correcta: 'suspenso' },
          { id: 'r7', texto: 'El efecto del nuevo esquema de turnos sobre los tiempos de cada proceso.', correcta: 'suspenso' },
          { id: 'r8', texto: 'La replicabilidad de la intervención en el resto de la empresa.', correcta: 'suspenso' }
        ],
        notaOpcional: 'Fundamento de la revisión (opcional, una línea)',
        devolucionError: 'Esta información modifica parcialmente la lectura anterior, no la anula por completo. Revisen qué elementos describen un resultado medido y cuáles ofrecen una explicación de ese resultado.',
        devolucionOk: 'Revisión registrada. El equipo mantuvo la distinción entre el resultado observado y su explicación.'
      },
      {
        n: 4,
        titulo: 'GESTIONAR RECURSOS',
        enunciado: 'La Dirección habilita una sola verificación adicional antes de la recomendación. Cada opción tiene su costo de tiempo.',
        datos: [],
        consigna: 'Elijan una sola verificación: tiene que responder a lo que dejaron en suspenso. Si no hace falta, pueden avanzar sin solicitarla.',
        tipo: 'verificacion',
        opciones: [
          {
            id: 'v1', costo: 35, valida: true,
            titulo: 'Medición del Proceso B con dotación estabilizada',
            detalle: 'Volver a medir tiempos del Proceso B una vez estabilizada la incorporación de personal.',
            resultado: 'Con la dotación estabilizada, el Proceso B se mantiene entre 38 y 39 minutos. La incorporación de personas, por sí sola, no modificó los tiempos del área.'
          },
          {
            id: 'v2', costo: 30, valida: true,
            titulo: 'Comparación de tiempos antes y después del cambio de turnos',
            detalle: 'Aislar el efecto del nuevo esquema de turnos sobre los cuatro procesos medidos.',
            resultado: 'El cambio de turnos explica variaciones de ±2 minutos en los cuatro procesos. Las mejoras de A (16 minutos) y C (14 minutos) exceden ampliamente ese rango.'
          },
          {
            id: 'v3', costo: 25, valida: false,
            titulo: 'Relevamiento ampliado de confianza en las herramientas',
            detalle: 'Extender el relevamiento de percepciones a toda la operación.'
          },
          {
            id: 'v4', costo: 40, valida: false,
            titulo: 'Auditoría de calidad técnica del rediseño',
            detalle: 'Revisar la documentación y el diseño de los procesos rediseñados.'
          },
          {
            id: 'v0', costo: 0, valida: true, sinVerificacion: true,
            titulo: 'Avanzar sin verificación adicional',
            detalle: 'El equipo construye la recomendación con la evidencia que ya tiene y asume los límites que eso implica.',
            resultado: 'El equipo avanza sin verificación adicional. El peso de cada factor sobre la mejora observada permanece sin resolver.'
          }
        ],
        devolucionError: 'El recurso elegido no responde a lo que el equipo dejó en suspenso. Revisen qué quedó sin resolver en el pétalo anterior.',
        devolucionOk: 'Decisión de recursos registrada.'
      },
      {
        n: 5,
        titulo: 'TOMAR LA DECISIÓN',
        enunciado: 'La Dirección vuelve a pedir una recomendación.',
        datos: [],
        consigna: 'Definan qué recomiendan hacer en los próximos 90 días y fundamenten la decisión.',
        cita: 'Con la evidencia disponible, necesitamos definir qué recomendamos hacer durante los próximos 90 días.',
        tipo: 'decision',
        opciones: [
          {
            id: 'A', titulo: 'ESCALAR INMEDIATAMENTE',
            detalle: 'Replicar la intervención en toda la empresa.',
            rechazo: 'La recomendación no es coherente con los límites que el propio equipo reconoció: la replicabilidad quedó en suspenso y hay procesos sin consolidar.'
          },
          {
            id: 'B', titulo: 'CONSOLIDAR Y LUEGO ESCALAR',
            detalle: 'Profundizar en los procesos donde todavía existen brechas, validar las condiciones de adopción y luego replicar aquello que demuestre resultados.'
          },
          {
            id: 'C', titulo: 'DETENER',
            detalle: 'No continuar hasta contar con evidencia adicional.',
            rechazo: 'La recomendación no es coherente con la evidencia que el propio equipo sostuvo: hay mejoras operativas medidas en los procesos con intervención completa.'
          }
        ],
        campos: [
          { id: 'afirmamos', etiqueta: 'LO QUE PODEMOS AFIRMAR', ayuda: 'Qué sostiene el equipo y con qué evidencia.' },
          { id: 'noAfirmamos', etiqueta: 'LO QUE TODAVÍA NO PODEMOS AFIRMAR', ayuda: 'Qué queda fuera del alcance de esta evidencia.' },
          { id: 'recomendacion', etiqueta: 'NUESTRA RECOMENDACIÓN', ayuda: 'Qué hacer en los próximos 90 días y en qué orden.' }
        ],
        devolucionOk: 'Recomendación registrada. La margarita queda completa.'
      }
    ],

    /* ------------------------------------------------------------------
     * CRITERIOS DE VALIDACIÓN DEL PÉTALO 5
     * Cada campo exige al menos una coincidencia en cada grupo.
     * Las claves se comparan sin acentos y en minúsculas.
     * ------------------------------------------------------------------ */
    criteriosDecision: {
      minPalabras: 8,
      /* Puntaje de fundamentación (no se muestra durante el desafío).
         Pesa más lo que el equipo escribió que el vocabulario exacto:
         las claves incluyen formas coloquiales a propósito. */
      puntos: { cobertura: 45, palabras: 30, coherencia: 25 },
      palabrasPorPunto: 5,
      umbralValida: 55,
      campos: {
        afirmamos: {
          grupos: [
            {
              mensaje: 'La afirmación no precisa qué resultado sostiene el equipo.',
              claves: [
                'mejora', 'mejoras', 'mejoro', 'mejoraron', 'mejor', 'mejores',
                'reduccion', 'redujo', 'redujeron', 'bajo', 'bajaron', 'bajaria',
                'subio', 'subieron', 'aumento', 'avance', 'avanzo', 'avanzaron',
                'tiempos', 'tiempo de resolucion', 'retrabajo', 'retrabajos',
                'plazos', 'cumplimiento', 'indicadores', 'numeros', 'cifras',
                'resultados', 'rindio', 'rinde', 'productividad', 'operativ'
              ]
            },
            {
              mensaje: 'La afirmación no precisa dónde o con qué evidencia se verifica.',
              claves: [
                'intervencion', 'intervenidos', 'completa', 'completos',
                'proceso', 'procesos', 'area', 'areas', 'sector', 'sectores',
                'rediseñ', 'rediseno', 'a y c', 'dos de', 'tres de',
                'medido', 'medida', 'medidas', 'medicion', 'mediciones',
                'planilla', 'planillas', 'registro', 'registros', 'sistema',
                'informe', 'tablero', 'donde se', 'donde hubo', 'donde trabajamos'
              ]
            }
          ]
        },
        noAfirmamos: {
          grupos: [
            {
              mensaje: 'Falta explicitar qué no puede atribuirse con esta evidencia.',
              claves: [
                'causa', 'causal', 'causalidad', 'atribuir', 'atribuible', 'atribucion',
                'aislar', 'separar', 'distinguir', 'explicacion', 'explica',
                'cuanto', 'que parte', 'parte del cambio', 'peso de cada', 'magnitud',
                'cada factor', 'factores', 'otras cosas', 'otros motivos',
                'al mismo tiempo', 'en simultaneo', 'mismo periodo', 'se mezcla', 'mezclan',
                'dotacion', 'turnos', 'incorporacion', 'las personas que entraron',
                'no sabemos', 'no podemos saber', 'no se puede saber', 'nos falta',
                'no hay certeza', 'sin certeza', 'no es seguro', 'influyo', 'influyeron',
                'replicar', 'replicabilidad', 'escalar', 'adopcion', 'consolidad'
              ]
            }
          ]
        },
        recomendacion: {
          grupos: [
            {
              mensaje: 'La recomendación no indica qué se trabaja antes de escalar.',
              claves: [
                'consolidar', 'consolidacion', 'brecha', 'brechas',
                'proceso b', 'los que faltan', 'lo que falta', 'falta', 'faltan',
                'pendiente', 'pendientes', 'flojo', 'flojos', 'floja', 'flojas',
                'parcial', 'sin intervencion', 'cerrar', 'profundizar', 'reforzar',
                'ordenar', 'arreglar', 'acompanar', 'acompañar', 'trabajar en',
                'adopcion', 'confianza', 'capacitar', 'formacion'
              ]
            },
            {
              mensaje: 'La recomendación no indica cómo se valida antes de replicar.',
              claves: [
                'validar', 'validacion', 'medir', 'medicion', 'linea de base',
                'evidencia', 'indicadores', 'seguimiento', 'condiciones', 'probar',
                'piloto', 'ver si', 'revisar', 'comprobar', 'confirmar',
                'luego', 'despues', 'mas adelante', 'antes de', 'recien',
                'gradual', 'por etapas', 'etapas', 'por partes', 'de a poco',
                'paso a paso', 'selectivo', 'replicar lo que', 'escalar lo que',
                'resto de la empresa', 'toda la empresa'
              ]
            }
          ]
        }
      }
    },

    /* ------------------------------------------------------------------
     * CIERRE REFLEXIVO
     * ------------------------------------------------------------------ */
    cierre: {
      titulo: 'AHORA EL CASO CAMBIA',
      parrafos: [
        'Durante los últimos 12 minutos ustedes analizaron información, tomaron decisiones, utilizaron recursos y revisaron conclusiones.',
        'Ahora no vamos a evaluar la respuesta del caso.',
        'Vamos a evaluar cómo trabajaron.'
      ],
      pregunta: 'Si tuvieran que resolver nuevamente este desafío, ¿qué cambiarían de la manera en que trabajaron para llegar al mismo resultado con una mejor utilización de los recursos?',
      opciones: [
        { id: 'rapido', etiqueta: 'Llegar más rápido' },
        { id: 'recursos', etiqueta: 'Utilizar menos recursos' },
        { id: 'errores', etiqueta: 'Cometer menos errores' }
      ],
      campos: [
        { id: 'hubieramos', etiqueta: 'Si hubiéramos trabajado de otra manera, habríamos…' },
        { id: 'decision', etiqueta: 'La decisión concreta que cambiaríamos sería…' }
      ]
    },

    epilogo: null
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CASO;
  } else {
    global.CASO = CASO;
  }
})(typeof window !== 'undefined' ? window : globalThis);
