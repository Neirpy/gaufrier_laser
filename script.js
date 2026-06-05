const els = {
    selectFn: document.getElementById('select-function'),
    btnAddFunction: document.getElementById('btn-add-function'),
    addFunctionPanel: document.getElementById('add-function-panel'),
    customFnName: document.getElementById('custom-fn-name'),
    customFnFormula: document.getElementById('custom-fn-formula'),
    btnSaveFunction: document.getElementById('btn-save-function'),
    btnCancelFunction: document.getElementById('btn-cancel-function'),
    btnClearFunctions: document.getElementById('btn-clear-functions'),
    selectView: document.getElementById('select-view'),
    sliderThickness: document.getElementById('slider-thickness'),
    valThickness: document.getElementById('val-thickness'),
    sliderTolerance: document.getElementById('slider-tolerance'),
    valTolerance: document.getElementById('val-tolerance'),
    valTotalNotch: document.getElementById('val-total-notch'),
    sliderSpacing: document.getElementById('slider-spacing'),
    valSpacing: document.getElementById('val-spacing'),
    sliderMargin: document.getElementById('slider-margin'),
    valMargin: document.getElementById('val-margin'),
    valGridInfo: document.getElementById('val-grid-info'),
    sliderScale: document.getElementById('slider-scale'),
    valScale: document.getElementById('val-scale'),
    sliderBase: document.getElementById('slider-base'),
    valBase: document.getElementById('val-base'),
    checkOptimize: document.getElementById('check-optimize'),
    checkRotate: document.getElementById('check-rotate'),
    inputPlateWidth: document.getElementById('input-plate-width'),
    inputPlateHeight: document.getElementById('input-plate-height'),
    sliderGap: document.getElementById('slider-gap'),
    valGap: document.getElementById('val-gap'),
    container: document.getElementById('canvas-container'),
    btnExport: document.getElementById('btn-export')
};

// --- Fonctions Mathématiques ---
const mathFunctions = {
    himmelblau: (x, y) => Math.pow(x * x + y - 11, 2) + Math.pow(x + y * y - 7, 2),
    rosenbrock: (x, y) => Math.pow(1 - x, 2) + 100 * Math.pow(y - x * x, 2),
    sincos: (x, y) => Math.sin(x) * Math.cos(y) * 10,
    sombrero: (x, y) => {
        const r = Math.sqrt(x * x + y * y);
        return r === 0 ? 10 : (Math.sin(r) / r) * 10;
    }
};

// --- Chargement des Fonctions Personnalisées ---
let customFunctions = JSON.parse(localStorage.getItem('customFunctions')) || {};
for (const [key, data] of Object.entries(customFunctions)) {
    try {
        mathFunctions[key] = new Function('x', 'y', 'return ' + data.formula);
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = data.name + ' (Perso)';
        els.selectFn.appendChild(opt);
    } catch (e) {
        console.error("Invalid custom function", data.formula);
    }
}

// --- Moteur MaxRects Bin Packing ---
class MaxRectsPacker {
    constructor(width, height) {
        this.binWidth = width;
        this.binHeight = height;
        this.freeRectangles = [{ x: 0, y: 0, w: width, h: height }];
    }

    insert(width, height, allowRotation) {
        let bestNode = { x: 0, y: 0, w: 0, h: 0 };
        let bestAreaFit = Infinity;
        let bestShortSideFit = Infinity;
        let rotated = false;

        for (let i = 0; i < this.freeRectangles.length; i++) {
            let rect = this.freeRectangles[i];

            if (rect.w >= width && rect.h >= height) {
                let areaFit = rect.w * rect.h - width * height;
                let shortSideFit = Math.min(rect.w - width, rect.h - height);
                if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && areaFit < bestAreaFit)) {
                    bestNode.x = rect.x; bestNode.y = rect.y; bestNode.w = width; bestNode.h = height;
                    bestShortSideFit = shortSideFit; bestAreaFit = areaFit;
                    rotated = false;
                }
            }

            if (allowRotation && rect.w >= height && rect.h >= width) {
                let areaFit = rect.w * rect.h - width * height;
                let shortSideFit = Math.min(rect.w - height, rect.h - width);
                if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && areaFit < bestAreaFit)) {
                    bestNode.x = rect.x; bestNode.y = rect.y; bestNode.w = height; bestNode.h = width;
                    bestShortSideFit = shortSideFit; bestAreaFit = areaFit;
                    rotated = true;
                }
            }
        }

        if (bestNode.h === 0) return null;

        this.splitFreeNode(bestNode);
        this.pruneFreeList();
        return { x: bestNode.x, y: bestNode.y, rotated: rotated };
    }

    splitFreeNode(usedNode) {
        let newRectangles = [];
        for (let i = 0; i < this.freeRectangles.length; i++) {
            let freeNode = this.freeRectangles[i];

            if (usedNode.x >= freeNode.x + freeNode.w || usedNode.x + usedNode.w <= freeNode.x ||
                usedNode.y >= freeNode.y + freeNode.h || usedNode.y + usedNode.h <= freeNode.y) {
                newRectangles.push(freeNode);
            } else {
                if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.h) {
                    newRectangles.push({ x: freeNode.x, y: freeNode.y, w: freeNode.w, h: usedNode.y - freeNode.y });
                }
                if (usedNode.y + usedNode.h < freeNode.y + freeNode.h) {
                    newRectangles.push({ x: freeNode.x, y: usedNode.y + usedNode.h, w: freeNode.w, h: freeNode.y + freeNode.h - (usedNode.y + usedNode.h) });
                }
                if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.w) {
                    newRectangles.push({ x: freeNode.x, y: freeNode.y, w: usedNode.x - freeNode.x, h: freeNode.h });
                }
                if (usedNode.x + usedNode.w < freeNode.x + freeNode.w) {
                    newRectangles.push({ x: usedNode.x + usedNode.w, y: freeNode.y, w: freeNode.x + freeNode.w - (usedNode.x + usedNode.w), h: freeNode.h });
                }
            }
        }
        this.freeRectangles = newRectangles;
    }

    pruneFreeList() {
        for (let i = 0; i < this.freeRectangles.length; i++) {
            for (let j = i + 1; j < this.freeRectangles.length; j++) {
                let a = this.freeRectangles[i];
                let b = this.freeRectangles[j];
                if (a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h) {
                    this.freeRectangles.splice(i, 1);
                    i--;
                    break;
                }
                if (b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h) {
                    this.freeRectangles.splice(j, 1);
                    j--;
                }
            }
        }
    }
}

// --- Variables d'état globales ---
let pieces = [];
let currentSvgWidth = 0;
let currentSvgHeight = 0;
let exportGap = 5;

// Variables pour le Drag & Drop
let activePieceIndex = null;
let dragOffset = { x: 0, y: 0 };

// --- Moteur de génération géométrique ---
function renderWaffle(preservePositions = false) {
    const fnType = els.selectFn.value;
    const viewMode = els.selectView.value;
    const thickness = parseFloat(els.sliderThickness.value);
    const tolerance = parseFloat(els.sliderTolerance.value);
    const spacing = parseFloat(els.sliderSpacing.value);
    const edgeMarginMath = parseFloat(els.sliderMargin.value);
    const zScale = parseFloat(els.sliderScale.value);
    const baseHeight = parseFloat(els.sliderBase.value);
    exportGap = parseFloat(els.sliderGap.value);

    const resolution = 0.1;
    const visualScale = 10;
    const notchWidth = thickness + tolerance;

    // Grille centrée garantie pour éviter les bords asymétriques/fins
    const nominalSize = 10;
    let numNotches = Math.floor(nominalSize / spacing);
    if (numNotches < 1) numNotches = 1;

    const xValues = [];
    let startPos = -(numNotches * spacing) / 2;
    for (let i = 0; i <= numNotches; i++) xValues.push(startPos + i * spacing);
    const yValues = [...xValues];

    // Calcul des bornes afin de ne pas avoir de bords fins.
    // La marge = distance de matière pleine ajoutée après le bout de l'encoche
    const marginVis = edgeMarginMath * visualScale;

    const evalXMin = (xValues[0] * visualScale - notchWidth / 2 - marginVis) / visualScale;
    const evalXMax = (xValues[xValues.length - 1] * visualScale + notchWidth / 2 + marginVis) / visualScale;

    const evalYMin = (yValues[0] * visualScale - notchWidth / 2 - marginVis) / visualScale;
    const evalYMax = (yValues[yValues.length - 1] * visualScale + notchWidth / 2 + marginVis) / visualScale;

    // Mémorisation des positions manuelles
    let oldPieces = new Map();
    if (preservePositions && pieces.length > 0) {
        pieces.forEach(p => oldPieces.set(p.type + p.num, p));
    }
    pieces = [];

    const getZ = (x, y) => {
        const rawZ = mathFunctions[fnType](x, y);
        let zScaled = 0;
        if (fnType === 'himmelblau') zScaled = Math.max(rawZ / zScale, 0);
        else if (fnType === 'rosenbrock') zScaled = Math.max((rawZ / 1000) / (zScale / 100), 0);
        else zScaled = Math.max((rawZ + 10) / (zScale / 10), 0);
        return (zScaled + baseHeight) * visualScale;
    };

    const pieceWidthX = (evalYMax - evalYMin) * visualScale;
    const pieceWidthY = (evalXMax - evalXMin) * visualScale;

    els.valGridInfo.textContent = `Pièces : ${xValues.length} X, ${yValues.length} Y`;

    const EPSILON = 1e-6;
    const isClose = (a, b) => Math.abs(a - b) < EPSILON;
    const isStrictlyInside = (val, min, max) => val > min + EPSILON && val < max - EPSILON;

    // --- Génération Axe X ---
    xValues.forEach((xVal, index) => {
        const pieceNum = index + 1;
        const pieceWidth = pieceWidthX;
        let pathD = "";
        let maxRowHeight = 0;

        const notches = yValues.map(yVal => {
            const center = (yVal - evalYMin) * visualScale;
            const hIntersect = getZ(xVal, yVal);
            return { left: center - notchWidth / 2, right: center + notchWidth / 2, cutHeight: - (hIntersect / 2) };
        });

        let allXs = [];
        for (let mathY = evalYMin; mathY <= evalYMax + EPSILON; mathY += resolution) allXs.push((mathY - evalYMin) * visualScale);
        notches.forEach(n => { allXs.push(n.left); allXs.push(n.right); });
        allXs = [...new Set(allXs.map(x => Math.round(x * 1000) / 1000))].sort((a, b) => a - b);

        let bottomPoints = [];
        allXs.forEach(localX => {
            if (localX < 0 - EPSILON || localX > pieceWidth + EPSILON) return;
            const insideNotch = notches.find(n => isStrictlyInside(localX, n.left, n.right));
            if (insideNotch) return;
            const isLeftEdge = notches.find(n => isClose(localX, n.left));
            const isRightEdge = notches.find(n => isClose(localX, n.right));

            if (isLeftEdge) { bottomPoints.push({ x: localX, y: 0 }); bottomPoints.push({ x: localX, y: isLeftEdge.cutHeight }); }
            else if (isRightEdge) { bottomPoints.push({ x: localX, y: isRightEdge.cutHeight }); bottomPoints.push({ x: localX, y: 0 }); }
            else { bottomPoints.push({ x: localX, y: 0 }); }
        });

        let topPoints = [];
        allXs.forEach(localX => {
            if (localX < 0 - EPSILON || localX > pieceWidth + EPSILON) return;
            const mathY = (localX / visualScale) + evalYMin;
            const yCoord = -getZ(xVal, mathY);
            topPoints.push({ x: localX, y: yCoord });
            if (-yCoord > maxRowHeight) maxRowHeight = -yCoord;
        });

        bottomPoints.forEach((p, i) => pathD += i === 0 ? `M ${p.x} ${p.y} ` : `L ${p.x} ${p.y} `);
        topPoints.reverse().forEach(p => pathD += `L ${p.x} ${p.y} `);
        pathD += "Z";

        pieces.push({ type: 'X', num: pieceNum, pathD: pathD, w: pieceWidth, h: maxRowHeight });
    });

    // --- Génération Axe Y ---
    yValues.forEach((yVal, index) => {
        const pieceNum = index + 1;
        const pieceWidth = pieceWidthY;
        let pathD = "";
        let maxRowHeight = 0;

        const notches = xValues.map(xVal => {
            const center = (xVal - evalXMin) * visualScale;
            const hIntersect = getZ(xVal, yVal);
            return { left: center - notchWidth / 2, right: center + notchWidth / 2, cutHeight: - (hIntersect / 2) };
        });

        let allXs = [];
        for (let mathX = evalXMin; mathX <= evalXMax + EPSILON; mathX += resolution) allXs.push((mathX - evalXMin) * visualScale);
        notches.forEach(n => { allXs.push(n.left); allXs.push(n.right); });
        allXs = [...new Set(allXs.map(x => Math.round(x * 1000) / 1000))].sort((a, b) => a - b);

        let bottomPoints = [{ x: 0, y: 0 }, { x: pieceWidth, y: 0 }];

        let topPoints = [];
        allXs.forEach(localX => {
            if (localX < 0 - EPSILON || localX > pieceWidth + EPSILON) return;
            const mathX = (localX / visualScale) + evalXMin;
            const yCoord = -getZ(mathX, yVal);
            if (-yCoord > maxRowHeight) maxRowHeight = -yCoord;

            const insideNotch = notches.find(n => isStrictlyInside(localX, n.left, n.right));
            if (insideNotch) return;

            const isLeftEdge = notches.find(n => isClose(localX, n.left));
            const isRightEdge = notches.find(n => isClose(localX, n.right));

            if (isLeftEdge) { topPoints.push({ x: localX, y: yCoord }); topPoints.push({ x: localX, y: isLeftEdge.cutHeight }); }
            else if (isRightEdge) { topPoints.push({ x: localX, y: isRightEdge.cutHeight }); topPoints.push({ x: localX, y: yCoord }); }
            else { topPoints.push({ x: localX, y: yCoord }); }
        });

        pathD += `M ${bottomPoints[0].x} ${bottomPoints[0].y} L ${bottomPoints[1].x} ${bottomPoints[1].y} `;
        topPoints.reverse().forEach(p => pathD += `L ${p.x} ${p.y} `);
        pathD += "Z";

        pieces.push({ type: 'Y', num: pieceNum, pathD: pathD, w: pieceWidth, h: maxRowHeight });
    });

    // --- ALGORITHME D'OPTIMISATION (MAXRECTS) ---
    const optimize = els.checkOptimize.checked;
    const allowRotation = els.checkRotate.checked;
    const plateW = parseFloat(els.inputPlateWidth.value);
    const plateH = parseFloat(els.inputPlateHeight.value);
    const plateMargin = 30;
    let requiredPlates = 1;

    if (optimize) {
        let piecesToPack = pieces.map((p, i) => ({ ...p, originalIndex: i }));
        piecesToPack.sort((a, b) => {
            const maxDimA = Math.max(a.w, a.h);
            const maxDimB = Math.max(b.w, b.h);
            if (Math.abs(maxDimA - maxDimB) > 0.1) return maxDimB - maxDimA;
            return (b.w * b.h) - (a.w * a.h);
        });

        let packers = [];

        const addPacker = () => {
            const packer = new MaxRectsPacker(plateW - exportGap, plateH - exportGap);
            packers.push(packer);
            return packer;
        };

        addPacker();

        piecesToPack.forEach(p => {
            const reqW = p.w + exportGap;
            const reqH = p.h + exportGap;

            let fit = null;
            let targetPlateIndex = -1;

            for (let i = 0; i < packers.length; i++) {
                fit = packers[i].insert(reqW, reqH, allowRotation);
                if (fit) {
                    targetPlateIndex = i;
                    break;
                }
            }

            if (!fit) {
                const newPacker = addPacker();
                targetPlateIndex = packers.length - 1;
                fit = newPacker.insert(reqW, reqH, allowRotation);
            }

            const origP = pieces[p.originalIndex];

            if (fit) {
                const plateOffsetY = targetPlateIndex * (plateH + plateMargin);

                if (fit.rotated) {
                    origP.tx = exportGap + fit.x + p.h / 2 - p.w / 2;
                    origP.ty = plateOffsetY + exportGap + fit.y + p.w / 2 + p.h / 2;
                    origP.r = 90;
                } else {
                    origP.tx = exportGap + fit.x;
                    origP.ty = plateOffsetY + exportGap + fit.y + p.h;
                    origP.r = 0;
                }
            } else {
                origP.tx = exportGap;
                origP.ty = (packers.length) * (plateH + plateMargin) + exportGap + p.h;
                origP.r = 0;
            }
        });

        requiredPlates = packers.length;
        currentSvgWidth = Math.max(plateW, Math.max(...pieces.map(p => p.tx + p.w)) + 50);
        currentSvgHeight = requiredPlates * (plateH + plateMargin);
    } else {
        let maxTx = 0;
        let maxTy = 0;

        pieces.forEach(p => {
            const old = oldPieces.get(p.type + p.num);
            if (old && old.tx !== undefined) {
                p.tx = old.tx;
                p.ty = old.ty;
                p.r = old.r || 0;
            } else {
                p.tx = exportGap;
                p.ty = p.h + exportGap;
                p.r = 0;
            }
            maxTx = Math.max(maxTx, p.tx + p.w);
            maxTy = Math.max(maxTy, p.ty + p.h);
        });

        requiredPlates = Math.max(1, Math.ceil(maxTy / (plateH + plateMargin)));
        currentSvgWidth = Math.max(plateW, maxTx + 50);
        currentSvgHeight = Math.max(requiredPlates * (plateH + plateMargin), maxTy + 50);
    }

    // --- Rendu HTML / SVG ---
    let svgPlates = '';
    if (viewMode === 'all' || viewMode === 'cut') {
        for (let i = 0; i < requiredPlates; i++) {
            const py = i * (plateH + plateMargin);
            svgPlates += `<rect x="0" y="${py}" width="${plateW}" height="${plateH}" class="plate-line" />`;
            svgPlates += `<text x="5" y="${py + 15}" class="plate-text">Plaque de coupe ${i + 1}</text>`;
        }
    }

    let svgGroups = '';
    pieces.forEach((p, index) => {
        const cx = p.w / 2;
        const cy = -p.h / 2;
        const gTransform = `translate(${p.tx}, ${p.ty}) rotate(${p.r || 0}, ${cx}, ${cy})`;

        let groupContent = '';
        groupContent += `<path d="${p.pathD}" class="hitbox" />`;

        if (viewMode === 'all' || viewMode === 'cut') {
            groupContent += `<path d="${p.pathD}" class="cut-line" />`;
        }
        if (viewMode === 'all' || viewMode === 'engrave') {
            const textY = -(baseHeight * visualScale) / 2;
            groupContent += `<text x="${cx}" y="${textY}" class="engrave-text">${p.type}${p.num}</text>`;
        }

        svgGroups += `<g class="draggable-piece cursor-grab" data-index="${index}" transform="${gTransform}">${groupContent}</g>`;
    });

    const currentSvgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -${exportGap * visualScale + 20} ${currentSvgWidth + 40} ${currentSvgHeight + 40}" width="100%" height="100%">
                    <g id="plate-layer">${svgPlates}</g>
                    <g id="waffle-layer">${svgGroups}</g>
                </svg>
            `;

    els.container.innerHTML = currentSvgContent;
}

// --- Logique du Drag & Drop ---

function getMousePosition(evt) {
    const svg = els.container.querySelector('svg');
    if (!svg) return { x: 0, y: 0 };
    const CTM = svg.getScreenCTM();
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
    }
    return {
        x: (clientX - CTM.e) / CTM.a,
        y: (clientY - CTM.f) / CTM.d
    };
}

const startDrag = (e) => {
    const group = e.target.closest('.draggable-piece');
    if (!group) return;
    if (e.type === 'touchstart') e.preventDefault();

    activePieceIndex = parseInt(group.dataset.index);
    const p = pieces[activePieceIndex];
    const pt = getMousePosition(e);

    dragOffset.x = pt.x - p.tx;
    dragOffset.y = pt.y - p.ty;

    group.classList.remove('cursor-grab');
    group.classList.add('cursor-grabbing');

    group.parentNode.appendChild(group);
};

const drag = (e) => {
    if (activePieceIndex === null) return;
    e.preventDefault();
    const pt = getMousePosition(e);
    const p = pieces[activePieceIndex];

    p.tx = pt.x - dragOffset.x;
    p.ty = pt.y - dragOffset.y;

    const group = els.container.querySelector(`.draggable-piece[data-index="${activePieceIndex}"]`);
    if (group) {
        const cx = p.w / 2;
        const cy = -p.h / 2;
        group.setAttribute('transform', `translate(${p.tx}, ${p.ty}) rotate(${p.r || 0}, ${cx}, ${cy})`);
    }

    if (els.checkOptimize.checked) {
        els.checkOptimize.checked = false;
    }
};

const endDrag = (e) => {
    if (activePieceIndex !== null) {
        const group = els.container.querySelector(`.draggable-piece[data-index="${activePieceIndex}"]`);
        if (group) {
            group.classList.remove('cursor-grabbing');
            group.classList.add('cursor-grab');
        }
        activePieceIndex = null;
    }
};

const rotatePiece = (e) => {
    const group = e.target.closest('.draggable-piece');
    if (group) {
        e.preventDefault();
        const index = parseInt(group.dataset.index);
        const p = pieces[index];

        p.r = ((p.r || 0) + 90) % 360;

        const cx = p.w / 2;
        const cy = -p.h / 2;
        group.setAttribute('transform', `translate(${p.tx}, ${p.ty}) rotate(${p.r}, ${cx}, ${cy})`);

        if (els.checkOptimize.checked) {
            els.checkOptimize.checked = false;
        }
    }
};

// --- Attachement des Événements ---

// Formulaire de fonction personnalisée
els.btnAddFunction.addEventListener('click', () => {
    els.addFunctionPanel.classList.toggle('hidden');
});

els.btnCancelFunction.addEventListener('click', () => {
    els.addFunctionPanel.classList.add('hidden');
    els.customFnName.value = '';
    els.customFnFormula.value = '';
});

els.btnClearFunctions.addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment supprimer toutes vos fonctions personnalisées ?")) {
        localStorage.removeItem('customFunctions');
        location.reload();
    }
});

els.btnSaveFunction.addEventListener('click', () => {
    const name = els.customFnName.value.trim();
    const formula = els.customFnFormula.value.trim();
    if (!name || !formula) {
        alert("Veuillez renseigner un nom et une formule valide.");
        return;
    }

    const key = 'custom_' + Date.now();
    try {
        // Test de la formule
        const testFn = new Function('x', 'y', 'return ' + formula);
        testFn(0, 0); // Exécution de test

        customFunctions[key] = { name, formula };
        localStorage.setItem('customFunctions', JSON.stringify(customFunctions));

        mathFunctions[key] = testFn;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = name + ' (Perso)';
        els.selectFn.appendChild(opt);

        els.selectFn.value = key;

        // On cache le panneau et on met à jour
        els.addFunctionPanel.classList.add('hidden');
        els.customFnName.value = '';
        els.customFnFormula.value = '';
        updateUIAndRender();
    } catch (e) {
        alert("Erreur de syntaxe dans la formule : " + e.message);
    }
});

// Drag & Drop
els.container.addEventListener('mousedown', startDrag);
els.container.addEventListener('mousemove', drag);
window.addEventListener('mouseup', endDrag);

els.container.addEventListener('touchstart', startDrag, { passive: false });
els.container.addEventListener('touchmove', drag, { passive: false });
window.addEventListener('touchend', endDrag);

els.container.addEventListener('contextmenu', rotatePiece);
els.container.addEventListener('dblclick', rotatePiece);

// Événements de l'interface
function updateUIAndRender(e) {
    els.valThickness.textContent = parseFloat(els.sliderThickness.value).toFixed(1);
    els.valTolerance.textContent = parseFloat(els.sliderTolerance.value).toFixed(2);
    els.valTotalNotch.textContent = (parseFloat(els.sliderThickness.value) + parseFloat(els.sliderTolerance.value)).toFixed(2);
    els.valSpacing.textContent = parseFloat(els.sliderSpacing.value).toFixed(1);
    els.valMargin.textContent = parseFloat(els.sliderMargin.value).toFixed(1);
    els.valScale.textContent = els.sliderScale.value;
    els.valBase.textContent = parseFloat(els.sliderBase.value).toFixed(1);
    els.valGap.textContent = els.sliderGap.value;

    const preservePositions = (e && (
        e.target.id === 'select-view' ||
        e.target.id === 'input-plate-width' ||
        e.target.id === 'input-plate-height' ||
        e.target.id === 'check-optimize' ||
        e.target.id === 'check-rotate' ||
        e.target.id === 'slider-margin'
    ));

    renderWaffle(preservePositions);
}

const inputs = [
    els.selectFn, els.selectView, els.sliderThickness, els.sliderTolerance,
    els.sliderSpacing, els.sliderMargin, els.sliderScale, els.sliderBase, els.sliderGap,
    els.checkOptimize, els.checkRotate, els.inputPlateWidth, els.inputPlateHeight
];

inputs.forEach(input => {
    input.addEventListener('input', updateUIAndRender);
});

// Fonction d'export
els.btnExport.addEventListener('click', () => {
    const cloneSvg = els.container.querySelector('svg').cloneNode(true);

    cloneSvg.querySelectorAll('.draggable-piece').forEach(g => {
        g.removeAttribute('class');
        g.removeAttribute('data-index');
    });
    cloneSvg.querySelectorAll('.hitbox').forEach(h => h.remove());

    const style = document.createElement('style');
    style.innerHTML = `
                .cut-line { stroke: #FF0000; stroke-width: 0.5px; fill: none; }
                .engrave-text { fill: #000000; font-family: sans-serif; font-size: 8px; text-anchor: middle; dominant-baseline: middle; }
                .plate-line { stroke: #3b82f6; stroke-width: 1px; stroke-dasharray: 5,5; fill: none; }
                .plate-text { fill: #3b82f6; font-family: sans-serif; font-size: 10px; }
            `;
    cloneSvg.prepend(style);

    const svgData = cloneSvg.outerHTML;
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `gaufrier_${els.selectFn.value}_${els.selectView.value}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Initialisation
updateUIAndRender();