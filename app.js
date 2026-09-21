/*
 * DESAFÍO PRIMAVERA — Interfaz
 *
 * Toda la validación y el cálculo de tiempos vive en logica.js.
 * Este archivo se ocupa del DOM, del cronómetro y del registro del recorrido.
 * El texto que escribe el equipo se inserta siempre con textContent.
 */
(function () {
  'use strict';

  var CASO = window.CASO;
  var L = window.LOGICA;

  var CLAVE_ALMACEN = 'desafio-primavera:resultados';

  var estado = null;        // estado del desafío (logica.js)
  var equipoElegido = null;
  var borrador = {};        // respuestas en curso, por pétalo
  var eventos = [];         // registro del recorrido
  var reloj = null;         // setInterval
  var petaloVisto = 1;      // pétalo que se está mirando
  var bloqueado = false;    // true cuando se agotó el tiempo
  var seccionFinal = 'resultado';
  var resultadoExterno = null;

  /* ================================================================ util */

  function $(id) { return document.getElementById(id); }

  function crear(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto !== undefined && texto !== null) n.textContent = texto;
    return n;
  }

  function limpiar(nodo) {
    while (nodo && nodo.firstChild) nodo.removeChild(nodo.firstChild);
  }

  function mostrarPantalla(id) {
    ['pantalla-bienvenida', 'pantalla-juego', 'pantalla-final'].forEach(function (p) {
      $(p).classList.toggle('pantalla--activa', p === id);
    });
    window.scrollTo(0, 0);
  }

  function registrarEvento(texto) {
    eventos.push({ t: L.tiempoReal(estado), texto: texto });
    dibujarRegistro();
  }

  function copiar(texto, boton) {
    var previo = boton.textContent;
    function ok() {
      boton.textContent = 'COPIADO';
      setTimeout(function () { boton.textContent = previo; }, 1600);
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(ok, function () { copiaManual(texto, ok); });
        return;
      }
    } catch (e) { /* se usa el respaldo */ }
    copiaManual(texto, ok);
  }

  function copiaManual(texto, ok) {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', 'readonly');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { /* sin portapapeles */ }
    document.body.removeChild(ta);
  }

  /* =============================================================== modal */

  var modalAlCerrar = null;

  function abrirModal(opciones) {
    $('modal-etiqueta').textContent = opciones.etiqueta || '';
    $('modal-titulo').textContent = opciones.titulo || '';
    var cuerpo = $('modal-cuerpo');
    limpiar(cuerpo);
    (opciones.parrafos || []).forEach(function (p) { cuerpo.appendChild(crear('p', null, p)); });
    if (opciones.lista && opciones.lista.length) {
      var ul = crear('ul');
      opciones.lista.forEach(function (t) { ul.appendChild(crear('li', null, t)); });
      cuerpo.appendChild(ul);
    }
    if (opciones.costo) {
      var caja = crear('div', 'modal__costo');
      caja.appendChild(crear('span', null, 'Esta decisión agregará '));
      caja.appendChild(crear('strong', null, opciones.costo + ' segundos'));
      caja.appendChild(crear('span', null, ' al tiempo total. '));
      caja.appendChild(crear('span', null, opciones.costoNota || ''));
      cuerpo.appendChild(caja);
    }
    var acciones = $('modal-acciones');
    limpiar(acciones);
    (opciones.botones || [{ texto: 'CERRAR' }]).forEach(function (b) {
      var btn = crear('button', 'boton' + (b.principal ? ' boton--principal' : ''), b.texto);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        cerrarModal();
        if (b.accion) b.accion();
      });
      acciones.appendChild(btn);
    });
    modalAlCerrar = opciones.alCerrar || null;
    $('modal').hidden = false;
  }

  function cerrarModal() {
    $('modal').hidden = true;
    var fn = modalAlCerrar;
    modalAlCerrar = null;
    if (fn) fn();
  }

  /* ========================================================== bienvenida */

  function armarBienvenida() {
    $('contexto-titulo').textContent = CASO.contexto.titulo;
    var texto = $('contexto-texto');
    limpiar(texto);
    CASO.contexto.parrafos.forEach(function (p) { texto.appendChild(crear('p', null, p)); });
    $('contexto-cita').textContent = '“' + CASO.contexto.cita + '”';
    $('contexto-autor').textContent = CASO.contexto.citaAutor;
    $('contexto-cierre').textContent = CASO.contexto.cierre;

    var cont = $('equipos');
    limpiar(cont);
    CASO.equipos.forEach(function (eq) {
      var b = crear('button', 'equipo-opcion');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(crear('span', 'equipo-opcion__sigla', eq.id));
      var caja = crear('span');
      caja.appendChild(crear('span', 'equipo-opcion__nombre', eq.nombre));
      caja.appendChild(document.createElement('br'));
      caja.appendChild(crear('span', 'equipo-opcion__rol', 'Equipo consultor · 5 integrantes'));
      b.appendChild(caja);
      b.addEventListener('click', function () {
        equipoElegido = eq.id;
        Array.prototype.forEach.call(cont.children, function (hijo) {
          hijo.setAttribute('aria-pressed', String(hijo === b));
        });
        $('btn-iniciar').disabled = false;
      });
      cont.appendChild(b);
    });

    armarInstrucciones();
    $('btn-iniciar').addEventListener('click', iniciarDesafio);
  }

  /* Enunciado de la dinámica: se lee antes de iniciar y queda accesible
     durante el desafío desde la cabecera. */
  function armarInstrucciones() {
    var i = CASO.instrucciones;
    $('instr-titulo').textContent = i.titulo;
    $('instr-intro').textContent = i.intro;

    var pasos = $('instr-pasos');
    limpiar(pasos);
    i.pasos.forEach(function (texto, n) {
      var li = crear('li', 'paso');
      li.appendChild(crear('span', 'paso__num', String(n + 1)));
      li.appendChild(crear('p', 'paso__texto', texto));
      pasos.appendChild(li);
    });

    $('instr-reglas-titulo').textContent = i.reglasTitulo;
    var reglas = $('instr-reglas');
    limpiar(reglas);
    i.reglas.forEach(function (r) { reglas.appendChild(crear('li', null, r)); });

    $('instr-etapas-titulo').textContent = i.etapasTitulo;
    var etapas = $('instr-etapas');
    limpiar(etapas);
    CASO.petalos.forEach(function (p) {
      var li = crear('li', 'etapa-previa');
      li.appendChild(crear('span', 'etapa-previa__num', String(p.n)));
      li.appendChild(crear('span', 'etapa-previa__nombre', p.titulo));
      etapas.appendChild(li);
    });

    $('instr-cierre').textContent = i.cierre;

    $('btn-como-se-juega').addEventListener('click', mostrarInstrucciones);
  }

  /* La misma información, en ventana, sin detener el cronómetro. */
  function mostrarInstrucciones() {
    var i = CASO.instrucciones;
    abrirModal({
      etiqueta: 'REGLAS',
      titulo: i.titulo,
      parrafos: [i.cierre],
      lista: i.pasos.map(function (t, n) { return (n + 1) + '. ' + t; }).concat(i.reglas),
      botones: [{ texto: 'VOLVER AL ANÁLISIS', principal: true }]
    });
  }

  function textoDato(d) {
    var partes = (d.lineas || []).slice();
    if (d.tabla) {
      d.tabla.filas.forEach(function (f) {
        partes.push(d.tabla.columnas.map(function (c, i) { return c + ': ' + f[i]; }).join(' · '));
      });
    }
    if (d.cita) partes.push('La Dirección aclara: “' + d.cita + '”');
    return partes.join('\n');
  }

  /* ============================================================== inicio */

  function iniciarDesafio() {
    if (!equipoElegido) return;
    estado = L.crearEstado(equipoElegido);
    borrador = {};
    eventos = [];
    bloqueado = false;
    petaloVisto = 1;
    resultadoExterno = null;

    L.iniciar(estado);
    registrarEvento('Inicio del desafío');

    $('hdr-equipo').textContent = L.nombreEquipo(estado.equipo);
    mostrarPantalla('pantalla-juego');
    dibujarTodo();

    if (reloj) clearInterval(reloj);
    reloj = setInterval(actualizarRelojes, 250);
    actualizarRelojes();
    window.addEventListener('beforeunload', avisarRecarga);
  }

  /* Recargar durante la partida borra el recorrido: el navegador avisa. */
  function avisarRecarga(ev) {
    if (!estado || estado.finalizado) return undefined;
    ev.preventDefault();
    ev.returnValue = '';
    return '';
  }

  /* ============================================================== relojes */

  var totalPrevio = 0;

  function actualizarRelojes() {
    if (!estado || !estado.inicio) return;
    var real = L.tiempoReal(estado);
    var total = L.tiempoTotal(estado);
    var restante = Math.max(0, CASO.limiteSegundos - total);

    $('reloj-real').textContent = L.formatearTiempo(real);
    $('reloj-total').textContent = L.formatearTiempo(total);
    $('reloj-restante').textContent = L.formatearTiempo(restante);
    $('reloj-extra').textContent = estado.segundosExtra
      ? '+' + estado.segundosExtra + ' s por recursos'
      : 'sin tiempo adicional';

    var cajaRestante = $('reloj-restante').parentNode;
    cajaRestante.classList.toggle('reloj--alerta', restante <= 60);

    if (total !== totalPrevio) {
      var cajaTotal = $('reloj-total').parentNode;
      cajaTotal.classList.remove('reloj--suma');
      if (total - totalPrevio > 1) {
        void cajaTotal.offsetWidth;
        cajaTotal.classList.add('reloj--suma');
      }
      totalPrevio = total;
    }

    if (!estado.finalizado && L.limiteAlcanzado(estado)) tiempoAgotado();
  }

  function detenerReloj() {
    if (reloj) { clearInterval(reloj); reloj = null; }
  }

  function tiempoAgotado() {
    L.finalizar(estado, 'tiempo');
    bloqueado = true;
    detenerReloj();
    actualizarRelojesFinal();
    registrarEvento('Tiempo agotado');
    dibujarTodo();
    abrirModal({
      etiqueta: 'LÍMITE ALCANZADO',
      titulo: 'TIEMPO AGOTADO',
      parrafos: [
        'El desafío alcanzó los 12 minutos de tiempo total, incluidos los segundos agregados por los recursos utilizados.',
        'No se admiten nuevas decisiones. El recorrido del equipo queda registrado tal como está.'
      ],
      botones: [{ texto: 'VER RESULTADO', principal: true, accion: irAlFinal }]
    });
  }

  function actualizarRelojesFinal() {
    var real = L.tiempoReal(estado);
    var total = L.tiempoTotal(estado);
    $('reloj-real').textContent = L.formatearTiempo(real);
    $('reloj-total').textContent = L.formatearTiempo(total);
    $('reloj-restante').textContent = L.formatearTiempo(Math.max(0, CASO.limiteSegundos - total));
  }

  /* ============================================================== dibujo */

  function dibujarTodo() {
    dibujarMargarita();
    dibujarEtapas();
    dibujarDatos();
    dibujarRecursos();
    dibujarRegistro();
    dibujarTarea();
  }

  var CENTRO = 200;
  var TONOS = ['menta', 'cielo', 'lila', 'rosa', 'durazno'];
  /* Pequenos desvios para que la flor no se vea calcada. */
  var DESVIO = [0, 1.6, -1.2, 1.9, -1.5];
  var NS = 'http://www.w3.org/2000/svg';

  function svg(tag, atributos) {
    var n = document.createElementNS(NS, tag);
    Object.keys(atributos || {}).forEach(function (k) { n.setAttribute(k, atributos[k]); });
    return n;
  }

  /* Degradados y textura del centro: se arman en cada dibujo. */
  function defsMargarita() {
    var defs = svg('defs');

    TONOS.forEach(function (tono) {
      var g = svg('linearGradient', { id: 'petalo-' + tono, x1: '0', y1: '1', x2: '0', y2: '0' });
      g.appendChild(svg('stop', { offset: '0%', 'stop-color': 'var(--' + tono + '-clara)' }));
      g.appendChild(svg('stop', { offset: '58%', 'stop-color': 'var(--' + tono + '-clara)' }));
      g.appendChild(svg('stop', { offset: '100%', 'stop-color': 'var(--' + tono + ')' }));
      defs.appendChild(g);
    });

    var disp = svg('linearGradient', { id: 'petalo-disponible', x1: '0', y1: '1', x2: '0', y2: '0' });
    disp.appendChild(svg('stop', { offset: '0%', 'stop-color': '#fdf7e8' }));
    disp.appendChild(svg('stop', { offset: '100%', 'stop-color': 'var(--ambar-clara)' }));
    defs.appendChild(disp);

    var bloq = svg('linearGradient', { id: 'petalo-bloqueado', x1: '0', y1: '1', x2: '0', y2: '0' });
    bloq.appendChild(svg('stop', { offset: '0%', 'stop-color': '#ffffff' }));
    bloq.appendChild(svg('stop', { offset: '100%', 'stop-color': 'var(--papel-hundido)' }));
    defs.appendChild(bloq);

    var centro = svg('radialGradient', { id: 'centro-flor', cx: '38%', cy: '34%', r: '75%' });
    centro.appendChild(svg('stop', { offset: '0%', 'stop-color': '#f4cf7a' }));
    centro.appendChild(svg('stop', { offset: '58%', 'stop-color': 'var(--ambar)' }));
    centro.appendChild(svg('stop', { offset: '100%', 'stop-color': '#9c6c1f' }));
    defs.appendChild(centro);

    return defs;
  }

  function dibujarMargarita() {
    var cont = $('margarita');
    limpiar(cont);
    cont.appendChild(defsMargarita());

    /* Tallo y hoja: la flor se apoya, no flota. */
    cont.appendChild(svg('path', {
      d: 'M200 244 C 199 296, 197 340, 195 382',
      class: 'flor__tallo'
    }));
    cont.appendChild(svg('path', {
      d: 'M197 330 C 176 320, 160 328, 152 344 C 170 354, 188 348, 197 330 Z',
      class: 'flor__hoja'
    }));

    var capaPetalos = svg('g');
    var capaNumeros = svg('g');

    for (var i = 0; i < 5; i++) {
      var n = i + 1;
      var est = L.petaloEstado(estado, n);
      var tono = TONOS[i];
      var giro = i * 72 + DESVIO[i];
      var relleno = est === 'completado' ? 'url(#petalo-' + tono + ')'
        : (est === 'disponible' ? 'url(#petalo-disponible)' : 'url(#petalo-bloqueado)');

      var grupo = svg('g', { transform: 'rotate(' + giro.toFixed(1) + ' 200 200)' });

      var petalo = svg('path', {
        d: 'M200 210 C 174 202, 162 180, 162 150'
          + ' C 162 114, 175 80, 200 56'
          + ' C 225 80, 238 114, 238 150'
          + ' C 238 180, 226 202, 200 210 Z',
        fill: relleno,
        role: 'button',
        tabindex: est === 'bloqueado' ? '-1' : '0',
        class: 'petalo petalo--' + est + ' petalo--' + tono + (n === petaloVisto ? ' petalo--actual' : '')
      });
      var titulo = svg('title');
      titulo.textContent = 'Petalo ' + n + ' - ' + L.petalo(n).titulo + ' - ' + est;
      petalo.appendChild(titulo);
      grupo.appendChild(petalo);

      /* Nervadura central del petalo. */
      grupo.appendChild(svg('path', {
        d: 'M200 202 C 198 172, 198 104, 200 68',
        class: 'petalo__nervadura petalo__nervadura--' + est
      }));

      if (est !== 'bloqueado') {
        (function (num) {
          petalo.addEventListener('click', function () { verPetalo(num); });
          petalo.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); verPetalo(num); }
          });
        })(n);
      }
      capaPetalos.appendChild(grupo);

      var ang = (-90 + i * 72) * Math.PI / 180;
      var t = svg('text', {
        x: (CENTRO + 102 * Math.cos(ang)).toFixed(1),
        y: (CENTRO + 102 * Math.sin(ang)).toFixed(1),
        class: 'petalo-num petalo-num--' + est
      });
      t.textContent = est === 'bloqueado' ? '\u00b7' : (est === 'completado' ? '\u2713' : String(n));
      capaNumeros.appendChild(t);
    }

    cont.appendChild(capaPetalos);
    cont.appendChild(capaNumeros);

    /* Centro: disco con textura de flosculos. */
    var centro = svg('g');
    centro.appendChild(svg('circle', { cx: CENTRO, cy: CENTRO, r: '44', class: 'flor__centro' }));
    var textura = svg('g', { class: 'flor__florculos' });
    for (var anillo = 0; anillo < 3; anillo++) {
      var radio = 12 + anillo * 11;
      var cuantos = 6 + anillo * 5;
      for (var k = 0; k < cuantos; k++) {
        var a = (k / cuantos) * Math.PI * 2 + anillo * 0.4;
        textura.appendChild(svg('circle', {
          cx: (CENTRO + radio * Math.cos(a)).toFixed(1),
          cy: (CENTRO + radio * Math.sin(a)).toFixed(1),
          r: (2.4 - anillo * 0.4).toFixed(1)
        }));
      }
    }
    centro.appendChild(textura);
    cont.appendChild(centro);

    var texto = svg('text', { x: CENTRO, y: CENTRO, class: 'margarita__centro-texto' });
    texto.textContent = estado.completos.length + '/5';
    cont.appendChild(texto);
  }

  function dibujarEtapas() {
    var cont = $('etapas');
    limpiar(cont);
    CASO.petalos.forEach(function (p) {
      var est = L.petaloEstado(estado, p.n);
      var li = crear('li');
      var b = crear('button', 'etapa etapa--' + est.replace('bloqueado', 'bloqueada').replace('completado', 'completada')
        + ' etapa--tono-' + p.n + (p.n === petaloVisto ? ' etapa--actual' : ''));
      b.type = 'button';
      b.disabled = est === 'bloqueado';
      b.appendChild(crear('span', 'etapa__num', String(p.n)));
      b.appendChild(crear('span', 'etapa__nombre', p.titulo));
      b.appendChild(crear('span', 'etapa__estado',
        est === 'bloqueado' ? 'Bloqueado' : (est === 'completado' ? 'Completado' : 'Disponible')));
      b.addEventListener('click', function () { verPetalo(p.n); });
      li.appendChild(b);
      cont.appendChild(li);
    });
  }

  function verPetalo(n) {
    if (!L.petaloDesbloqueado(estado, n)) return;
    petaloVisto = n;
    dibujarMargarita();
    dibujarEtapas();
    dibujarTarea();
  }

  /* ------------------------------------------------------- panel de datos */

  var datosAbiertos = {};

  /* Panel lateral: sólo la evidencia ya incorporada, plegada por defecto.
     Sirve para volver a mirar un dato de una etapa anterior. */
  function dibujarDatos() {
    var cont = $('datos-lista');
    limpiar(cont);
    var libres = CASO.datos.filter(function (d) {
      return estado.datosDesbloqueados.indexOf(d.id) !== -1;
    });
    $('evidencia-estado').textContent = libres.length + ' de ' + CASO.datos.length;

    libres.forEach(function (d) {
      var caja = crear('div', 'dato');
      var b = crear('button', 'dato__boton');
      b.type = 'button';
      b.appendChild(crear('span', 'dato__codigo', d.codigo));
      b.appendChild(crear('span', 'dato__area', d.area));
      b.appendChild(crear('span', 'dato__estado', datosAbiertos[d.id] ? '−' : '+'));
      b.addEventListener('click', function () {
        datosAbiertos[d.id] = !datosAbiertos[d.id];
        dibujarDatos();
      });
      caja.appendChild(b);
      if (datosAbiertos[d.id]) caja.appendChild(cuerpoDato(d, false));
      cont.appendChild(caja);
    });
  }

  /* Contenido de una pieza de evidencia. sinNota = versión del tablero. */
  function cuerpoDato(d, sinNota) {
    var cuerpo = crear('div', 'dato__cuerpo');
    if (d.lineas) {
      var ul = crear('ul');
      d.lineas.forEach(function (linea) { ul.appendChild(crear('li', null, linea)); });
      cuerpo.appendChild(ul);
    }
    if (d.tabla) cuerpo.appendChild(tablaDato(d.tabla));
    if (d.cita) cuerpo.appendChild(crear('p', 'dato__cita', '“' + d.cita + '”'));
    if (d.nota && !sinNota) cuerpo.appendChild(crear('p', 'dato__nota', d.nota));
    return cuerpo;
  }

  /* Tablero de evidencia, dentro del enunciado del pétalo. */
  function tableroDeDatos(ids) {
    var caja = crear('div', 'tablero-datos');
    (ids || []).forEach(function (id) {
      var d = CASO.datos.filter(function (x) { return x.id === id; })[0];
      if (!d) return;
      var ficha = crear('article', 'ficha' + (d.tono ? ' ficha--' + d.tono : '') + (d.tabla ? ' ficha--ancha' : ''));
      var cab = crear('header', 'ficha__cabecera');
      cab.appendChild(crear('span', 'ficha__codigo', d.codigo));
      cab.appendChild(crear('h3', 'ficha__area', d.area));
      ficha.appendChild(cab);
      ficha.appendChild(cuerpoDato(d, true));
      caja.appendChild(ficha);
    });
    return caja;
  }

  function tablaDato(tabla) {
    var t = crear('table', 'tabla-datos');
    var thead = crear('thead');
    var trh = crear('tr');
    tabla.columnas.forEach(function (c) { trh.appendChild(crear('th', null, c)); });
    thead.appendChild(trh);
    t.appendChild(thead);
    var tbody = crear('tbody');
    tabla.filas.forEach(function (f) {
      var tr = crear('tr');
      f.forEach(function (celda) { tr.appendChild(crear('td', null, celda)); });
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    return t;
  }

  /* ---------------------------------------------------- panel de recursos */

  function dibujarRecursos() {
    var cont = $('recursos-lista');
    limpiar(cont);
    CASO.ayudas.forEach(function (a) {
      var usado = L.ayudaUsada(estado, a.id);
      var b = crear('button', 'recurso' + (usado ? ' recurso--usado' : ''));
      b.type = 'button';
      b.disabled = usado || bloqueado || estado.finalizado;
      b.appendChild(crear('span', 'recurso__letra recurso__letra--' + a.id, a.id));
      b.appendChild(crear('span', 'recurso__nombre', a.nombre));
      b.appendChild(crear('span', 'recurso__costo', usado ? 'utilizado' : '+' + a.costo + 's'));
      b.appendChild(crear('span', 'recurso__desc', a.descripcion));
      b.addEventListener('click', function () { pedirRecurso(a); });
      cont.appendChild(b);
    });
  }

  function dibujarRegistro() {
    var cont = $('registro');
    if (!cont) return;
    limpiar(cont);
    var contador = $('registro-estado');
    if (contador) contador.textContent = eventos.length + (eventos.length === 1 ? ' movimiento' : ' movimientos');
    if (!eventos.length) {
      cont.appendChild(crear('li', 'registro--vacio', 'Sin movimientos registrados.'));
      return;
    }
    eventos.slice().reverse().forEach(function (ev) {
      var li = crear('li');
      li.appendChild(crear('span', null, L.formatearTiempo(ev.t)));
      li.appendChild(crear('span', null, ev.texto));
      cont.appendChild(li);
    });
  }

  /* ============================================================ recursos */

  function pedirRecurso(ayuda) {
    if (bloqueado || estado.finalizado) return;

    // La VERIFICACIÓN necesita una respuesta en curso: si no hay nada que
    // verificar, no se cobra el recurso.
    if (ayuda.requiereRespuestaEnCurso) {
      var prueba = L.verificarConsistencia(petaloVisto, borrador[petaloVisto] || {});
      if (prueba.evaluados === 0) {
        abrirModal({
          etiqueta: 'RECURSO ' + ayuda.id + ' · ' + ayuda.nombre,
          titulo: 'Todavía no hay nada que verificar',
          parrafos: [prueba.texto, 'El recurso no se utilizó y no se sumó tiempo.'],
          botones: [{ texto: 'VOLVER', principal: true }]
        });
        return;
      }
    }

    var totalProyectado = L.tiempoTotal(estado) + ayuda.costo;
    var excede = totalProyectado >= CASO.limiteSegundos;

    abrirModal({
      etiqueta: 'RECURSO ' + ayuda.id + ' · ' + ayuda.nombre,
      titulo: '¿Desean utilizar este recurso?',
      parrafos: [ayuda.descripcion],
      costo: ayuda.costo,
      costoNota: excede
        ? 'Con este costo, el tiempo total alcanza el límite de 12:00 y el desafío se cierra.'
        : 'Tiempo total proyectado: ' + L.formatearTiempo(totalProyectado) + ' de 12:00.',
      botones: [
        { texto: 'VOLVER' },
        { texto: 'UTILIZAR RECURSO', principal: true, accion: function () { usarRecurso(ayuda); } }
      ]
    });
  }

  function usarRecurso(ayuda) {
    var r = L.usarAyuda(estado, ayuda.id);
    if (!r.ok) return;
    registrarEvento('Recurso ' + ayuda.id + ' · ' + ayuda.nombre + ' (+' + ayuda.costo + ' s)');
    actualizarRelojes();
    dibujarRecursos();
    dibujarDatos();
    mostrarContenidoRecurso(ayuda);
  }

  function mostrarContenidoRecurso(ayuda) {
    var opciones = {
      etiqueta: 'RECURSO ' + ayuda.id + ' · ' + ayuda.nombre,
      titulo: ayuda.nombre,
      parrafos: [],
      lista: [],
      botones: [{ texto: 'VOLVER AL ANÁLISIS', principal: true }]
    };

    if (ayuda.id === 'C') {
      var v = L.verificarConsistencia(petaloVisto, borrador[petaloVisto] || {});
      opciones.titulo = 'Verificación de consistencia';
      opciones.parrafos = [v.texto, 'La verificación no indica cuál elemento revisar.'];
    } else if (ayuda.id === 'D') {
      var d = CASO.datos.filter(function (x) { return x.id === ayuda.desbloqueaDato; })[0];
      opciones.titulo = d.codigo + ' — ' + d.area;
      opciones.parrafos = ['Este dato queda incorporado al tablero de información.'];
      opciones.lista = d.lineas.slice();
      datosAbiertos[d.id] = true;
      dibujarDatos();
    } else {
      var contenido = (ayuda.contenido && ayuda.contenido[petaloVisto]) || [];
      if (contenido.length > 1) {
        opciones.parrafos = ['Sobre el Pétalo ' + petaloVisto + ' — ' + L.petalo(petaloVisto).titulo + ':'];
        opciones.lista = contenido.slice();
      } else {
        opciones.parrafos = contenido.slice();
      }
    }
    abrirModal(opciones);
  }

  /* =============================================================== tarea */

  function dibujarTarea() {
    var p = L.petalo(petaloVisto);
    var completo = estado.completos.indexOf(p.n) !== -1;

    $('tarea-etiqueta').textContent = 'PÉTALO ' + p.n + ' DE 5' + (completo ? ' · COMPLETADO' : '');
    $('tarea-titulo').textContent = p.titulo;

    var cuerpo = $('tarea-cuerpo');
    limpiar(cuerpo);
    var pie = $('tarea-pie');
    limpiar(pie);
    $('devolucion').hidden = true;

    // 1. Enunciado: qué llega de la empresa en esta etapa.
    $('tarea').className = 'tarea tarea--tono-' + p.n;
    var enunciado = crear('div', 'enunciado enunciado--tono-' + p.n);
    enunciado.appendChild(crear('p', 'enunciado__etiqueta', 'ENUNCIADO ' + p.n));
    enunciado.appendChild(crear('p', 'enunciado__texto', p.enunciado));
    cuerpo.appendChild(enunciado);

    // 2. La evidencia de esta etapa, a la vista.
    if (p.datos && p.datos.length) cuerpo.appendChild(tableroDeDatos(p.datos));

    // 3. Consigna: qué tiene que hacer el equipo.
    var cajaConsigna = crear('div', 'consigna');
    cajaConsigna.appendChild(crear('p', 'consigna__etiqueta', 'CONSIGNA'));
    cajaConsigna.appendChild(crear('p', null, p.consigna));
    cuerpo.appendChild(cajaConsigna);

    if (p.tipo === 'clasificacion') armarClasificacion(p, cuerpo, pie, completo);
    else if (p.tipo === 'seleccion') armarSeleccion(p, cuerpo, pie, completo);
    else if (p.tipo === 'revision') armarRevision(p, cuerpo, pie, completo);
    else if (p.tipo === 'verificacion') armarVerificacion(p, cuerpo, pie, completo);
    else if (p.tipo === 'decision') armarDecision(p, cuerpo, pie, completo);
  }

  function mostrarDevolucion(tipo, titulo, texto, lista) {
    var caja = $('devolucion');
    caja.className = 'devolucion' + (tipo ? ' devolucion--' + tipo : '');
    limpiar(caja);
    caja.appendChild(crear('p', 'devolucion__titulo', titulo));
    caja.appendChild(crear('p', null, texto));
    if (lista && lista.length) {
      var ul = crear('ul');
      lista.forEach(function (t) { ul.appendChild(crear('li', null, t)); });
      caja.appendChild(ul);
    }
    caja.hidden = false;
  }

  function nota(pie, texto) {
    pie.appendChild(crear('p', 'tarea__pie-nota', texto));
  }

  function botonEnviar(pie, texto, alClic) {
    var b = crear('button', 'boton boton--principal', texto);
    b.type = 'button';
    b.disabled = bloqueado;
    b.addEventListener('click', alClic);
    pie.appendChild(b);
    return b;
  }

  function estadoRespuesta(n) {
    if (!borrador[n]) borrador[n] = { asignacion: {}, opcion: null, textos: {}, nota: '' };
    return borrador[n];
  }

  /* --------------------------------------------- filas con opciones (1-3) */

  function filasDeItems(p, cont, resp, soloLectura, alCambiar) {
    var lista = crear('div', 'items');
    p.items.forEach(function (it) {
      var fila = crear('div', 'item' + (resp.asignacion[it.id] ? ' item--asignado' : ''));
      fila.appendChild(crear('span', 'item__id', it.id.toUpperCase().replace('R', '')));
      fila.appendChild(crear('span', 'item__texto', it.texto));
      var ops = crear('span', 'opciones');
      p.columnas.forEach(function (col) {
        var b = crear('button', 'opcion opcion--' + col.id, col.etiqueta);
        b.type = 'button';
        b.disabled = soloLectura || bloqueado;
        b.setAttribute('aria-pressed', String(resp.asignacion[it.id] === col.id));
        b.addEventListener('click', function () {
          var previo = resp.asignacion[it.id];
          if (previo === col.id) delete resp.asignacion[it.id];
          else resp.asignacion[it.id] = col.id;
          if (previo && previo !== resp.asignacion[it.id]) L.registrarCambio(estado, p.n, false);
          alCambiar();
        });
        ops.appendChild(b);
      });
      fila.appendChild(ops);
      lista.appendChild(fila);
    });
    cont.appendChild(lista);
  }

  /* ------------------------------------------------- PÉTALO 1 · tablero */

  function armarClasificacion(p, cuerpo, pie, completo) {
    var resp = estadoRespuesta(p.n);
    filasDeItems(p, cuerpo, resp, completo, function () { dibujarTarea(); });

    if (completo) {
      nota(pie, 'Pétalo completado. La clasificación registrada ya no se modifica.');
      return;
    }
    var faltan = p.items.filter(function (it) { return !resp.asignacion[it.id]; }).length;
    nota(pie, faltan ? faltan + ' afirmación(es) sin clasificar.' : 'Las cinco afirmaciones están clasificadas.');
    var b = botonEnviar(pie, 'REGISTRAR CLASIFICACIÓN', function () { enviarPetalo1(p); });
    b.disabled = bloqueado || faltan > 0;
  }

  function enviarPetalo1(p) {
    var resp = estadoRespuesta(p.n);
    var r = L.validarAsignacion(p.n, resp.asignacion);
    estado.intentos[p.n] += 1;
    if (r.ok) {
      completar(p, resp);
      return;
    }
    estado.errores += 1;
    registrarEvento('Clasificación no válida en Pétalo 1 (error ' + estado.errores + ')');
    var extra = estado.intentos[p.n] >= 2
      ? [r.mal + ' de las 5 afirmaciones están del lado equivocado.']
      : null;
    mostrarDevolucion(null, 'DEVOLUCIÓN', p.devolucionError, extra);
    dibujarRecursos();
  }

  /* ------------------------------------------------ PÉTALO 2 · el cambio */

  function armarSeleccion(p, cuerpo, pie, completo) {
    var resp = estadoRespuesta(p.n);
    var si = p.items.filter(function (it) { return resp.asignacion[it.id] === 'si'; }).length;
    var no = p.items.filter(function (it) { return resp.asignacion[it.id] === 'no'; }).length;

    var cont = crear('div', 'contadores');
    cont.appendChild(contador('Sostenemos', si, p.requiere.si));
    cont.appendChild(contador('No sostenemos', no, p.requiere.no));
    cuerpo.appendChild(cont);

    filasDeItems(p, cuerpo, resp, completo, function () { dibujarTarea(); });

    if (completo) {
      nota(pie, 'Pétalo completado.');
      return;
    }
    var listo = si === p.requiere.si && no === p.requiere.no;
    nota(pie, listo ? 'Selección completa.' : 'Marquen ' + p.requiere.si + ' conclusiones sostenibles y ' + p.requiere.no + ' no sostenible.');
    var b = botonEnviar(pie, 'REGISTRAR CONCLUSIONES', function () { enviarPetalo2(p); });
    b.disabled = bloqueado || !listo;
  }

  function contador(nombre, actual, objetivo) {
    var d = crear('div', 'contador ' + (actual === objetivo ? 'contador--ok' : 'contador--pendiente'));
    d.appendChild(crear('strong', null, actual + '/' + objetivo));
    d.appendChild(crear('span', null, ' ' + nombre));
    return d;
  }

  function enviarPetalo2(p) {
    var resp = estadoRespuesta(p.n);
    var r = L.validarSeleccion(p.n, resp.asignacion);
    estado.intentos[p.n] += 1;
    if (r.ok) { completar(p, resp); return; }
    if (r.motivo === 'cantidad') {
      mostrarDevolucion('info', 'REVISAR', r.detalle);
      return;
    }
    estado.errores += 1;
    registrarEvento('Conclusiones no válidas en Pétalo 2 (error ' + estado.errores + ')');
    var extra = estado.intentos[p.n] >= 2
      ? [r.mal + ' de las 3 marcas no se sostienen con la evidencia disponible.']
      : null;
    mostrarDevolucion(null, 'DEVOLUCIÓN', p.devolucionError, extra);
    dibujarRecursos();
  }

  /* --------------------------------------------- PÉTALO 3 · la revisión */

  function armarRevision(p, cuerpo, pie, completo) {
    var resp = estadoRespuesta(p.n);
    filasDeItems(p, cuerpo, resp, completo, function () { dibujarTarea(); });

    var cols = crear('div', 'columnas-revision');
    p.columnas.forEach(function (col) {
      var caja = crear('div', 'columna-revision');
      caja.appendChild(crear('h3', null, col.etiqueta));
      var asignados = p.items.filter(function (it) { return resp.asignacion[it.id] === col.id; });
      if (!asignados.length) {
        caja.classList.add('columna-revision--vacia');
        caja.appendChild(crear('p', null, 'Sin elementos.'));
      } else {
        var ul = crear('ul');
        asignados.forEach(function (it) {
          var li = crear('li');
          li.appendChild(crear('strong', null, it.id.replace('r', '') + '. '));
          li.appendChild(crear('span', null, it.texto));
          ul.appendChild(li);
        });
        caja.appendChild(ul);
      }
      cols.appendChild(caja);
    });
    cuerpo.appendChild(cols);

    if (!completo) {
      var campo = crear('div', 'campo');
      campo.style.marginTop = '1rem';
      var etiqueta = crear('label', null, p.notaOpcional);
      etiqueta.setAttribute('for', 'nota-revision');
      campo.appendChild(etiqueta);
      var input = crear('input');
      input.type = 'text';
      input.id = 'nota-revision';
      input.value = resp.nota || '';
      input.maxLength = 240;
      input.addEventListener('input', function () { resp.nota = input.value; });
      campo.appendChild(input);
      cuerpo.appendChild(campo);
    } else if (resp.nota) {
      var fin = crear('div', 'respuesta-final');
      fin.appendChild(crear('h3', null, 'FUNDAMENTO REGISTRADO'));
      fin.appendChild(crear('p', null, resp.nota));
      cuerpo.appendChild(fin);
    }

    if (completo) { nota(pie, 'Pétalo completado.'); return; }
    var faltan = p.items.filter(function (it) { return !resp.asignacion[it.id]; }).length;
    nota(pie, faltan ? faltan + ' elemento(s) sin ubicar.' : 'Los 8 elementos están ubicados.');
    var b = botonEnviar(pie, 'REGISTRAR REVISIÓN', function () { enviarPetalo3(p); });
    b.disabled = bloqueado || faltan > 0;
  }

  function enviarPetalo3(p) {
    var resp = estadoRespuesta(p.n);
    var r = L.validarAsignacion(p.n, resp.asignacion);
    estado.intentos[p.n] += 1;
    if (r.ok) {
      var modificados = p.items.filter(function (it) { return resp.asignacion[it.id] === 'modificamos'; }).length;
      registrarEvento('El equipo revisó su lectura: ' + modificados + ' conclusiones modificadas');
      completar(p, resp);
      return;
    }
    estado.errores += 1;
    registrarEvento('Revisión no válida en Pétalo 3 (error ' + estado.errores + ')');
    var extra = estado.intentos[p.n] >= 2
      ? [r.mal + ' de los 8 elementos están en la columna equivocada.']
      : null;
    mostrarDevolucion(null, 'DEVOLUCIÓN', p.devolucionError, extra);
    dibujarRecursos();
  }

  /* ----------------------------------------- PÉTALO 4 · gestión recursos */

  function armarVerificacion(p, cuerpo, pie, completo) {
    var resp = estadoRespuesta(p.n);

    if (completo && estado.verificacion) {
      var elegida = p.opciones.filter(function (o) { return o.id === estado.verificacion.id; })[0];
      var caja = crear('div', 'respuesta-final');
      caja.appendChild(crear('h3', null, 'VERIFICACIÓN SOLICITADA' + (elegida.costo ? ' (+' + elegida.costo + ' s)' : ' (sin costo)')));
      caja.appendChild(crear('p', null, elegida.titulo + '\n\n' + elegida.resultado));
      cuerpo.appendChild(caja);
      nota(pie, 'Pétalo completado.');
      return;
    }

    var caminos = crear('div', 'caminos');
    p.opciones.forEach(function (op) {
      var b = crear('button', 'camino');
      b.type = 'button';
      b.disabled = bloqueado;
      b.setAttribute('aria-pressed', String(resp.opcion === op.id));
      b.appendChild(crear('span', 'camino__id', op.id.toUpperCase().replace('V', 'V')));
      var caja2 = crear('span');
      caja2.appendChild(crear('span', 'camino__titulo', op.titulo));
      caja2.appendChild(crear('span', 'camino__detalle', op.detalle));
      b.appendChild(caja2);
      b.appendChild(crear('span', 'camino__costo' + (op.costo ? '' : ' camino__costo--cero'), op.costo ? '+' + op.costo + ' s' : 'sin costo'));
      b.addEventListener('click', function () {
        if (resp.opcion && resp.opcion !== op.id) L.registrarCambio(estado, p.n, true);
        resp.opcion = op.id;
        dibujarTarea();
      });
      caminos.appendChild(b);
    });
    cuerpo.appendChild(caminos);

    nota(pie, resp.opcion ? 'El costo se suma al confirmar la solicitud.' : 'Seleccionen una opción.');
    var btn = botonEnviar(pie, 'SOLICITAR VERIFICACIÓN', function () { pedirVerificacion(p); });
    btn.disabled = bloqueado || !resp.opcion;
  }

  function pedirVerificacion(p) {
    var resp = estadoRespuesta(p.n);
    var op = p.opciones.filter(function (o) { return o.id === resp.opcion; })[0];
    if (!op) return;
    if (!op.costo) { confirmarVerificacion(p, op); return; }

    var proyectado = L.tiempoTotal(estado) + op.costo;
    abrirModal({
      etiqueta: 'VERIFICACIÓN ADICIONAL',
      titulo: op.titulo,
      parrafos: [op.detalle],
      costo: op.costo,
      costoNota: proyectado >= CASO.limiteSegundos
        ? 'Con este costo, el tiempo total alcanza el límite de 12:00.'
        : 'Tiempo total proyectado: ' + L.formatearTiempo(proyectado) + ' de 12:00.',
      botones: [
        { texto: 'VOLVER' },
        { texto: 'UTILIZAR RECURSO', principal: true, accion: function () { confirmarVerificacion(p, op); } }
      ]
    });
  }

  function confirmarVerificacion(p, op) {
    var resp = estadoRespuesta(p.n);
    estado.intentos[p.n] += 1;
    var r = L.validarVerificacion(op.id);
    if (!r.ok) {
      // No se cobra una verificación que la Dirección no habilita.
      estado.errores += 1;
      registrarEvento('Verificación rechazada por incoherente (error ' + estado.errores + ')');
      mostrarDevolucion(null, 'DEVOLUCIÓN', p.devolucionError);
      return;
    }
    L.aplicarCostoVerificacion(estado, op);
    registrarEvento(op.costo
      ? 'Verificación solicitada: ' + op.titulo + ' (+' + op.costo + ' s)'
      : 'El equipo avanzó sin verificación adicional');
    actualizarRelojes();
    completar(p, resp, op.resultado);
  }

  /* ----------------------------------------------- PÉTALO 5 · la decisión */

  function armarDecision(p, cuerpo, pie, completo) {
    var resp = estadoRespuesta(p.n);

    if (p.cita) {
      var cita = crear('blockquote', 'cita');
      cita.appendChild(crear('p', null, '“' + p.cita + '”'));
      cita.appendChild(crear('footer', null, 'Dirección de VERA INDUSTRIAS'));
      cuerpo.appendChild(cita);
    }

    if (estado.verificacion) {
      var op = L.petalo(4).opciones.filter(function (o) { return o.id === estado.verificacion.id; })[0];
      if (op && op.resultado) {
        var caja = crear('div', 'respuesta-final');
        caja.appendChild(crear('h3', null, 'EVIDENCIA ADICIONAL DISPONIBLE'));
        caja.appendChild(crear('p', null, op.resultado));
        cuerpo.appendChild(caja);
      }
    }

    var caminos = crear('div', 'caminos');
    caminos.style.marginTop = '1rem';
    p.opciones.forEach(function (op2) {
      var b = crear('button', 'camino');
      b.type = 'button';
      b.disabled = completo || bloqueado;
      b.setAttribute('aria-pressed', String(resp.opcion === op2.id));
      b.appendChild(crear('span', 'camino__id', op2.id));
      var caja2 = crear('span');
      caja2.appendChild(crear('span', 'camino__titulo', op2.titulo));
      caja2.appendChild(crear('span', 'camino__detalle', op2.detalle));
      b.appendChild(caja2);
      b.appendChild(crear('span', 'camino__costo camino__costo--cero', ''));
      b.addEventListener('click', function () {
        if (resp.opcion && resp.opcion !== op2.id) L.registrarCambio(estado, p.n, true);
        resp.opcion = op2.id;
        dibujarTarea();
      });
      caminos.appendChild(b);
    });
    cuerpo.appendChild(caminos);

    var campos = crear('div', 'campos');
    p.campos.forEach(function (campo) {
      var caja3 = crear('div', 'campo' + (resp.faltas && resp.faltas[campo.id] ? ' campo--falta' : ''));
      var lab = crear('label', null, campo.etiqueta);
      lab.setAttribute('for', 'campo-' + campo.id);
      caja3.appendChild(lab);
      caja3.appendChild(crear('p', 'campo__ayuda', campo.ayuda));
      var ta = crear('textarea');
      ta.id = 'campo-' + campo.id;
      ta.rows = 3;
      ta.maxLength = 600;
      ta.value = resp.textos[campo.id] || '';
      ta.disabled = completo || bloqueado;
      var cont2 = crear('p', 'campo__contador', L.contarPalabras(ta.value) + ' palabras');
      ta.addEventListener('input', function () {
        resp.textos[campo.id] = ta.value;
        cont2.textContent = L.contarPalabras(ta.value) + ' palabras';
      });
      caja3.appendChild(ta);
      caja3.appendChild(cont2);
      if (resp.faltas && resp.faltas[campo.id]) {
        resp.faltas[campo.id].forEach(function (m) {
          caja3.appendChild(crear('p', 'campo__falta', m));
        });
      }
      campos.appendChild(caja3);
    });
    cuerpo.appendChild(campos);

    if (completo) { nota(pie, 'Decisión registrada. La margarita está completa.'); return; }
    nota(pie, 'La app evalúa la coherencia entre la recomendación y lo que el equipo afirmó que puede y no puede demostrar.');
    var b2 = botonEnviar(pie, 'REGISTRAR DECISIÓN', function () { enviarPetalo5(p); });
    b2.disabled = bloqueado || !resp.opcion;
  }

  function enviarPetalo5(p) {
    var resp = estadoRespuesta(p.n);
    estado.intentos[p.n] += 1;
    var r = L.validarDecision(resp.opcion, resp.textos);

    /* Falta escribir un fundamento: no es un error, es una tarea pendiente. */
    if (r.motivo === 'incompleto') {
      resp.faltas = {};
      r.faltantes.forEach(function (campo) {
        resp.faltas[campo] = ['Escriban al menos ' + r.minimo + ' palabras de fundamento.'];
      });
      mostrarDevolucion('info', 'FALTA FUNDAMENTAR',
        'La decisión se registra con los tres fundamentos escritos. Revisen los campos señalados.');
      dibujarTarea();
      return;
    }

    /* El camino contradice lo que el propio equipo registró: se avisa,
       pero la decisión es del equipo. */
    if (r.advertencia) {
      abrirModal({
        etiqueta: 'REVISIÓN DE COHERENCIA',
        titulo: '¿Confirman esta recomendación?',
        parrafos: [r.advertencia, 'Pueden revisarla o registrarla de todos modos.'],
        botones: [
          { texto: 'REVISAR' },
          {
            texto: 'REGISTRAR DE TODOS MODOS', principal: true,
            accion: function () { registrarDecision(p, resp, r); }
          }
        ]
      });
      return;
    }

    registrarDecision(p, resp, r);
  }

  function registrarDecision(p, resp, r) {
    resp.faltas = {};
    resp.puntaje = r.puntaje;
    resp.validada = L.decisionValida(r.puntaje);

    if (!r.puntaje.coherente) {
      estado.errores += 1;
      registrarEvento('Recomendación registrada sin coherencia con la evidencia (error ' + estado.errores + ')');
    }
    completar(p, resp);
  }

  /* ------------------------------------------------------- completar paso */

  function completar(p, resp, resultadoExtra) {
    estado.respuestas[p.n] = {
      asignacion: JSON.parse(JSON.stringify(resp.asignacion || {})),
      opcion: resp.opcion || null,
      textos: JSON.parse(JSON.stringify(resp.textos || {})),
      nota: resp.nota || '',
      validada: resp.validada === true,
      puntaje: resp.puntaje || null,
      intentos: estado.intentos[p.n]
    };
    L.completarPetalo(estado, p.n);
    registrarEvento('Pétalo ' + p.n + ' completado — ' + p.titulo);

    if (p.n < 5) {
      petaloVisto = p.n + 1;
      dibujarTodo();
      var nuevos = CASO.datos.filter(function (d) { return d.petalo === p.n + 1; });
      abrirModal({
        etiqueta: 'PÉTALO ' + p.n + ' COMPLETADO',
        titulo: p.devolucionOk,
        parrafos: [
          'Se habilita el Pétalo ' + (p.n + 1) + ' — ' + L.petalo(p.n + 1).titulo + '.',
          resultadoExtra || (nuevos.length
            ? 'Nueva información disponible en el tablero: ' + nuevos.map(function (d) { return d.codigo + ' — ' + d.area; }).join(', ') + '.'
            : '')
        ].filter(Boolean),
        botones: [{ texto: 'CONTINUAR', principal: true }]
      });
      return;
    }

    L.finalizar(estado, 'completado');
    detenerReloj();
    actualizarRelojesFinal();
    dibujarTodo();
    guardarResultado();
    abrirModal({
      etiqueta: 'MARGARITA COMPLETA',
      titulo: 'Las cinco etapas están cerradas',
      parrafos: [
        p.devolucionOk,
        'Tiempo real: ' + L.formatearTiempo(L.tiempoReal(estado)) +
        ' · Tiempo adicional por recursos: ' + L.formatearTiempo(estado.segundosExtra) +
        ' · Tiempo total: ' + L.formatearTiempo(L.tiempoTotal(estado)) + '.'
      ],
      botones: [{ texto: 'VER DESEMPEÑO DEL EQUIPO', principal: true, accion: irAlFinal }]
    });
  }

  /* ============================================================ resultado */

  function guardarResultado() {
    try {
      var bruto = window.localStorage.getItem(CLAVE_ALMACEN);
      var todos = bruto ? JSON.parse(bruto) : {};
      if (!todos || typeof todos !== 'object') todos = {};
      todos[estado.equipo] = L.resultado(estado);
      window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(todos));
    } catch (e) {
      // Sin almacenamiento disponible: el resultado se comparte con COPIAR.
    }
  }

  function leerGuardados() {
    try {
      var bruto = window.localStorage.getItem(CLAVE_ALMACEN);
      if (!bruto) return {};
      var todos = JSON.parse(bruto);
      var salida = {};
      Object.keys(todos || {}).forEach(function (k) {
        var r = L.parsearResultado(todos[k]);
        if (r) salida[r.equipo] = r;
      });
      return salida;
    } catch (e) { return {}; }
  }

  function irAlFinal() {
    detenerReloj();
    if (!estado.finalizado) L.finalizar(estado, 'manual');
    guardarResultado();
    mostrarPantalla('pantalla-final');
    $('final-sub').textContent = L.nombreEquipo(estado.equipo) + ' · VERA INDUSTRIAS';
    armarNavFinal();
    dibujarFinal();
  }

  function armarNavFinal() {
    var nav = $('final-nav');
    limpiar(nav);
    [
      { id: 'resultado', texto: 'RESULTADO' },
      { id: 'cierre', texto: 'CIERRE REFLEXIVO' },
      { id: 'comparativo', texto: 'RESULTADO COMPARATIVO' }
    ].forEach(function (s) {
      var b = crear('button', 'boton boton--fino', s.texto);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(seccionFinal === s.id));
      b.addEventListener('click', function () {
        seccionFinal = s.id;
        armarNavFinal();
        dibujarFinal();
        window.scrollTo(0, 0);
      });
      nav.appendChild(b);
    });
  }

  function dibujarFinal() {
    ['resultado', 'cierre', 'comparativo'].forEach(function (s) {
      $('seccion-' + s).classList.toggle('final__seccion--activa', s === seccionFinal);
    });
    if (seccionFinal === 'resultado') dibujarSeccionResultado();
    else if (seccionFinal === 'cierre') dibujarSeccionCierre();
    else dibujarSeccionComparativo();
  }

  function bloque(titulo) {
    var b = crear('section', 'bloque');
    b.appendChild(crear('h2', 'bloque__titulo', titulo));
    return b;
  }

  function indicador(valor, nombre, tono) {
    var d = crear('div', 'indicador' + (tono ? ' indicador--' + tono : ''));
    d.appendChild(crear('p', 'indicador__valor', valor));
    d.appendChild(crear('p', 'indicador__nombre', nombre));
    return d;
  }

  function dibujarSeccionResultado() {
    var cont = $('seccion-resultado');
    limpiar(cont);
    var r = L.resultado(estado);

    var eficacia = bloque('EFICACIA');
    var ind = crear('div', 'indicadores');
    ind.appendChild(indicador(r.petalos + '/5', 'Pétalos completados', r.petalos === 5 ? 'si' : 'no'));
    ind.appendChild(indicador(r.valida ? 'Sí' : 'No', 'Conclusión válida', r.valida ? 'si' : 'no'));
    var camino = estado.respuestas[5] ? estado.respuestas[5].opcion : '—';
    ind.appendChild(indicador(camino || '—', 'Camino recomendado'));
    ind.appendChild(indicador(estado.motivoFin === 'tiempo' ? 'Tiempo agotado' : 'Completo', 'Cierre'));
    eficacia.appendChild(ind);
    cont.appendChild(eficacia);

    var tiempos = bloque('EFICIENCIA · TIEMPO');
    var grid = crear('div', 'tiempos');
    var t1 = crear('div', 'tiempo');
    t1.appendChild(crear('p', 'etiqueta', 'TIEMPO REAL'));
    t1.appendChild(crear('p', 'tiempo__valor', L.formatearTiempo(r.tiempoReal)));
    t1.appendChild(crear('p', 'tiempo__detalle', 'Cronómetro del desafío'));
    grid.appendChild(t1);
    var t2 = crear('div', 'tiempo');
    t2.appendChild(crear('p', 'etiqueta', 'TIEMPO ADICIONAL POR RECURSOS'));
    t2.appendChild(crear('p', 'tiempo__valor', L.formatearTiempo(r.extraTotal)));
    t2.appendChild(crear('p', 'tiempo__detalle',
      'Ayudas: ' + r.extraAyudas + ' s · Verificación: ' + r.extraVerificacion + ' s'));
    grid.appendChild(t2);
    var t3 = crear('div', 'tiempo tiempo--total');
    t3.appendChild(crear('p', 'etiqueta', 'TIEMPO TOTAL'));
    t3.appendChild(crear('p', 'tiempo__valor', L.formatearTiempo(r.tiempoTotal)));
    t3.appendChild(crear('p', 'tiempo__detalle', 'Real + recursos utilizados'));
    grid.appendChild(t3);
    tiempos.appendChild(grid);
    cont.appendChild(tiempos);

    var uso = bloque('EFICIENCIA · RECURSOS Y DECISIONES');
    var ind2 = crear('div', 'indicadores');
    ind2.appendChild(indicador(String(r.ayudas), 'Ayudas utilizadas'));
    ind2.appendChild(indicador(r.ayudasIds.length ? r.ayudasIds.join(' · ') : '—', 'Recursos'));
    ind2.appendChild(indicador(String(r.errores), 'Errores registrados', r.errores ? 'no' : 'si'));
    ind2.appendChild(indicador(String(r.cambios), 'Revisiones de respuesta'));
    ind2.appendChild(indicador(String(r.cambiosDecision), 'Cambios de decisión'));
    ind2.appendChild(indicador(estado.verificacion ? estado.verificacion.id.toUpperCase() : '—', 'Verificación solicitada'));
    uso.appendChild(ind2);
    uso.appendChild(crear('p', 'ayuda-texto',
      'Revisiones: modificaciones de una respuesta ya enviada. Cambios de decisión: cambios en la verificación solicitada o en el camino recomendado.'));
    cont.appendChild(uso);

    var det = r.fundamentoDetalle;
    if (det) {
      var fund = bloque('FUNDAMENTACIÓN DE LA CONCLUSIÓN');
      fund.appendChild(crear('p', 'ayuda-texto',
        'Este puntaje no se muestra durante el desafío. Se arma con la cobertura del análisis, las palabras de fundamento y la coherencia del camino elegido.'));
      var indF = crear('div', 'indicadores');
      indF.appendChild(indicador(det.total + '/' + det.maximo, 'Puntaje de fundamentación',
        det.total >= 50 ? 'si' : 'no'));
      indF.appendChild(indicador(det.dimensiones + '/' + det.dimensionesTotales, 'Dimensiones cubiertas'));
      indF.appendChild(indicador(String(det.palabras), 'Palabras justificadas'));
      indF.appendChild(indicador(det.coherente ? 'Sí' : 'No', 'Camino coherente', det.coherente ? 'si' : 'no'));
      fund.appendChild(indF);
      var desglose = crear('p', 'ayuda-texto');
      desglose.style.marginTop = '.7rem';
      desglose.textContent = 'Desglose: cobertura ' + det.cobertura + ' · palabras ' + det.porPalabras + ' · coherencia ' + det.coherencia + '.';
      fund.appendChild(desglose);
      cont.appendChild(fund);
    }

    if (estado.respuestas[5]) {
      var conclusion = bloque('CONCLUSIÓN DEL EQUIPO');
      L.petalo(5).campos.forEach(function (campo) {
        var caja = crear('div', 'respuesta-final');
        caja.appendChild(crear('h3', null, campo.etiqueta));
        caja.appendChild(crear('p', null, estado.respuestas[5].textos[campo.id] || '—'));
        conclusion.appendChild(caja);
      });
      cont.appendChild(conclusion);
    }

    var recorrido = bloque('RECORRIDO REGISTRADO');
    var ul = crear('ul', 'registro');
    eventos.forEach(function (ev) {
      var li = crear('li');
      li.appendChild(crear('span', null, L.formatearTiempo(ev.t)));
      li.appendChild(crear('span', null, ev.texto));
      ul.appendChild(li);
    });
    recorrido.appendChild(ul);
    var acciones = crear('div', 'acciones');
    acciones.style.marginTop = '1rem';
    var bc = crear('button', 'boton boton--fino', 'COPIAR RESULTADO PARA COMPARAR');
    bc.type = 'button';
    bc.addEventListener('click', function () { copiar(JSON.stringify(L.resultado(estado)), bc); });
    acciones.appendChild(bc);
    recorrido.appendChild(acciones);
    recorrido.appendChild(crear('p', 'ayuda-texto',
      'Si los equipos trabajan en computadoras distintas, copien este texto y péguenlo en la pestaña de resultado comparativo del otro equipo.'));
    cont.appendChild(recorrido);
  }

  /* -------------------------------------------------------------- cierre */

  function dibujarSeccionCierre() {
    var cont = $('seccion-cierre');
    limpiar(cont);
    var c = CASO.cierre;
    var r = L.resultado(estado);

    var intro = bloque(c.titulo);
    c.parrafos.forEach(function (p) {
      var nodo = crear('p', null, p);
      nodo.style.marginBottom = '.6rem';
      intro.appendChild(nodo);
    });
    cont.appendChild(intro);

    var datos = bloque('CÓMO TRABAJÓ EL EQUIPO');
    var ind = crear('div', 'indicadores');
    ind.appendChild(indicador(L.formatearTiempo(r.tiempoReal), 'Tiempo real'));
    ind.appendChild(indicador(L.formatearTiempo(r.extraTotal), 'Tiempo por recursos'));
    ind.appendChild(indicador(L.formatearTiempo(r.tiempoTotal), 'Tiempo total'));
    ind.appendChild(indicador(String(r.ayudas), 'Recursos utilizados'));
    ind.appendChild(indicador(String(r.errores), 'Errores'));
    ind.appendChild(indicador(String(r.cambios), 'Revisiones'));
    ind.appendChild(indicador(String(r.cambiosDecision), 'Cambios de decisión'));
    datos.appendChild(ind);
    cont.appendChild(datos);

    var pregunta = bloque('UNA DECISIÓN CONCRETA');
    pregunta.appendChild(crear('p', null, c.pregunta));
    var ops = crear('div', 'opciones-cierre');
    var guardado = estado.cierre || { opcion: null, textos: {} };
    c.opciones.forEach(function (op) {
      var b = crear('button', 'equipo-opcion');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(guardado.opcion === op.id));
      b.appendChild(crear('span', 'equipo-opcion__sigla', guardado.opcion === op.id ? '■' : '□'));
      b.appendChild(crear('span', 'equipo-opcion__nombre', op.etiqueta));
      b.addEventListener('click', function () {
        guardado.opcion = op.id;
        estado.cierre = guardado;
        dibujarSeccionCierre();
      });
      ops.appendChild(b);
    });
    pregunta.appendChild(ops);

    var campos = crear('div', 'campos');
    c.campos.forEach(function (campo) {
      var caja = crear('div', 'campo');
      var lab = crear('label', null, campo.etiqueta);
      lab.setAttribute('for', 'cierre-' + campo.id);
      caja.appendChild(lab);
      var ta = crear('textarea');
      ta.id = 'cierre-' + campo.id;
      ta.rows = 2;
      ta.maxLength = 500;
      ta.value = (guardado.textos && guardado.textos[campo.id]) || '';
      ta.addEventListener('input', function () {
        if (!guardado.textos) guardado.textos = {};
        guardado.textos[campo.id] = ta.value;
        estado.cierre = guardado;
      });
      caja.appendChild(ta);
      campos.appendChild(caja);
    });
    pregunta.appendChild(campos);

    var acciones = crear('div', 'acciones');
    acciones.style.marginTop = '1rem';
    var bReg = crear('button', 'boton boton--principal', 'DEJAR VISIBLE PARA COMPARTIR');
    bReg.type = 'button';
    bReg.addEventListener('click', function () {
      estado.cierre = guardado;
      estado.cierre.registrado = true;
      dibujarSeccionCierre();
    });
    acciones.appendChild(bReg);
    pregunta.appendChild(acciones);
    cont.appendChild(pregunta);

    if (guardado.registrado) {
      var visible = bloque('LO QUE EL EQUIPO COMPARTE AL CIERRE');
      var elegida = c.opciones.filter(function (o) { return o.id === guardado.opcion; })[0];
      var caja2 = crear('div', 'respuesta-final');
      caja2.appendChild(crear('h3', null, 'SI TUVIÉRAMOS QUE RESOLVERLO NUEVAMENTE'));
      caja2.appendChild(crear('p', null, elegida ? elegida.etiqueta : '—'));
      visible.appendChild(caja2);
      c.campos.forEach(function (campo) {
        var caja3 = crear('div', 'respuesta-final');
        caja3.appendChild(crear('h3', null, campo.etiqueta));
        caja3.appendChild(crear('p', null, (guardado.textos && guardado.textos[campo.id]) || '—'));
        visible.appendChild(caja3);
      });
      cont.appendChild(visible);
    }
  }

  /* --------------------------------------------------------- comparativo */

  function dibujarSeccionComparativo() {
    var cont = $('seccion-comparativo');
    limpiar(cont);

    var guardados = leerGuardados();
    guardados[estado.equipo] = L.resultado(estado);
    if (resultadoExterno && resultadoExterno.equipo !== estado.equipo) {
      guardados[resultadoExterno.equipo] = resultadoExterno;
    }
    var a = guardados[CASO.equipos[0].id] || null;
    var b = guardados[CASO.equipos[1].id] || null;

    var eficacia = bloque('EFICACIA · PRIMER FILTRO');
    var comp = L.comparar(a, b);
    eficacia.appendChild(crear('p', null, comp.mensaje));
    cont.appendChild(eficacia);

    var tabla = bloque('RESULTADO COMPARATIVO');
    var t = crear('table', 'tabla-comparativa');
    var thead = crear('thead');
    var trh = crear('tr');
    trh.appendChild(crear('th', null, 'Indicador'));
    CASO.equipos.forEach(function (eq) { trh.appendChild(crear('th', null, eq.id)); });
    thead.appendChild(trh);
    t.appendChild(thead);

    var filas = [
      ['Pétalos completados', function (r) { return r ? r.petalos + '/5' : '—'; }],
      ['Conclusión válida', function (r) { return r ? (r.valida ? 'Sí' : 'No') : '—'; }],
      ['Tiempo real', function (r) { return r ? L.formatearTiempo(r.tiempoReal) : '—'; }],
      ['Tiempo adicional por recursos', function (r) { return r ? L.formatearTiempo(r.extraTotal) : '—'; }],
      ['Tiempo total', function (r) { return r ? L.formatearTiempo(r.tiempoTotal) : '—'; }],
      ['Ayudas utilizadas', function (r) { return r ? String(r.ayudas) : '—'; }],
      ['Fundamentación', function (r) { return r ? r.fundamento + '/' + (r.fundamentoMaximo || 100) : '—'; }],
      ['Errores', function (r) { return r ? String(r.errores) : '—'; }],
      ['Revisiones', function (r) { return r ? String(r.cambios) : '—'; }]
    ];
    var tbody = crear('tbody');
    filas.forEach(function (f) {
      var tr = crear('tr');
      tr.appendChild(crear('td', null, f[0]));
      tr.appendChild(crear('td', null, f[1](a)));
      tr.appendChild(crear('td', null, f[1](b)));
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    tabla.appendChild(t);
    if (comp.estado === 'comparable') {
      tabla.appendChild(crear('p', 'ayuda-texto',
        'Orden por tiempo total, con errores y recursos como criterios de desempate: ' +
        comp.orden.map(function (r) { return r.nombre + ' (' + L.formatearTiempo(r.tiempoTotal) + ')'; }).join(' · ') + '.'));
    }
    cont.appendChild(tabla);

    var carga = bloque('CARGAR EL RESULTADO DEL OTRO EQUIPO');
    carga.appendChild(crear('p', 'ayuda-texto',
      'Peguen acá el texto que el otro equipo copió con “COPIAR RESULTADO PARA COMPARAR”.'));
    var caja = crear('div', 'pegar-resultado');
    var ta = crear('textarea');
    ta.setAttribute('aria-label', 'Resultado del otro equipo');
    caja.appendChild(ta);
    var msj = crear('p', 'mensaje-sistema');
    var btn = crear('button', 'boton boton--fino', 'CARGAR RESULTADO');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      var r = null;
      try { r = L.parsearResultado(JSON.parse(ta.value)); } catch (e) { r = null; }
      if (!r) {
        msj.className = 'mensaje-sistema mensaje-sistema--error';
        msj.textContent = 'El texto pegado no corresponde a un resultado válido.';
        carga.appendChild(msj);
        return;
      }
      if (r.equipo === estado.equipo) {
        msj.className = 'mensaje-sistema mensaje-sistema--error';
        msj.textContent = 'El resultado pegado corresponde a este mismo equipo.';
        carga.appendChild(msj);
        return;
      }
      resultadoExterno = r;
      try {
        var bruto = window.localStorage.getItem(CLAVE_ALMACEN);
        var todos = bruto ? JSON.parse(bruto) : {};
        todos[r.equipo] = r;
        window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(todos));
      } catch (e) { /* sin almacenamiento */ }
      dibujarSeccionComparativo();
    });
    caja.appendChild(btn);
    carga.appendChild(caja);
    carga.appendChild(msj);
    cont.appendChild(carga);

    var reinicio = bloque('NUEVA RONDA');
    reinicio.appendChild(crear('p', 'ayuda-texto',
      'Al volver a la pantalla inicial se conservan los resultados guardados en esta computadora y el cronómetro arranca de cero.'));
    var acciones = crear('div', 'acciones');
    acciones.style.marginTop = '.8rem';

    var bb = crear('button', 'boton boton--fino', 'BORRAR RESULTADOS GUARDADOS');
    bb.type = 'button';
    bb.addEventListener('click', function () {
      abrirModal({
        etiqueta: 'RESULTADOS GUARDADOS',
        titulo: '¿Borrar los resultados de esta computadora?',
        parrafos: [
          'Se eliminan los resultados de los dos equipos guardados en este navegador. La acción no se puede deshacer.',
          'Conviene hacerlo antes de correr la dinámica con equipos nuevos.'
        ],
        botones: [
          { texto: 'VOLVER' },
          {
            texto: 'BORRAR', principal: true, accion: function () {
              try { window.localStorage.removeItem(CLAVE_ALMACEN); } catch (e) { /* sin almacenamiento */ }
              resultadoExterno = null;
              dibujarSeccionComparativo();
            }
          }
        ]
      });
    });
    acciones.appendChild(bb);

    var bv = crear('button', 'boton boton--fino', 'VOLVER A LA PANTALLA INICIAL');
    bv.type = 'button';
    bv.addEventListener('click', function () {
      window.removeEventListener('beforeunload', avisarRecarga);
      estado = null;
      equipoElegido = null;
      borrador = {};
      eventos = [];
      datosAbiertos = {};
      bloqueado = false;
      seccionFinal = 'resultado';
      totalPrevio = 0;
      Array.prototype.forEach.call($('equipos').children, function (h) { h.setAttribute('aria-pressed', 'false'); });
      $('btn-iniciar').disabled = true;
      mostrarPantalla('pantalla-bienvenida');
    });
    acciones.appendChild(bv);
    reinicio.appendChild(acciones);
    cont.appendChild(reinicio);
  }

  /* ================================================================ init */

  document.addEventListener('click', function (ev) {
    if (ev.target && ev.target.hasAttribute && ev.target.hasAttribute('data-cerrar-modal')) cerrarModal();
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !$('modal').hidden) cerrarModal();
  });

  /* Plegables del panel lateral. */
  function armarPlegable(idBoton, idCuerpo) {
    $(idBoton).addEventListener('click', function () {
      var cuerpo = $(idCuerpo);
      var abrir = cuerpo.hidden;
      cuerpo.hidden = !abrir;
      this.setAttribute('aria-expanded', String(abrir));
    });
  }
  armarPlegable('btn-evidencia', 'datos-lista');
  armarPlegable('btn-registro', 'registro');

  armarBienvenida();
})();
