/*************************************************
 * ESTADO GLOBAL
 *************************************************/
let accionUsuario = false;
let nombreRecetaActual = '';
let ingredientes = [];
let indiceEditando = null;

/*************************************************
 * UTILIDADES
 *************************************************/
function clp(n) {
    return n.toLocaleString('es-CL');
}

function toggleSection(id) {
    const section = document.getElementById(id);
    if (section) section.classList.toggle('oculto');
}

/*************************************************
 * INGREDIENTES
 *************************************************/

function agregarIngrediente() {
    const nombre = document.getElementById('ingNombre').value.trim();
    const precio = Number(document.getElementById('ingPrecio').value || 0);
    const contenido = Number(document.getElementById('ingContenido').value || 0);
    const usado = Number(document.getElementById('ingUsado').value || 0);

    if (!nombre || precio <= 0 || contenido <= 0 || usado <= 0) {
        alert('Completa todos los datos del ingrediente');
        return;
    }

    const costo = (precio / contenido) * usado;

    if (indiceEditando !== null) {
        ingredientes[indiceEditando] = { nombre, precio, contenido, usado, costo };
        indiceEditando = null;
        document.querySelector('.btn-principal').innerText = '➕ Agregar ingrediente';
    } else {
        ingredientes.push({ nombre, precio, contenido, usado, costo });
    }

    limpiarFormularioIngrediente();
    calcularIngredientes();
}

function calcularIngredientes() {
    let total = 0;
    const res = document.getElementById('resumenIngredientes');
    res.innerHTML = '';

    ingredientes.forEach((i, index) => {
        total += i.costo;

        res.innerHTML += `
        <div class="linea">
            <span>${i.nombre}</span>
            <span>$${clp(Math.round(i.costo))} (${i.usado} g)</span>
            <div class="receta-actions">
                <button onclick="editarIngrediente(${index})">✏️</button>
                <button onclick="eliminarIngrediente(${index})">🗑️</button>
            </div>
        </div>
        `;
    });

    document.getElementById('totalIngredientes').innerText =
        'Total ingredientes: $' + clp(Math.round(total));

    return total;
            }

/*************************************************
 * COSTOS EXTRA + TRABAJO
 *************************************************/
function calcularCostosExtra() {
    const gas = Number(document.getElementById('costoGas').value || 0);
    const envases = Number(document.getElementById('costoEnvases').value || 0);
    const transporte = Number(document.getElementById('costoTransporte').value || 0);
    const horas = Number(document.getElementById('horasTrabajo').value || 0);
    const valorHora = Number(document.getElementById('valorHora').value || 0);

    const trabajo = horas * valorHora;
    const totalIngredientes = calcularIngredientes();

    const total =
        totalIngredientes +
        gas +
        envases +
        transporte +
        trabajo;

    document.getElementById('resumenTotal').innerHTML = `
    <div class="linea"><span>Ingredientes</span><span>$${clp(Math.round(totalIngredientes))}</span></div>
    <div class="linea"><span>Gas / luz / horno</span><span>$${clp(Math.round(gas))}</span></div>
    <div class="linea"><span>Envases</span><span>$${clp(Math.round(envases))}</span></div>
    <div class="linea"><span>Transporte</span><span>$${clp(Math.round(transporte))}</span></div>
    <div class="linea"><span>Trabajo</span><span>$${clp(Math.round(trabajo))}</span></div>
    <div class="total"><span>COSTO TOTAL RECETA</span><span>$${clp(Math.round(total))}</span></div>
  `;

    return total;
}

/*************************************************
 * PRECIO DE VENTA
 *************************************************/
function calcularPrecioVenta() {
    const costoTotal = calcularCostosExtra();
    const unidades = Number(document.getElementById('unidadesProducidas').value || 0);
    const margen = Number(document.getElementById('margenGanancia').value || 0);

    if (unidades <= 0) {
        document.getElementById('resultadoPrecio').innerHTML =
            '⚠️ Debes indicar cuántas unidades produces.';
        return;
    }

    const costoUnitario = costoTotal / unidades;
    const precioVenta = costoUnitario * (1 + margen / 100);

    let alerta = '';
    if (margen < 30) alerta = '👶 Estás cobrando muy barato.';
    else if (margen < 50) alerta = '⚠️ Margen ajustado.';
    else alerta = '✅ Precio saludable.';

    document.getElementById('resultadoPrecio').innerHTML = `
    <div><b>Costo unitario:</b> $${clp(Math.round(costoUnitario))}</div>
    <div><b>Precio sugerido:</b> $${clp(Math.round(precioVenta))}</div>
    <div style="margin-top:8px">${alerta}</div>
  `;

    window._precioUnitario = precioVenta;
    window._costoUnitario = costoUnitario;

    calcularPacks();
}

/*************************************************
 * PACKS (AUTOMÁTICO Y CONVENIENTE)
 *************************************************/
function calcularPacks() {
    if (!window._precioUnitario) return;

    const precioUnitario = window._precioUnitario;
    const costoUnitario = window._costoUnitario;

    const packs = [{
            unidades: 2,
            factor: 1.0
        },
        {
            unidades: 3,
            factor: 0.87
        },
        {
            unidades: 6,
            factor: 0.8
        }
    ];

    let html = '';

    packs.forEach(p => {
        let precioPack = precioUnitario * p.unidades * p.factor;
        precioPack = Math.ceil(precioPack / 100) * 100;

        const costoPack = costoUnitario * p.unidades;
        const ganancia = precioPack - costoPack;
        const precioUnidad = precioPack / p.unidades;

        html += `
      <div class="pack-card">
        <span class="ganancia-tag">Ganancia: $${clp(Math.round(ganancia))}</span>
        <strong>${p.unidades} unidades</strong>
        <span>Precio pack: $${clp(precioPack)} | Unidad: $${clp(Math.round(precioUnidad))}</span>
      </div>
    `;
    });

    document.getElementById('resultadoPacks').innerHTML = html;
}

/*************************************************
 * EXPORTAR
 *************************************************/
function pedirNombreReceta() {
    const nombre = prompt(
        '📝 Nombre de la receta\n\nEj: Galletas navideñas de chocolate'
    );
    if (!nombre || !nombre.trim()) return null;
    return nombre.trim();
}

function exportarPDF() {
    const nombre = pedirNombreReceta();
    if (!nombre) return;

    nombreRecetaActual = nombre;
    accionUsuario = true;

    generarReporte();
    window.print();

    setTimeout(() => cerrarReporte(), 500);
}

function exportarImagen() {
    const nombre = pedirNombreReceta();
    if (!nombre) return;

    nombreRecetaActual = nombre;
    accionUsuario = true;

    generarReporte();
    const reporte = document.getElementById('reporte');

    html2canvas(reporte, {
        scale: 2
    }).then(canvas => {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${nombre}.png`;
        a.click();
        cerrarReporte();
    });
}

/*************************************************
 * REPORTE
 *************************************************/
function generarReporte() {
    if (!accionUsuario) return;

    const reporte = document.getElementById('reporte');
    reporte.classList.remove('oculto');

    reporte.querySelector('.rep-titulo').innerText =
        nombreRecetaActual || 'Receta sin nombre';

    reporte.querySelector('.fecha').innerText =
        'Fecha: ' + new Date().toLocaleDateString('es-CL');

    // Ingredientes
    const ingDiv = reporte.querySelector('.rep-ingredientes');
    ingDiv.innerHTML = '';
    let totalIng = 0;

    ingredientes.forEach(i => {
        totalIng += i.costo;
        ingDiv.innerHTML += `
      <div class="linea">
        <span>${i.nombre}</span>
        <span>$${clp(Math.round(i.costo))}</span>
      </div>
    `;
    });

    ingDiv.innerHTML += `
    <div class="total">
      <span>Total ingredientes</span>
      <span>$${clp(Math.round(totalIng))}</span>
    </div>
  `;

    reporte.querySelector('.rep-costos').innerHTML =
        document.getElementById('resumenTotal').innerHTML;
    
    // Producción y precio
    const repPrecio = reporte.querySelector('.rep-precio');

    const unidades = Number(document.getElementById('unidadesProducidas').value || 0);
    const costoUnitario = window._costoUnitario || 0;
    const precioUnitario = window._precioUnitario || 0;

    repPrecio.innerHTML = `
    <div class="linea">
        <span>Unidades producidas</span>
        <span>${unidades}</span>
    </div>
    <div class="linea">
        <span>Costo unitario</span>
        <span>$${clp(Math.round(costoUnitario))}</span>
    </div>
    <div class="total">
        <span>Precio sugerido</span>
        <span>$${clp(Math.round(precioUnitario))}</span>
    </div>
    `;

    reporte.querySelector('.rep-packs').innerHTML =
        document.getElementById('resultadoPacks').innerHTML;
}

function cerrarReporte() {
    const reporte = document.getElementById('reporte');
    if (reporte) reporte.classList.add('oculto');
    accionUsuario = false;
    nombreRecetaActual = '';
}

/*************************************************
 * LIMPIAR TODO
 *************************************************/
function limpiarTodo() {
    if (!confirm('¿Segura que quieres borrar toda la receta y comenzar de nuevo?')) return;

    ingredientes = [];
    document.querySelectorAll('input').forEach(i => i.value = '');
    document.getElementById('resumenIngredientes').innerHTML = '';
    document.getElementById('totalIngredientes').innerText = '';
    document.getElementById('resumenTotal').innerHTML = '';
    document.getElementById('resultadoPrecio').innerHTML = '';
    document.getElementById('resultadoPacks').innerHTML = '';

    delete window._precioUnitario;
    delete window._costoUnitario;

    cerrarReporte();

    ['sec-costos', 'sec-precio', 'sec-packs', 'sec-exportar'].forEach(id => {
        const s = document.getElementById(id);
        if (s) s.classList.add('oculto');
    });

    document.getElementById('sec-ingredientes').classList.remove('oculto');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

window.addEventListener('load', () => {
    const splash = document.getElementById('splash');
    if (splash) {
        setTimeout(() => {
            splash.style.display = 'none';
        }, 1200); // 1.2 segundos
    }
});

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const btnInstalar = document.getElementById('btnInstalar');
    if (btnInstalar) btnInstalar.classList.remove('oculto');
});

const btnInstalar = document.getElementById('btnInstalar');

if (btnInstalar) {
    btnInstalar.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        await deferredPrompt.userChoice;

        deferredPrompt = null;
        btnInstalar.classList.add('oculto');
    });
}

function compartirWhatsApp() {
    const nombre = pedirNombreReceta();
    if (!nombre) return;

    nombreRecetaActual = nombre;
    accionUsuario = true;

    generarReporte();

    html2canvas(document.getElementById('reporte'), {
            scale: 2
        })
        .then(canvas => {
            canvas.toBlob(blob => {
                const file = new File([blob], `${nombre}.png`, {
                    type: 'image/png'
                });

                if (navigator.share) {
                    navigator.share({
                        files: [file],
                        title: 'Reporte de costos',
                        text: 'Te comparto el reporte de mi receta 🍪'
                    }).catch(() => {});
                } else {
                    alert('Tu navegador no soporta compartir archivos.');
                }

                cerrarReporte();
            });
        });
}

function eliminarIngrediente(index) {
    const ing = ingredientes[index];

    if (!confirm(`¿Eliminar ${ing.nombre}?`)) {
        return;
    }

    ingredientes.splice(index, 1);
    calcularIngredientes();
}

function editarIngrediente(index) {
    const ing = ingredientes[index];

    document.getElementById('ingNombre').value = ing.nombre;
    document.getElementById('ingPrecio').value = ing.precio;
    document.getElementById('ingContenido').value = ing.contenido;
    document.getElementById('ingUsado').value = ing.usado;

    indiceEditando = index;

    document.querySelector('.btn-principal').innerText = '💾 Guardar cambios';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


function recalcularTodo() {
    calcularIngredientes();
    calcularCostosExtra();

    if (window._precioUnitario) {
        calcularPrecioVenta();
    }
}

function limpiarFormularioIngrediente() {
    document.getElementById('ingNombre').value = '';
    document.getElementById('ingPrecio').value = '';
    document.getElementById('ingContenido').value = '';
    document.getElementById('ingUsado').value = '';
}




