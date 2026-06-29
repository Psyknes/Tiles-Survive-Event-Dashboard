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

    generateLabels();

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

    const labelLayer =
        document.getElementById("labelLayer");

    labelLayer.innerHTML = "";

    Object.entries(stateData.tiles).forEach(([tileId, tile]) => {

        const prefix = tileId.split("-")[0];

        const tileInfo = tilesData[prefix];

        const label = document.createElement("div");

        label.className = "atlasLabel";

        label.dataset.tile = tileId;

        let allianceTag = "";

        if (
            tile.owner &&
            alliancesData.alliances[tile.owner]
        ) {

            allianceTag =
                alliancesData.alliances[tile.owner].tag;

        }

        const tileText = allianceTag
            ? `${allianceTag} | ${tileInfo.displayName}`
            : tileInfo.displayName;

        label.innerHTML = `

            <div class="tileID">

                ${tileId}

            </div>

            <div class="namePlate">

                <div class="levelBox">

                    ${tileInfo.level}

                </div>

                <div class="plateText">

                    ${tileText}

                </div>

            </div>

        `;

        labelLayer.appendChild(label);

    });

}

startAtlas();
