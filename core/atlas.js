let selectedTile = null;

// ----------------------------
// Atlas Data
// ----------------------------

let tilesData = {};
let stateData = {};
let alliancesData = {};
let seasonData = {};
let layoutData = {};

// ----------------------------
// Load JSON Files
// ----------------------------

async function loadGameData() {

    const [
    tiles,
    state,
    alliances,
    season,
    layout
] = await Promise.all([

        fetch("data/atlas/tiles.json").then(r => r.json()),

        fetch("data/atlas/state.json").then(r => r.json()),

        fetch("data/atlas/alliances.json").then(r => r.json()),

        fetch("data/atlas/season.json").then(r => r.json()),

        fetch("data/atlas/layout.json").then(r => r.json())

    ]);

    tilesData = tiles;
    stateData = state;
    alliancesData = alliances;
    seasonData = season;
    layoutData = layout;

    console.log("Atlas JSON Loaded");

    // ----------------------------
// Governor
// ----------------------------

const governorAlliance =
    alliancesData.alliances[
        stateData.governor.alliance
    ];

document.getElementById("govAlliance").textContent =
    governorAlliance
        ? `${governorAlliance.tag} - ${governorAlliance.name}`
        : "-";

document.getElementById("govLeader").textContent =
    stateData.governor.player || "-";

}

async function loadAtlasMap() {

    try {

        const response = await fetch("images/atlas/ProjectAtlas_Master_v1.4.svg");

        if (!response.ok)
            throw new Error("Unable to load SVG");

        const svg = await response.text();

        document.getElementById("svgHolder").innerHTML = svg;

        console.log("Atlas SVG Loaded");

        createLabelLayer();

initialiseAtlas();

}

    catch (err) {

        console.error(err);

    }

}

function initialiseAtlas() {

    const territories = document.querySelectorAll(
        "#svgHolder svg path, #svgHolder svg rect"
    );

    territories.forEach(tile => {

        if (!tile.id)
            return;

        // -------------------------
        // Paint Territory
        // -------------------------

        const tileState = stateData.tiles[tile.id];

        if (
            tileState &&
            tileState.owner
        ) {

            const alliance =
                alliancesData.alliances[tileState.owner];

            if (alliance) {

                tile.style.fill = alliance.color;

            }

        }

        // -------------------------
        // Interaction
        // -------------------------

        tile.style.cursor = "pointer";

        tile.addEventListener("mouseenter", () => hoverTile(tile));

        tile.addEventListener("mouseleave", () => unhoverTile(tile));

        tile.addEventListener("click", () => selectTerritory(tile));

    });

   
}

function hoverTile(tile) {

    if (tile === selectedTile)
        return;

    tile.dataset.oldStroke = tile.style.stroke || "";
    tile.dataset.oldWidth = tile.style.strokeWidth || "";

    tile.style.stroke = "#43d66b";
    tile.style.strokeWidth = "3";

}

function unhoverTile(tile) {

    if (tile === selectedTile)
        return;

    tile.style.stroke = tile.dataset.oldStroke || "";
    tile.style.strokeWidth = tile.dataset.oldWidth || "";

}

function selectTerritory(tile) {

    if (selectedTile) {

        selectedTile.style.stroke = "";
        selectedTile.style.strokeWidth = "";

        restoreFill(selectedTile);

    }

    selectedTile = tile;

    rememberFill(tile);

    tile.style.fill = "#FFD54A";
    tile.style.stroke = "#FFD54A";
    tile.style.strokeWidth = "4";

    updateTerritoryPanel(tile.id);

}

function rememberFill(tile) {

    if (!tile.dataset.originalFill) {

        const computed = window.getComputedStyle(tile);

        tile.dataset.originalFill = computed.fill;

    }

}

function restoreFill(tile) {

    if (tile.dataset.originalFill)
        tile.style.fill = tile.dataset.originalFill;

}

function updateTerritoryPanel(id) {

    const prefix = id.split("-")[0];

    const tileInfo = tilesData[prefix];

    const tileState = stateData.tiles[id];

    const currentSeason =
        seasonData.seasons[seasonData.currentSeason];

    const alliance =
        tileState && tileState.owner
            ? alliancesData.alliances[tileState.owner]
            : null;

     // -------------------------
    // Territory
    // -------------------------

    document.getElementById("territoryID").textContent = id;

    document.getElementById("territoryType").textContent =
        tileInfo ? tileInfo.name : "-";

    document.getElementById("territoryLevel").textContent =
        tileInfo ? tileInfo.level : "-";


    // -------------------------
    // Owner
    // -------------------------

    document.getElementById("territoryOwner").textContent =
        alliance
            ? `${alliance.tag} - ${alliance.name}`
            : "Unclaimed";


    // -------------------------
    // Status
    // -------------------------

    if (
        tileState &&
        tileState.protectedUntil
    ) {

        document.getElementById("territoryStatus").textContent =
            "Protected";

    } else {

        document.getElementById("territoryStatus").textContent =
            "Open";

    }


    // -------------------------
    // Buff
    // -------------------------

    if (
        tileInfo &&
        tileInfo.buff
    ) {

        document.getElementById("territoryBuff").textContent =
            `${tileInfo.buff.display} +${tileInfo.buff.value}${tileInfo.buff.unit}`;

    } else {

        document.getElementById("territoryBuff").textContent =
            "-";

    }


    // -------------------------
    // Production
    // -------------------------

    const production =
        currentSeason.production[prefix];

    document.getElementById("territoryDNA").textContent =
        production
            ? `${production}${currentSeason.resource.unit}`
            : "-";


    // -------------------------
    // Contest Points
    // -------------------------

    document.getElementById("territoryPoints").textContent =
        tileInfo
            ? tileInfo.contestPoints
            : "-";
// -------------------------
// Alliance Summary
// -------------------------

document.getElementById("sumAlliance").textContent =
    alliance
        ? `${alliance.tag} - ${alliance.name}`
        : "-";

if (alliance) {

    const ownedTiles = Object.entries(stateData.tiles)
        .filter(([id, tile]) => tile.owner === alliance.tag);

    document.getElementById("sumTiles").textContent =
        ownedTiles.length;

    let totalProduction = 0;
    let totalPoints = 0;

    // Highest buff of each type
    const buffMap = {};

    ownedTiles.forEach(([tileId]) => {

        const prefix = tileId.split("-")[0];

        const tileType = tilesData[prefix];

        totalProduction += currentSeason.production[prefix] || 0;
        totalPoints += tileType.contestPoints || 0;

        if (tileType.buff) {

            const key = tileType.buff.display;

            if (
                !buffMap[key] ||
                tileType.buff.value > buffMap[key].value
            ) {

                buffMap[key] = tileType.buff;

            }

        }

    });

    document.getElementById("sumDNA").textContent =
        `${totalProduction}${currentSeason.resource.unit}`;

    document.getElementById("sumPoints").textContent =
        totalPoints;

    const buffList = Object.values(buffMap);

    if (buffList.length) {

        document.getElementById("sumBuffs").innerHTML =
            "<ul style='margin:0;padding-left:18px'>" +
            buffList.map(buff =>
                `<li>${buff.display} +${buff.value}${buff.unit}</li>`
            ).join("") +
            "</ul>";

    }
    else {

        document.getElementById("sumBuffs").textContent = "-";

    }

}
else {

    document.getElementById("sumTiles").textContent = "-";
    document.getElementById("sumDNA").textContent = "-";
    document.getElementById("sumPoints").textContent = "-";
    document.getElementById("sumBuffs").textContent = "-";

}
}

async function startAtlas() {

    await loadGameData();

    await loadAtlasMap();

}

// ======================================================
// LABEL ENGINE
// ======================================================

function generateLabels() {

    // HTML label system removed.
    // Atlas now uses SVG labels.

}

// =====================================================
// SVG LABEL LAYER
// =====================================================

function createLabelLayer() {

    const svg = document.querySelector("#svgHolder svg");

    if (!svg) return;

    let layer = document.getElementById("atlasLabels");

    if (layer) {

        layer.remove();

    }

    const oldDefs = document.getElementById("atlasLabelDefs");

    if (oldDefs) {

        oldDefs.remove();

    }

    // ----------------------------------
    // SVG Definitions
    // ----------------------------------

    const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
    );

    defs.setAttribute("id", "atlasLabelDefs");

    // Shadow Filter

    const filter = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "filter"
    );

    filter.setAttribute("id", LABEL.shadowId);

    filter.setAttribute("x", "-30%");
    filter.setAttribute("y", "-30%");
    filter.setAttribute("width", "160%");
    filter.setAttribute("height", "160%");

    const shadow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feDropShadow"
    );

    shadow.setAttribute("dx", "0.6");

    shadow.setAttribute("dy", "0.8");

    shadow.setAttribute("stdDeviation", "0.8");

    shadow.setAttribute("flood-opacity", "0.35");

    defs.appendChild(filter);

    filter.appendChild(shadow);

    svg.appendChild(defs);

    // ----------------------------------
    // Label Layer
    // ----------------------------------

    layer = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    layer.setAttribute(
        "id",
        "atlasLabels"
    );

    const metroLayer = document.getElementById("layer4");

if (metroLayer) {

    metroLayer.appendChild(layer);

} else {

    svg.appendChild(layer);

}

    buildLabels();

}

// ======================================================
// LABEL RENDERER CONFIGURATION
// ======================================================

const LABEL = {

    badgeSize: 18,

    plateHeight: 16,

    cornerRadius: 5,

    platePadding: 6,

    plateGap: 2,

    tileIdGap: 8,

    fontFamily: "Segoe UI",

    fontSize: 11,

    tileIdSize: 10,

    textColor: "#F6F6F6",

    shadowId: "atlasLabelShadow",

    borderWidth: 1,

    badgeBorderWidth: 1

};

// ======================================================
// BUILD SVG LABEL OBJECTS
// ======================================================

function buildLabels() {

    const layer = document.getElementById("atlasLabels");

    if (!layer) return;

    layer.innerHTML = "";

    Object.keys(stateData.tiles).forEach(tileId => {

        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        group.setAttribute(
            "id",
            `label-${tileId}`
        );

        group.classList.add("atlasLabel");

        layer.appendChild(group);

    });

Object.keys(stateData.tiles)
    .forEach(tileId => {

        drawLabel(tileId);

    });
    
}

// ======================================================
// DRAW TEST LABEL
// ======================================================

// ======================================================
// DRAW LABEL
// ======================================================

function drawLabel(tileId) {

    const label = document.getElementById(`label-${tileId}`);

    if (!label) return;

    label.innerHTML = "";

    const tile = document.getElementById(tileId);

    if (!tile) return;

    const prefix = tileId.split("-")[0];

    const tileInfo = tilesData[prefix];

    const tileState = stateData.tiles[tileId];

    const alliance =
        tileState.owner &&
        alliancesData.alliances[tileState.owner]
            ? alliancesData.alliances[tileState.owner]
            : null;

    const level = tileInfo.level;

    const displayName = tileInfo.displayName;

    const allianceTag =
        alliance ? alliance.tag : "";

    const plateText =
        alliance
            ? `${allianceTag} | ${displayName}`
            : displayName;

    // --------------------------------------------------
    // Temporary colours
    // (next block will derive light/dark shades)
    // --------------------------------------------------

    const plateColor =
        alliance
            ? alliance.color
            : "#7A7A7A";

    const badgeColor = "#4A4A4A";

    // --------------------------------------------------
    // Draw badge
    // --------------------------------------------------

    const badge = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
    );

    badge.setAttribute("x", 0);

    badge.setAttribute("y", 0);

    badge.setAttribute(
        "width",
        LABEL.badgeSize
    );

    badge.setAttribute(
        "height",
        LABEL.badgeSize
    );

    badge.setAttribute(
        "rx",
        LABEL.cornerRadius
    );

    badge.setAttribute(
        "fill",
        badgeColor
    );

    badge.setAttribute(
        "filter",
        `url(#${LABEL.shadowId})`
    );

    label.appendChild(badge);

    // --------------------------------------------------
    // Badge text
    // --------------------------------------------------

    const lvl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    lvl.textContent = level;

    lvl.setAttribute(
        "x",
        LABEL.badgeSize / 2
    );

    lvl.setAttribute(
        "y",
        13
    );

    lvl.setAttribute(
        "fill",
        LABEL.textColor
    );

    lvl.setAttribute(
        "font-size",
        LABEL.fontSize
    );

    lvl.setAttribute(
        "font-family",
        LABEL.fontFamily
    );

    lvl.setAttribute(
        "text-anchor",
        "middle"
    );

    lvl.setAttribute(
        "filter",
        `url(#${LABEL.shadowId})`
    );

    label.appendChild(lvl);

        // --------------------------------------------------
    // Measure plate text
    // --------------------------------------------------

    const measure = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    measure.setAttribute(
        "font-size",
        LABEL.fontSize
    );

    measure.setAttribute(
        "font-family",
        LABEL.fontFamily
    );

    measure.textContent = plateText;

    label.appendChild(measure);

    const textWidth =
        measure.getComputedTextLength();

    measure.remove();

    const plateWidth =
        textWidth +
        (LABEL.platePadding * 2);

    // --------------------------------------------------
    // Plate
    // --------------------------------------------------

    const plate = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
    );

    plate.setAttribute(
        "x",
        LABEL.badgeSize - 2
    );

    plate.setAttribute(
        "y",
        0
    );

    plate.setAttribute(
        "width",
        plateWidth
    );

    plate.setAttribute(
        "height",
        LABEL.plateHeight
    );

    plate.setAttribute(
        "rx",
        LABEL.cornerRadius
    );

    plate.setAttribute(
        "fill",
        plateColor
    );

    plate.setAttribute(
        "filter",
        `url(#${LABEL.shadowId})`
    );

    label.insertBefore(
        plate,
        lvl
    );

        // --------------------------------------------------
    // Plate Text
    // --------------------------------------------------

    const plateLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    plateLabel.textContent = plateText;

    plateLabel.setAttribute(
        "x",
        LABEL.badgeSize + LABEL.platePadding
    );

    plateLabel.setAttribute(
        "y",
        13
    );

    plateLabel.setAttribute(
        "fill",
        LABEL.textColor
    );

    plateLabel.setAttribute(
        "font-size",
        LABEL.fontSize
    );

    plateLabel.setAttribute(
        "font-family",
        LABEL.fontFamily
    );

    plateLabel.setAttribute(
        "filter",
        `url(#${LABEL.shadowId})`
    );

    label.appendChild(plateLabel);

        // --------------------------------------------------
    // Position
    // --------------------------------------------------

   const svgPoint = getTileCenter(tile);

const labelWidth =
    LABEL.badgeSize - 2 + plateWidth;

const offsetX = -(labelWidth / 2);

const offsetY = -(LABEL.plateHeight / 2);

const layout =
    layoutData[tileId];

let angle = 45;

const box = tile.getBBox();
const center = getTileCenter(tile);

// Left half of map
if (center.x < 442) {
    angle = -45;
}

const dx = 60;
const dy = 90;

label.setAttribute(
    "transform",
    `
    translate(${svgPoint.x + dx}, ${svgPoint.y + dy})
    rotate(${angle})
    translate(${offsetX}, ${offsetY})
    `
);

    console.log("Renderer OK :", tileId);

}

function getTileCenter(tile){

    const box = tile.getBBox();

    const pt = tile.ownerSVGElement.createSVGPoint();

    pt.x = box.x + box.width / 2;
    pt.y = box.y + box.height / 2;

    return pt.matrixTransform(
        tile.getScreenCTM()
    ).matrixTransform(
        tile.ownerSVGElement
            .getScreenCTM()
            .inverse()
    );

}
startAtlas();
