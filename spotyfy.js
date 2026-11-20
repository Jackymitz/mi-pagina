/* =========================================================
   script.js  →  el "cerebro" de tu página

   Aquí SOLO necesitas tocar la PARTE 1 (tus canciones).
   Todo lo demás ya funciona solo. Cada parte tiene una
   explicación sencilla de para qué sirve.
   ========================================================= */


/* =========================================================
   PARTE 1: TUS CANCIONES  ⭐ (aquí agregas o cambias canciones)

   Cada canción es un bloque entre llaves { ... } con estos datos:

     titulo   → el nombre que se ve en la tarjeta
     artista  → el artista (debe escribirse igual que en el menú
                "Artistas" del index.html, para que el filtro funcione)
     archivo  → el nombre EXACTO del mp3 (con .mp3). El mp3 debe estar
                en la misma carpeta que index.html
     portada  → el nombre de la imagen de portada (o "" si no tienes)
     top      → true = aparece también en la lista "Top Canciones"

   PARA AGREGAR UNA CANCIÓN: copia un bloque completo, pégalo debajo
   (no olvides la coma al final) y cambia los datos.
   ========================================================= */
const CANCIONES = [
  { titulo: "Amnecia",artista: "Santa Grifa", archivo: "Amnecia.mp3",portada: "imagen2.jpg", top: false },
  { titulo: "Bye Bye",artista: "Gera Mx", archivo: "Bye Bye.M4A",portada: "imagen3.png", top: true  },
  { titulo: "Me Gusta",artista: "Charles Ans", archivo: "Me Gusta.mp3",portada: "imagen4.jpg", top: true  },
  { titulo: "Como Pacman",artista: "Aleman", archivo: "Como Pacman.M4A",portada: "imagen5.png",top: true  },
  { titulo: "Pesao",artista: "Cartel De Santa", archivo: "Pesao.mp3",portada: "imagen6.png",top: true  },
];
/* =========================================================
   PARTE 2: ATAJOS (guardamos las piezas del HTML para usarlas)
   No necesitas tocar nada aquí.
   ========================================================= */
const $ = (id) => document.getElementById(id);

const el = {
  menu:        $("menu"),
  buscador:    $("buscador"),
  banner:      $("banner"),
  secCanciones:$("sec-canciones"),
  tituloCanc:  $("titulo-canciones"),
  gridCanc:    $("grid-canciones"),
  verTodo:     $("ver-todo"),
  secTop:      $("sec-top"),
  listaTop:    $("lista-top"),
  secFav:      $("sec-favoritas"),
  gridFav:     $("grid-favoritas"),
  secRes:      $("sec-resultados"),
  tituloRes:   $("titulo-resultados"),
  gridRes:     $("grid-resultados"),
  menuFav:     $("menu-favoritas"),
  detFav:      $("det-favoritas"),
  aviso:       $("aviso"),
  // reproductor de abajo
  pPortada:    $("p-portada"),
  pTitulo:     $("p-titulo"),
  pArtista:    $("p-artista"),
  pCorazon:    $("p-corazon"),
  pAzar:       $("p-azar"),
  pAnt:        $("p-ant"),
  pPlay:       $("p-play"),
  pSig:        $("p-sig"),
  pRep:        $("p-rep"),
  pActual:     $("p-actual"),
  pTotal:      $("p-total"),
  pProgreso:   $("p-progreso"),
  pVolumen:    $("p-volumen"),
};

// Dibujos (iconos) que usamos al crear tarjetas
const ICONO_CORAZON = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.3 5c2 0 3.7 1.1 5.7 3.2C14 6.1 15.7 5 17.7 5 21 5 23.1 8.5 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>';
const ICONO_PLAY   = '<svg class="ic-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
const ICONO_PAUSA  = '<svg class="ic-pausa" viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
const FONDO_BASE   = "linear-gradient(135deg, #2c2650, #1a1635)";


/* =========================================================
   PARTE 3: MEMORIA (qué canción suena, favoritas, filtros)
   Las favoritas se guardan en el navegador, así que
   no se pierden al cerrar o recargar la página.
   ========================================================= */
let actual = -1;            // número de la canción que suena (-1 = ninguna)
let aleatorio = false;      // botón de aleatorio
let repetir = false;        // botón de repetir canción
let filtroArtista = null;   // artista elegido en el menú (null = todos)

// Cada canción se identifica por "Artista|Título" para recordar las favoritas
const clave = (c) => c.artista + "|" + c.titulo;

let favoritas = new Set();
try {
  favoritas = new Set(JSON.parse(localStorage.getItem("favoritas") || "[]"));
} catch (e) { /* si el navegador no deja guardar, sigue sin guardar */ }

function guardarFavoritas() {
  try { localStorage.setItem("favoritas", JSON.stringify([...favoritas])); } catch (e) {}
}


/* =========================================================
   PARTE 4: UTILIDADES PEQUEÑAS
   ========================================================= */

// Evita que un título raro rompa la página
function esc(texto) {
  return String(texto).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// Para buscar sin importar mayúsculas ni acentos ("alemán" = "aleman")
function normalizar(texto) {
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Convierte segundos a "m:ss"
function formatoTiempo(seg) {
  if (!isFinite(seg)) return "0:00";
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return m + ":" + String(s).padStart(2, "0");
}

// Imagen de portada (si no hay foto, se ve un degradado)
function fondoPortada(c) {
  return c.portada ? `url('${c.portada}'), ${FONDO_BASE}` : FONDO_BASE;
}

// Pinta de color la parte llena de las barras (progreso y volumen)
function pintarBarra(input) {
  const pct = (input.value - input.min) / (input.max - input.min) * 100;
  input.style.setProperty("--pct", pct + "%");
}

// Mensajito flotante (por ejemplo "no encuentro el mp3")
let temporizadorAviso;
function avisar(texto) {
  el.aviso.textContent = texto;
  el.aviso.classList.add("ver");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.aviso.classList.remove("ver"), 5000);
}

// En celular, cierra el menú lateral después de elegir algo
function cerrarMenuEnCelular() {
  if (window.innerWidth <= 900) el.menu.checked = false;
}


/* =========================================================
   PARTE 5: CREAR TARJETAS Y FILAS
   Aquí se arma el HTML de cada tarjeta a partir de CANCIONES.
   Si quieres cambiar cómo luce una tarjeta, es aquí.
   ========================================================= */
function htmlTarjeta(c, i) {
  return `
    <article class="tarjeta" data-i="${i}">
      <div class="portada" style="background-image:${fondoPortada(c)}"></div>
      <button class="corazon" data-fav="${i}" aria-label="Favorita">${ICONO_CORAZON}</button>
      <h3 class="titulo">${esc(c.titulo)}</h3>
      <p class="subtitulo">${esc(c.artista)}</p>
      <div class="boton-play">${ICONO_PLAY}${ICONO_PAUSA}</div>
    </article>`;
}

function htmlFila(c, i, numero) {
  return `
    <div class="fila" data-i="${i}">
      <span class="numero">${numero}</span>
      <div class="mini" style="background-image:${fondoPortada(c)}"></div>
      <div class="columna">
        <span class="titulo">${esc(c.titulo)}</span>
        <span class="subtitulo">${esc(c.artista)}</span>
      </div>
      <button class="corazon" data-fav="${i}" aria-label="Favorita">${ICONO_CORAZON}</button>
    </div>`;
}

// Llena una cuadrícula con tarjetas (o un mensaje si no hay nada)
function llenarGrid(contenedor, indices, mensajeVacio) {
  contenedor.innerHTML = indices.length
    ? indices.map((i) => htmlTarjeta(CANCIONES[i], i)).join("")
    : `<p class="vacio">${mensajeVacio}</p>`;
}


/* =========================================================
   PARTE 6: DIBUJAR LA PÁGINA
   Decide qué se ve según el buscador y el artista elegido.
   ========================================================= */
function dibujar() {
  const todos = CANCIONES.map((_, i) => i);
  const consulta = normalizar(el.buscador.value);

  /* --- Modo búsqueda: solo se ven los resultados --- */
  if (consulta) {
    const resultados = todos.filter((i) => {
      const c = CANCIONES[i];
      return normalizar(c.titulo).includes(consulta) || normalizar(c.artista).includes(consulta);
    });
    el.banner.hidden = true;
    el.secCanciones.hidden = true;
    el.secTop.hidden = true;
    el.secFav.hidden = true;
    el.secRes.hidden = false;
    el.tituloRes.textContent = `Resultados para "${el.buscador.value.trim()}"`;
    llenarGrid(el.gridRes, resultados, "No encontré canciones con ese nombre 😕");
  }
  /* --- Modo normal --- */
  else {
    el.banner.hidden = false;
    el.secCanciones.hidden = false;
    el.secTop.hidden = false;
    el.secFav.hidden = false;
    el.secRes.hidden = true;

    // Sección 1: todas las canciones (o solo las del artista elegido)
    const lista = filtroArtista ? todos.filter((i) => CANCIONES[i].artista === filtroArtista) : todos;
    el.tituloCanc.textContent = filtroArtista ? "Canciones de " + filtroArtista : "Artistas de Hip Hop";
    el.verTodo.hidden = !filtroArtista;
    llenarGrid(el.gridCanc, lista, `Todavía no hay canciones de ${esc(filtroArtista || "")}. Agrégalas en script.js 😉`);

    // Sección 2: Top (solo las que tienen top: true), con números 1, 2, 3...
    const top = todos.filter((i) => CANCIONES[i].top);
    el.listaTop.innerHTML = top.length
      ? top.map((i, n) => htmlFila(CANCIONES[i], i, n + 1)).join("")
      : `<p class="vacio">Pon top: true en alguna canción para verla aquí.</p>`;

    // Sección 3: favoritas
    const favs = todos.filter((i) => favoritas.has(clave(CANCIONES[i])));
    llenarGrid(el.gridFav, favs, "Todavía no tienes favoritas. Toca el ♥ de una canción para guardarla aquí.");
  }

  dibujarMenuFavoritas();
  marcar();
}

// Lista de favoritas en el menú lateral
function dibujarMenuFavoritas() {
  const favs = CANCIONES.map((_, i) => i).filter((i) => favoritas.has(clave(CANCIONES[i])));
  el.menuFav.innerHTML = favs.length
    ? favs.map((i) => `<a href="#" class="enlace" data-i="${i}"><span class="txt">${esc(CANCIONES[i].titulo)}</span></a>`).join("")
    : `<p class="vacio-menu">Aún no tienes favoritas</p>`;
}

// Resalta lo que está sonando y llena los corazones (sin rehacer todo)
function marcar() {
  const sonando = !audio.paused;

  document.querySelectorAll("[data-i]").forEach((nodo) => {
    const esActual = Number(nodo.dataset.i) === actual;
    nodo.classList.toggle("sonando", esActual);
    nodo.classList.toggle("reproduciendo", esActual && sonando);
  });

  document.querySelectorAll("[data-fav]").forEach((boton) => {
    const c = CANCIONES[Number(boton.dataset.fav)];
    boton.classList.toggle("activo", favoritas.has(clave(c)));
  });

  // Corazón del reproductor de abajo
  const cActual = CANCIONES[actual];
  el.pCorazon.classList.toggle("activo", !!cActual && favoritas.has(clave(cActual)));

  // Botón play/pausa de abajo
  el.pPlay.classList.toggle("reproduciendo", sonando);
}


/* =========================================================
   PARTE 7: REPRODUCTOR (el que hace sonar la música)
   ========================================================= */
const audio = new Audio();
audio.preload = "metadata";
audio.volume = 0.7;

// Poner a sonar la canción número i
function reproducir(i) {
  const c = CANCIONES[i];
  if (!c) return;

  // Si tocas la que ya está sonando, solo pausa/continúa
  if (i === actual) { alternar(); return; }

  actual = i;
  audio.src = c.archivo;
  audio.play().catch(() => { /* si falla, el aviso sale en el evento "error" */ });

  // Mostrar datos en el reproductor de abajo
  el.pTitulo.textContent = c.titulo;
  el.pArtista.textContent = c.artista;
  el.pPortada.style.backgroundImage = c.portada ? `url('${c.portada}'), var(--degradado)` : "var(--degradado)";
  el.pProgreso.value = 0;
  pintarBarra(el.pProgreso);
  el.pActual.textContent = "0:00";
  el.pTotal.textContent = "0:00";
  marcar();
}

// Pausa o continúa
function alternar() {
  if (actual === -1) { reproducir(0); return; }   // si no había nada, empieza la primera
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

// Siguiente canción
function siguiente() {
  if (!CANCIONES.length) return;
  if (aleatorio && CANCIONES.length > 1) {
    let n;
    do { n = Math.floor(Math.random() * CANCIONES.length); } while (n === actual);
    return reproducir(n);
  }
  reproducir((actual + 1) % CANCIONES.length);
}

// Canción anterior (si ya pasaron 3 segundos, reinicia la actual)
function anterior() {
  if (!CANCIONES.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  reproducir((actual - 1 + CANCIONES.length) % CANCIONES.length);
}

/* Eventos del audio: avisan cuando pasa algo */
audio.addEventListener("play",  marcar);
audio.addEventListener("pause", marcar);

audio.addEventListener("loadedmetadata", () => {
  el.pTotal.textContent = formatoTiempo(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    el.pProgreso.value = (audio.currentTime / audio.duration) * 1000;
    pintarBarra(el.pProgreso);
  }
  el.pActual.textContent = formatoTiempo(audio.currentTime);
});

audio.addEventListener("ended", () => {
  if (repetir) { audio.currentTime = 0; audio.play(); }
  else siguiente();
});

// Si el mp3 no existe o el nombre está mal escrito
audio.addEventListener("error", () => {
  const c = CANCIONES[actual];
  if (c) avisar(`No encuentro "${c.archivo}". Revisa que esté en la misma carpeta y que el nombre sea idéntico.`);
});


/* =========================================================
   PARTE 8: FAVORITAS (el corazón ♥)
   ========================================================= */
function alternarFavorita(i) {
  const c = CANCIONES[i];
  if (!c) return;
  const k = clave(c);

  if (favoritas.has(k)) {
    favoritas.delete(k);
  } else {
    favoritas.add(k);
    el.detFav.open = true;   // abre "Favoritas" en el menú para que lo veas
  }
  guardarFavoritas();
  dibujar();
}


/* =========================================================
   PARTE 9: BOTONES (qué pasa cuando tocas cada cosa)
   ========================================================= */

// --- Tocar tarjetas, filas y corazones dentro de la página ---
document.querySelector(".contenido").addEventListener("click", (e) => {
  const corazon = e.target.closest("[data-fav]");
  if (corazon) {                       // tocó un ♥
    e.stopPropagation();
    alternarFavorita(Number(corazon.dataset.fav));
    return;
  }
  const tarjeta = e.target.closest("[data-i]");
  if (tarjeta) reproducir(Number(tarjeta.dataset.i));   // tocó una canción
});

// --- Botones del reproductor de abajo ---
el.pPlay.addEventListener("click", alternar);
el.pSig.addEventListener("click", siguiente);
el.pAnt.addEventListener("click", anterior);

el.pAzar.addEventListener("click", () => {
  aleatorio = !aleatorio;
  el.pAzar.classList.toggle("activo", aleatorio);
});
el.pRep.addEventListener("click", () => {
  repetir = !repetir;
  el.pRep.classList.toggle("activo", repetir);
});

// Corazón del reproductor de abajo (para la canción que suena)
el.pCorazon.addEventListener("click", () => {
  if (actual === -1) { avisar("Primero elige una canción 🎵"); return; }
  alternarFavorita(actual);
});

// Barra de progreso: al moverla, saltas a ese momento
el.pProgreso.addEventListener("input", () => {
  pintarBarra(el.pProgreso);
  if (audio.duration) audio.currentTime = (el.pProgreso.value / 1000) * audio.duration;
});

// Volumen
el.pVolumen.addEventListener("input", () => {
  audio.volume = el.pVolumen.value / 100;
  pintarBarra(el.pVolumen);
});

// --- Buscador: filtra mientras escribes ---
el.buscador.addEventListener("input", dibujar);

// --- Menú lateral ---
document.querySelector(".menu-lateral").addEventListener("click", (e) => {
  // Canción de la lista "Favoritas"
  const cancion = e.target.closest("a[data-i]");
  if (cancion) {
    e.preventDefault();
    reproducir(Number(cancion.dataset.i));
    cerrarMenuEnCelular();
    return;
  }

  // Un artista
  const artista = e.target.closest("a[data-artista]");
  if (artista) {
    e.preventDefault();
    el.buscador.value = "";
    filtroArtista = artista.dataset.artista;
    dibujar();
    window.scrollTo({ top: 0 });
    cerrarMenuEnCelular();
    return;
  }

  // Inicio
  if (e.target.closest("#ir-inicio")) {
    e.preventDefault();
    el.buscador.value = "";
    filtroArtista = null;
    dibujar();
    window.scrollTo({ top: 0 });
    cerrarMenuEnCelular();
    return;
  }

  // Buscar (lleva el cursor al buscador)
  if (e.target.closest("#ir-buscar")) {
    e.preventDefault();
    cerrarMenuEnCelular();
    el.buscador.focus();
    return;
  }

  // Borrar favoritas
  if (e.target.closest("#borrar-favoritas")) {
    e.preventDefault();
    if (favoritas.size && confirm("¿Seguro que quieres borrar todas tus favoritas?")) {
      favoritas.clear();
      guardarFavoritas();
      dibujar();
    }
  }
});

// "Ver todo" (quita el filtro de artista)
el.verTodo.addEventListener("click", (e) => {
  e.preventDefault();
  filtroArtista = null;
  dibujar();
});


/* =========================================================
   PARTE 10: ARRANQUE (se ejecuta al abrir la página)
   ========================================================= */
pintarBarra(el.pProgreso);
pintarBarra(el.pVolumen);
dibujar();
