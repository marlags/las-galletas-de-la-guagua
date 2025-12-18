/*************************************************
 * ESTADO GLOBAL
 *************************************************/
let accionUsuario = false;
let nombreRecetaActual = '';
let ingredientes = [];
let recetasGuardadas = JSON.parse(localStorage.getItem('recetas')) || [];

/*************************************************
 * UTILIDADES
 *************************************************/
function clp(n) {
    return n.toLocaleString('es-CL');
}

function toggleSection(id) {
    const sec = document.getElementById(id);
    if (sec) sec.classList.toggle('oculto');
}

function guardarLocal() {
    localStorage.setItem('recetas', JSON.stringify(recetasGuardadas));
}

/*************************************************
 * INGREDIENTES
 *************************************************/
function agregarIngrediente() {
    const nombre = ingNombre.value.trim();
    const precio = Number(ingPrecio.value);
    const contenido = Number(ingContenido.value);
    const usado = Number(ingUsado.value);

    if (!nombre || precio <= 0 || contenido <= 0 || usado <= 0) {
        alert('Completa todos los datos del ingrediente');
        return;
    }

    const costo = (precio / contenido) * usado;
    ingredientes.push({ nombre, costo });

    ingNombre.value = '';
    ingPrecio.value = '';
    ingContenido.value = '';
    ingUsado.value = '';

    calcularIngredientes();
}

function calcularIngredientes() {
    let total = 0;
    resumenIngredientes.innerHTML = '';

    ingredientes.forEach(i => {
        total += i.costo;
        resumenIngredientes.innerHTML += `
            <div class="linea">
                <span>${i.nombre}</span>
                <span>$${clp(Math.round(i.costo))}</span>
            </div>
        `;
    });

    totalIngredientes.innerText = `Total ingredientes: $${clp(Math.round(total))}`;
    return total;
}

/*************************************************
 * COSTOS
 *************************************************/
function calcularCostosExtra() {
    const gas = Number(costoGas.value || 0);
    const envases = Number(costoEnvases.value || 0);
    const transporte = Number(costoTransporte.value || 0);
    const horas = Number(horasTrabajo.value || 0);
    const valorHora = Number(valorHoraInput.value || 0);

    const trabajo = horas * valorHora;
    const totalIng = calcularIngredientes();
    const total = totalIng + gas + envases + transporte + trabajo;

    resumenTotal.innerHTML = `
        <div class="linea"><span>Ingredientes</span><span>$${clp(Math.round(totalIng))}</span></div>
        <div class="linea"><span>Gas / luz</span><span>$${clp(Math.round(gas))}</span></div>
        <div class="linea"><span>Envases</span><span>$${clp(Math.round(envases))}</span></div>
        <div class="linea"><span>Transporte</span><span>$${clp(Math.round(transporte))}</span></div>
        <div class="linea"><span>Trabajo</span><span>$${clp(Math.round(trabajo))}</span></div>
        <div class="total"><span>COSTO TOTAL</span><span>$${clp(Math.round(total))}</span></div>
    `;

    return total;
}

/*************************************************
 * PRECIO Y PACKS
 *************************************************/
function calcularPrecioVenta() {
    const total = calcularCostosExtra();
    const unidades = Number(unidadesProducidas.value || 0);
    const margen = Number(margenGanancia.value || 0);

    if (unidades <= 0) {
        resultadoPrecio.innerHTML = 'Indica cuántas unidades produces';
        return;
    }

    const costoUnitario = total / unidades;
    const precio = costoUnitario * (1 + margen / 100);

    resultadoPrecio.innerHTML = `
        <div><b>Unidades:</b> ${unidades}</div>
        <div><b>Costo unitario:</b> $${clp(Math.round(costoUnitario))}</div>
        <div><b>Precio sugerido:</b> $${clp(Math.round(precio))}</div>
    `;

    window._precioUnitario = precio;
    window._costoUnitario = costoUnitario;

    calcularPacks();
}

function calcularPacks() {
    if (!window._precioUnitario) return;

    const packs = [
        { u: 2, f: 1 },
        { u: 3, f: 0.87 },
        { u: 6, f: 0.8 }
    ];

    resultadoPacks.innerHTML = '';

    packs.forEach(p => {
        let precioPack = Math.ceil(window._precioUnitario * p.u * p.f / 100) * 100;
        const costoPack = window._costoUnitario * p.u;
        const ganancia = precioPack - costoPack;

        resultadoPacks.innerHTML += `
            <div class="pack-card">
                <span class="ganancia-tag">Ganancia $${clp(Math.round(ganancia))}</span>
                <strong>${p.u} unidades</strong>
                <span>Precio: $${clp(precioPack)} | Unidad: $${clp(Math.round(precioPack/p.u))}</span>
            </div>
        `;
    });
}

/*************************************************
 * GUARDAR RECETAS
 *************************************************/
function mostrarAdvertenciaGuardado() {
    return confirm(
        '⚠️ Las recetas se guardan solo en este celular.\n' +
        'Si borras la app se perderán.\n\n¿Deseas continuar?'
    );
}

function guardarReceta() {
    if (ingredientes.length === 0) {
        alert('Agrega ingredientes antes de guardar');
        return;
    }

    if (!mostrarAdvertenciaGuardado()) return;

    const nombre = prompt('Nombre de la receta');
    if (!nombre) return;

    recetasGuardadas.push({
        id: Date.now(),
        nombre,
        ingredientes,
        resumen: resumenTotal.innerHTML,
        precio: resultadoPrecio.innerHTML,
        packs: resultadoPacks.innerHTML,
        favorita: false
    });

    guardarLocal();
    renderRecetas();
    alert('Receta guardada 💜');
}

function renderRecetas() {
    listaRecetas.innerHTML = '';

    recetasGuardadas
        .sort((a,b)=> b.favorita - a.favorita)
        .forEach(r => {
            listaRecetas.innerHTML += `
                <div class="card">
                    <b>${r.nombre}</b>
                    <div style="margin-top:8px">
                        <button onclick="cargarReceta(${r.id})">📂 Cargar</button>
                        <button onclick="borrarReceta(${r.id})">🗑️</button>
                        <button onclick="toggleFav(${r.id})">${r.favorita?'⭐':'☆'}</button>
                    </div>
                </div>
            `;
        });
}

function cargarReceta(id) {
    const r = recetasGuardadas.find(x => x.id === id);
    if (!r) return;

    ingredientes = r.ingredientes;
    calcularIngredientes();

    resumenTotal.innerHTML = r.resumen;
    resultadoPrecio.innerHTML = r.precio;
    resultadoPacks.innerHTML = r.packs;
}

function borrarReceta(id) {
    if (!confirm('¿Eliminar receta?')) return;
    recetasGuardadas = recetasGuardadas.filter(r => r.id !== id);
    guardarLocal();
    renderRecetas();
}

function toggleFav(id) {
    const r = recetasGuardadas.find(x => x.id === id);
    if (!r) return;
    r.favorita = !r.favorita;
    guardarLocal();
    renderRecetas();
}

/*************************************************
 * EXPORTAR
 *************************************************/
function pedirNombreReceta() {
    const n = prompt('Nombre del reporte');
    return n ? n.trim() : null;
}

function exportarPDF() {
    const n = pedirNombreReceta();
    if (!n) return;

    nombreRecetaActual = n;
    accionUsuario = true;
    generarReporte();
    window.print();
    cerrarReporte();
}

function exportarImagen() {
    const n = pedirNombreReceta();
    if (!n) return;

    nombreRecetaActual = n;
    accionUsuario = true;
    generarReporte();

    html2canvas(reporte,{scale:2}).then(c=>{
        const a=document.createElement('a');
        a.href=c.toDataURL();
        a.download=`${n}.png`;
        a.click();
        cerrarReporte();
    });
}

function generarReporte() {
    if (!accionUsuario) return;

    reporte.classList.remove('oculto');
    reporte.querySelector('.rep-titulo').innerText = nombreRecetaActual;
    reporte.querySelector('.fecha').innerText =
        new Date().toLocaleDateString('es-CL');

    const ing = reporte.querySelector('.rep-ingredientes');
    ing.innerHTML = '';
    ingredientes.forEach(i=>{
        ing.innerHTML+=`<div class="linea"><span>${i.nombre}</span><span>$${clp(Math.round(i.costo))}</span></div>`;
    });

    reporte.querySelector('.rep-costos').innerHTML = resumenTotal.innerHTML;
    reporte.querySelector('.rep-packs').innerHTML = resultadoPacks.innerHTML;
}

function cerrarReporte() {
    reporte.classList.add('oculto');
    accionUsuario=false;
    nombreRecetaActual='';
}

/*************************************************
 * LIMPIAR TODO
 *************************************************/
function limpiarTodo() {
    if (!confirm('¿Borrar toda la receta?')) return;

    ingredientes=[];
    document.querySelectorAll('input').forEach(i=>i.value='');
    resumenIngredientes.innerHTML='';
    totalIngredientes.innerText='';
    resumenTotal.innerHTML='';
    resultadoPrecio.innerHTML='';
    resultadoPacks.innerHTML='';
}
