/*
 * DESAFÍO PRIMAVERA — Lógica del desafío (funciones puras)
 *
 * Sin DOM y sin dependencias: todo lo que decide tiempos, bloqueos,
 * validaciones y resultados vive acá, para poder probarse sin navegador
 * (ver tools/probar-logica.js).
 */
(function (global) {
  'use strict';

  var CASO = (typeof module !== 'undefined' && module.exports)
    ? require('./caso.js')
    : global.CASO;

  /* ------------------------------------------------------------------ */
  /* Tiempo                                                              */
  /* ------------------------------------------------------------------ */

  function formatearTiempo(segundos) {
    var s = Math.max(0, Math.floor(segundos || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  function tiempoReal(estado, ahoraMs) {
    if (!estado || estado.inicio === null || estado.inicio === undefined) return 0;
    if (estado.finSegundos !== null && estado.finSegundos !== undefined) {
      return estado.finSegundos;
    }
    var ahora = (ahoraMs === undefined) ? Date.now() : ahoraMs;
    return Math.max(0, Math.floor((ahora - estado.inicio) / 1000));
  }

  function tiempoTotal(estado, ahoraMs) {
    return tiempoReal(estado, ahoraMs) + (estado ? estado.segundosExtra : 0);
  }

  function tiempoRestante(estado, ahoraMs) {
    return CASO.limiteSegundos - tiempoTotal(estado, ahoraMs);
  }

  /* ------------------------------------------------------------------ */
  /* Estado                                                              */
  /* ------------------------------------------------------------------ */

  function crearEstado(equipoId) {
    return {
      equipo: equipoId,
      inicio: null,
      finSegundos: null,
      finalizado: false,
      motivoFin: null,
      petaloActual: 1,
      completos: [],
      respuestas: {},
      intentos: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      errores: 0,
      cambios: 0,
      cambiosDecision: 0,
      ayudas: [],
      segundosExtra: 0,
      extraAyudas: 0,
      extraVerificacion: 0,
      verificacion: null,
      datosDesbloqueados: ['d01', 'd02', 'd03', 'd04', 'd05'],
      cierre: null
    };
  }

  function iniciar(estado, ahoraMs) {
    if (estado.inicio !== null && estado.inicio !== undefined) return estado;
    estado.inicio = (ahoraMs === undefined) ? Date.now() : ahoraMs;
    return estado;
  }

  function petaloDesbloqueado(estado, n) {
    if (n === 1) return true;
    return estado.completos.indexOf(n - 1) !== -1;
  }

  function petaloEstado(estado, n) {
    if (estado.completos.indexOf(n) !== -1) return 'completado';
    if (petaloDesbloqueado(estado, n)) return 'disponible';
    return 'bloqueado';
  }

  function completarPetalo(estado, n) {
    if (estado.completos.indexOf(n) === -1) estado.completos.push(n);
    estado.completos.sort(function (a, b) { return a - b; });
    var siguiente = n + 1;
    if (siguiente <= 5) {
      estado.petaloActual = siguiente;
      var nuevos = CASO.datos.filter(function (d) { return d.petalo === siguiente; });
      nuevos.forEach(function (d) { desbloquearDato(estado, d.id); });
    }
    return estado;
  }

  function desbloquearDato(estado, id) {
    if (estado.datosDesbloqueados.indexOf(id) === -1) estado.datosDesbloqueados.push(id);
    return estado;
  }

  function finalizar(estado, motivo, ahoraMs) {
    if (estado.finalizado) return estado;
    estado.finSegundos = tiempoReal(estado, ahoraMs);
    estado.finalizado = true;
    estado.motivoFin = motivo;
    return estado;
  }

  /* Devuelve true si el límite de 12 minutos ya se alcanzó. */
  function limiteAlcanzado(estado, ahoraMs) {
    if (estado.inicio === null || estado.inicio === undefined) return false;
    return tiempoTotal(estado, ahoraMs) >= CASO.limiteSegundos;
  }

  /* ------------------------------------------------------------------ */
  /* Recursos                                                            */
  /* ------------------------------------------------------------------ */

  function ayudaUsada(estado, id) {
    return estado.ayudas.some(function (a) { return a.id === id; });
  }

  function buscarAyuda(id) {
    return CASO.ayudas.filter(function (a) { return a.id === id; })[0] || null;
  }

  /* Suma el costo una sola vez. Devuelve {ok, motivo} */
  function usarAyuda(estado, id, ahoraMs) {
    var ayuda = buscarAyuda(id);
    if (!ayuda) return { ok: false, motivo: 'recurso-inexistente' };
    if (estado.finalizado) return { ok: false, motivo: 'desafio-finalizado' };
    if (ayudaUsada(estado, id)) return { ok: false, motivo: 'ya-utilizado' };

    estado.ayudas.push({
      id: id,
      costo: ayuda.costo,
      petalo: estado.petaloActual,
      segundo: tiempoReal(estado, ahoraMs)
    });
    estado.segundosExtra += ayuda.costo;
    estado.extraAyudas += ayuda.costo;
    if (ayuda.desbloqueaDato) desbloquearDato(estado, ayuda.desbloqueaDato);
    return { ok: true, ayuda: ayuda };
  }

  function aplicarCostoVerificacion(estado, opcion) {
    if (estado.verificacion) return estado;
    estado.verificacion = { id: opcion.id, costo: opcion.costo, titulo: opcion.titulo };
    estado.segundosExtra += opcion.costo;
    estado.extraVerificacion += opcion.costo;
    return estado;
  }

  /* Registra un cambio de respuesta ya enviada (revisión). */
  function registrarCambio(estado, petalo, esDecision) {
    if ((estado.intentos[petalo] || 0) > 0 || esDecision) {
      estado.cambios += 1;
      if (esDecision) estado.cambiosDecision += 1;
    }
    return estado;
  }

  /* ------------------------------------------------------------------ */
  /* Texto                                                               */
  /* ------------------------------------------------------------------ */

  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function contarPalabras(texto) {
    var t = String(texto || '').trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  }

  /* ------------------------------------------------------------------ */
  /* Validaciones                                                        */
  /* ------------------------------------------------------------------ */

  function petalo(n) {
    return CASO.petalos.filter(function (p) { return p.n === n; })[0];
  }

  /* Pétalos 1 y 3: todos los elementos asignados y en la columna correcta. */
  function validarAsignacion(n, asignacion) {
    var p = petalo(n);
    var a = asignacion || {};
    var sinAsignar = p.items.filter(function (it) { return !a[it.id]; });
    if (sinAsignar.length) {
      return { ok: false, motivo: 'incompleto', faltan: sinAsignar.length, mal: 0 };
    }
    var mal = p.items.filter(function (it) { return a[it.id] !== it.correcta; });
    return { ok: mal.length === 0, motivo: mal.length ? 'incorrecto' : 'ok', mal: mal.length, faltan: 0 };
  }

  /* Pétalo 2: exactamente 2 sostenibles + 1 no sostenible, y correctos. */
  function validarSeleccion(n, asignacion) {
    var p = petalo(n);
    var a = asignacion || {};
    var si = p.items.filter(function (it) { return a[it.id] === 'si'; });
    var no = p.items.filter(function (it) { return a[it.id] === 'no'; });
    if (si.length !== p.requiere.si || no.length !== p.requiere.no) {
      return {
        ok: false, motivo: 'cantidad', mal: 0,
        detalle: 'Se requieren ' + p.requiere.si + ' conclusiones sostenibles y ' + p.requiere.no + ' no sostenible.'
      };
    }
    var mal = si.filter(function (it) { return it.correcta !== 'si'; }).length
      + no.filter(function (it) { return it.correcta !== 'no'; }).length;
    return { ok: mal === 0, motivo: mal ? 'incorrecto' : 'ok', mal: mal };
  }

  /* Pétalo 4: la verificación debe responder a lo que quedó en suspenso. */
  function validarVerificacion(opcionId) {
    var p = petalo(4);
    var op = p.opciones.filter(function (o) { return o.id === opcionId; })[0];
    if (!op) return { ok: false, motivo: 'sin-seleccion' };
    return { ok: !!op.valida, motivo: op.valida ? 'ok' : 'incoherente', opcion: op };
  }

  /* Pétalo 5 — Puntaje de fundamentación.
     No hay respuesta exacta: se puntúa cuántas dimensiones del análisis
     quedaron cubiertas, cuántas palabras de fundamento escribieron y si el
     camino elegido es coherente con lo que el propio equipo registró.
     El equipo no ve este puntaje durante el desafío. */
  function puntuarDecision(opcionId, textos) {
    var p = petalo(5);
    var criterios = CASO.criteriosDecision;
    var pesos = criterios.puntos;
    var grupos = 0;
    var cubiertos = 0;
    var palabras = 0;
    var detalle = [];

    p.campos.forEach(function (campo) {
      var valor = (textos || {})[campo.id] || '';
      var cantidad = contarPalabras(valor);
      var norma = normalizar(valor);
      var def = criterios.campos[campo.id];
      var enCampo = 0;
      var deCampo = def ? def.grupos.length : 0;

      if (def) {
        def.grupos.forEach(function (grupo) {
          grupos += 1;
          var hay = grupo.claves.some(function (clave) {
            return norma.indexOf(normalizar(clave)) !== -1;
          });
          if (hay) { cubiertos += 1; enCampo += 1; }
        });
      }
      /* Sólo cuentan las palabras de un fundamento efectivamente escrito. */
      if (cantidad >= criterios.minPalabras) palabras += cantidad;
      detalle.push({ campo: campo.id, palabras: cantidad, cubiertos: enCampo, grupos: deCampo });
    });

    var op = p.opciones.filter(function (o) { return o.id === opcionId; })[0] || null;
    var coherente = !!op && !op.rechazo;

    var cobertura = grupos ? Math.round(pesos.cobertura * cubiertos / grupos) : 0;
    var porPalabras = Math.min(pesos.palabras, Math.floor(palabras / criterios.palabrasPorPunto));
    var coherencia = coherente ? pesos.coherencia : 0;

    return {
      cobertura: cobertura,
      porPalabras: porPalabras,
      coherencia: coherencia,
      total: cobertura + porPalabras + coherencia,
      maximo: pesos.cobertura + pesos.palabras + pesos.coherencia,
      dimensiones: cubiertos,
      dimensionesTotales: grupos,
      palabras: palabras,
      coherente: coherente,
      detalle: detalle
    };
  }

  /* Pétalo 5: sólo se exige que los tres fundamentos estén escritos.
     Si el camino elegido contradice lo que el equipo registró antes, se
     devuelve una advertencia: el equipo decide si lo revisa o lo confirma. */
  function validarDecision(opcionId, textos) {
    var p = petalo(5);
    var op = p.opciones.filter(function (o) { return o.id === opcionId; })[0];
    if (!op) return { ok: false, motivo: 'sin-seleccion', faltantes: [] };

    var minimo = CASO.criteriosDecision.minPalabras;
    var faltantes = p.campos.filter(function (campo) {
      return contarPalabras((textos || {})[campo.id]) < minimo;
    }).map(function (campo) { return campo.id; });

    var puntaje = puntuarDecision(opcionId, textos);

    if (faltantes.length) {
      return { ok: false, motivo: 'incompleto', faltantes: faltantes, minimo: minimo, puntaje: puntaje };
    }
    return {
      ok: true,
      motivo: op.rechazo ? 'incoherente' : 'ok',
      advertencia: op.rechazo || null,
      faltantes: [],
      puntaje: puntaje
    };
  }

  /* Una conclusión es válida si el camino es coherente y el fundamento
     alcanza el umbral. No exige palabras exactas. */
  function decisionValida(puntaje) {
    if (!puntaje) return false;
    return puntaje.coherente && puntaje.total >= CASO.criteriosDecision.umbralValida;
  }

  /* Recurso C — VERIFICACIÓN: consistencia de la respuesta en curso,
     sin revelar qué elemento está mal ubicado. */
  function verificarConsistencia(n, respuesta) {
    var p = petalo(n);
    if (n === 4) {
      var v = validarVerificacion(respuesta && respuesta.opcion);
      if (!respuesta || !respuesta.opcion) return { evaluados: 0, inconsistentes: 0, texto: 'Todavía no hay una opción seleccionada para verificar.' };
      return {
        evaluados: 1,
        inconsistentes: v.ok ? 0 : 1,
        texto: v.ok
          ? 'La opción seleccionada es consistente con lo que el equipo dejó en suspenso.'
          : 'La opción seleccionada no responde a lo que el equipo dejó en suspenso.'
      };
    }
    if (n === 5) {
      var op = (respuesta && respuesta.opcion) || null;
      if (!op) return { evaluados: 0, inconsistentes: 0, texto: 'Todavía no hay un camino seleccionado para verificar.' };
      var decision = validarDecision(op, respuesta.textos || {});
      var incoherente = decision.motivo === 'incoherente';
      return {
        evaluados: 1,
        inconsistentes: incoherente ? 1 : 0,
        texto: incoherente
          ? 'El camino seleccionado no es consistente con lo que el equipo afirmó y con lo que reconoció que no puede afirmar.'
          : 'El camino seleccionado es consistente con la evidencia registrada. El fundamento escrito se evalúa al registrar la decisión.'
      };
    }

    var a = (respuesta && respuesta.asignacion) || {};
    var asignados = p.items.filter(function (it) { return !!a[it.id]; });
    if (!asignados.length) {
      return { evaluados: 0, inconsistentes: 0, texto: 'Todavía no hay elementos ubicados para verificar.' };
    }
    var malos = asignados.filter(function (it) { return a[it.id] !== it.correcta; }).length;
    var texto = malos === 0
      ? 'Los ' + asignados.length + ' elementos ya ubicados son consistentes con la evidencia disponible.'
      : malos + ' de los ' + asignados.length + ' elementos ubicados no son consistentes con la evidencia disponible.';
    return { evaluados: asignados.length, inconsistentes: malos, texto: texto };
  }

  /* ------------------------------------------------------------------ */
  /* Resultado                                                           */
  /* ------------------------------------------------------------------ */

  function nombreEquipo(id) {
    var e = CASO.equipos.filter(function (x) { return x.id === id; })[0];
    return e ? e.nombre : String(id || '');
  }

  function conclusionValida(estado) {
    return estado.completos.length === 5
      && !!estado.respuestas[5]
      && estado.respuestas[5].validada === true;
  }

  function puntajeFundamento(estado) {
    var r5 = estado.respuestas[5];
    return (r5 && r5.puntaje) ? r5.puntaje : null;
  }

  function resultado(estado, ahoraMs) {
    var real = tiempoReal(estado, ahoraMs);
    return {
      equipo: estado.equipo,
      nombre: nombreEquipo(estado.equipo),
      petalos: estado.completos.length,
      valida: conclusionValida(estado),
      tiempoReal: real,
      extraAyudas: estado.extraAyudas,
      extraVerificacion: estado.extraVerificacion,
      extraTotal: estado.segundosExtra,
      tiempoTotal: real + estado.segundosExtra,
      fundamento: (puntajeFundamento(estado) || {}).total || 0,
      fundamentoMaximo: (puntajeFundamento(estado) || {}).maximo || CASO.criteriosDecision.puntos.cobertura + CASO.criteriosDecision.puntos.palabras + CASO.criteriosDecision.puntos.coherencia,
      fundamentoDetalle: puntajeFundamento(estado),
      ayudas: estado.ayudas.length,
      ayudasIds: estado.ayudas.map(function (a) { return a.id; }),
      errores: estado.errores,
      cambios: estado.cambios,
      cambiosDecision: estado.cambiosDecision,
      verificacion: estado.verificacion ? estado.verificacion.id : null,
      motivoFin: estado.motivoFin,
      fecha: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
  }

  /* Saneado estricto de un resultado externo (pegado por el conductor).
     Nada de esto se confía: se valida tipo, rango y valores admitidos. */
  function parsearResultado(bruto) {
    if (!bruto || typeof bruto !== 'object') return null;
    var ids = CASO.equipos.map(function (e) { return e.id; });
    if (ids.indexOf(bruto.equipo) === -1) return null;

    function num(valor, max) {
      var n = Number(valor);
      if (!isFinite(n) || n < 0) return 0;
      return Math.min(Math.floor(n), max);
    }
    var real = num(bruto.tiempoReal, 86400);
    var extraA = num(bruto.extraAyudas, 86400);
    var extraV = num(bruto.extraVerificacion, 86400);

    return {
      equipo: bruto.equipo,
      nombre: nombreEquipo(bruto.equipo),
      petalos: num(bruto.petalos, 5),
      valida: bruto.valida === true,
      tiempoReal: real,
      extraAyudas: extraA,
      extraVerificacion: extraV,
      extraTotal: extraA + extraV,
      tiempoTotal: real + extraA + extraV,
      fundamento: num(bruto.fundamento, 100),
      fundamentoMaximo: num(bruto.fundamentoMaximo, 100) || 100,
      ayudas: num(bruto.ayudas, 5),
      errores: num(bruto.errores, 999),
      cambios: num(bruto.cambios, 999),
      cambiosDecision: num(bruto.cambiosDecision, 999),
      externo: true
    };
  }

  /* Comparación: primero eficacia, después eficiencia. */
  function comparar(a, b) {
    if (!a || !b) return { estado: 'incompleto', mensaje: 'Falta cargar el resultado de uno de los equipos.' };

    var validos = [a, b].filter(function (r) { return r.valida && r.petalos === 5; });
    if (validos.length === 0) {
      return { estado: 'sin-eficacia', mensaje: 'Ninguno de los dos equipos completó el desafío con una conclusión válida. Sin eficacia no se compara eficiencia.' };
    }
    if (validos.length === 1) {
      return {
        estado: 'uno-valido',
        mensaje: 'Sólo ' + validos[0].nombre + ' llegó a una conclusión válida sobre los cinco pétalos. La comparación de eficiencia requiere eficacia en ambos equipos.',
        unico: validos[0]
      };
    }
    var orden = [a, b].slice().sort(function (x, y) {
      if (x.tiempoTotal !== y.tiempoTotal) return x.tiempoTotal - y.tiempoTotal;
      if (x.errores !== y.errores) return x.errores - y.errores;
      if (x.ayudas !== y.ayudas) return x.ayudas - y.ayudas;
      return (y.fundamento || 0) - (x.fundamento || 0);
    });
    return {
      estado: 'comparable',
      mensaje: 'Ambos equipos llegaron a una conclusión válida. La diferencia está en la utilización de tiempo y recursos.',
      orden: orden
    };
  }

  var API = {
    formatearTiempo: formatearTiempo,
    tiempoReal: tiempoReal,
    tiempoTotal: tiempoTotal,
    tiempoRestante: tiempoRestante,
    crearEstado: crearEstado,
    iniciar: iniciar,
    petalo: petalo,
    petaloDesbloqueado: petaloDesbloqueado,
    petaloEstado: petaloEstado,
    completarPetalo: completarPetalo,
    desbloquearDato: desbloquearDato,
    finalizar: finalizar,
    limiteAlcanzado: limiteAlcanzado,
    ayudaUsada: ayudaUsada,
    buscarAyuda: buscarAyuda,
    usarAyuda: usarAyuda,
    aplicarCostoVerificacion: aplicarCostoVerificacion,
    registrarCambio: registrarCambio,
    normalizar: normalizar,
    contarPalabras: contarPalabras,
    validarAsignacion: validarAsignacion,
    validarSeleccion: validarSeleccion,
    validarVerificacion: validarVerificacion,
    validarDecision: validarDecision,
    puntuarDecision: puntuarDecision,
    decisionValida: decisionValida,
    verificarConsistencia: verificarConsistencia,
    nombreEquipo: nombreEquipo,
    conclusionValida: conclusionValida,
    resultado: resultado,
    parsearResultado: parsearResultado,
    comparar: comparar
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  } else {
    global.LOGICA = API;
  }
})(typeof window !== 'undefined' ? window : globalThis);
