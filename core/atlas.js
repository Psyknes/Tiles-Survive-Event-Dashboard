let selectedTile = null;

// ----------------------------
// Atlas Data
// ----------------------------

let tilesData = {};
let stateData = {};
let alliancesData = {};
let seasonData = {};

// ----------------------------
// Load JSON Files
// ----------------------------

async function loadGameData() {

    const [
        tiles,
        state,
        alliances,
        season
    ] = await Promise.all([

        fetch("data/atlas/tiles.json").then(r => r.json()),

        fetch("data/atlas/state.json").then(r => r.json()),

        fetch("data/atlas/alliances.json").then(r => r.json()),

        fetch("data/atlas/season.json").then(r => r.json())

    ]);

    tilesData = tiles;
    stateData = state;
    alliancesData = alliances;
    seasonData = season;

    console.log("Atlas JSON Loaded");

}

async function loadAtlasMap() {

    try {

        const response = await fetch("images/atlas/ProjectAtlas_Master_v1.4.svg");

        if (!response.ok)
            throw new Error("Unable to load SVG");

        const svg = await response.text();

        document.getElementById("svgHolder").innerHTML = svg;

        console.log("Atlas SVG Loaded");

        initialiseAtlas();

    }

    catch (err) {

        console.error(err);

    }

}

function initialiseAtlas() {

    const territories = document.querySelectorAll("#svgHolder svg path, #svgHolder svg rect");

    territories.forEach(tile => {

        if (!tile.id)
            return;

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

    const territory = territoryTypes[prefix];

    document.getElementById("territoryID").textContent = id;

    document.getElementById("territoryType").textContent =
        territory ? territory.name : "Unknown";

    document.getElementById("territoryLevel").textContent =
        territory ? territory.level : "-";

    document.getElementById("territoryOwner").textContent = "Unassigned";

    document.getElementById("territoryStatus").textContent = "Normal";

    document.getElementById("territoryBuff").textContent = "-";

    document.getElementById("territoryDNA").textContent = "-";

    document.getElementById("territoryPoints").textContent = "-";

}

async function startAtlas() {

    await loadGameData();

    await loadAtlasMap();

}

startAtlas();
