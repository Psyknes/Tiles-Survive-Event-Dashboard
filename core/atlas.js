let selectedTile = null;

// ----------------------------
// Atlas Data
// ----------------------------

let tilesData = {};
let stateData = {};
let alliancesData = {};
let seasonData = {};
let layoutData = {};
let specialShortData = {};

// ----------------------------
// Load JSON Files
// ----------------------------

async function loadGameData() {

    const [
    tiles,
    state,
    alliances,
    season,
    layout,
    specialShort    
] = await Promise.all([

        fetch("data/atlas/tiles.json").then(r => r.json()),

        fetch("data/atlas/state.json").then(r => r.json()),

        fetch("data/atlas/alliances.json").then(r => r.json()),

        fetch("data/atlas/season.json").then(r => r.json()),

        fetch("data/atlas/layout.json").then(r => r.json()),
        
        fetch("data/specialShort.json").then(r => r.json())

    ]);

    tilesData = tiles;
    stateData = state;
    alliancesData = alliances;
    seasonData = season;
    layoutData = layout;
    specialShortData = specialShort;
    
console.log("specialShort loaded:", specialShort);
console.log("specialShortData:", specialShortData);
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


    const shieldSymbol = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "symbol"
);

shieldSymbol.setAttribute("id", "atlasShield");
shieldSymbol.setAttribute("viewBox", "0 0 24 24");

shieldSymbol.innerHTML = `
<path fill="currentColor"
d="M12 2 L19 5 V10
C19 15 15.5 19 12 22
C8.5 19 5 15 5 10
V5 Z"/>
`;

defs.appendChild(shieldSymbol);

   

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

    svg.appendChild(layer);

    buildLabels();

}

// ======================================================
// LABEL RENDERER CONFIGURATION
// ======================================================

const LABEL = {

    badgeSize: 14,

    plateHeight: 12,

    cornerRadius: 3,

    platePadding: 5,

    plateGap: 2,

    tileIdGap: 8,

    fontFamily: "Segoe UI",

    fontSize: 8,

    tileIdSize: 10,

    textColor: "#F6F6F6",
    starColor: "#F4C542",

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

function formatCountdown(targetTime) {

    if (!targetTime) return "";

    const now = new Date();

    const end = new Date(targetTime);

    let diff = Math.floor((end - now) / 1000);

    if (diff <= 0) return "";

    const days = Math.floor(diff / 86400);
    diff %= 86400;

    const hours = Math.floor(diff / 3600);
    diff %= 3600;

    const mins = Math.floor(diff / 60);

    if (days > 0)
        return `${days}d ${hours}h`;

    if (hours > 0)
        return `${hours}h ${mins}m`;

    return `${mins}m`;
}

function getArcadiaTimer() {

    const event = specialShortData.find(
        e => e.name === "Arcadian Conquest"
    );

    if (!event) return null;

    const repeatMs =
        event.repeat * 60 * 60 * 1000;

    const durationMs =
        new Date(event.end) -
        new Date(event.start);

    const now = Date.now();

    let start =
        new Date(event.start).getTime();

    while (start + repeatMs <= now) {
        start += repeatMs;
    }

    let end =
    start + durationMs;

// If the event has already finished,
// move to the next weekly occurrence.
if (now > end) {

    start += repeatMs;
    end += repeatMs;

}

    if (now >= start && now < end) {

        return {
            icon: "battle",
            countdown: formatCountdown(
                new Date(end).toISOString()
            )
        };

console.log({
    start: new Date(start),
    end: new Date(end),
    now: new Date(),
    countdown: formatCountdown(
        new Date(start).toISOString()
    )
});
        
    }

    return {
        icon: "shield",
        countdown: formatCountdown(
            new Date(start).toISOString()
        )
    };

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

    

    // --------------------------------------------------
    // Badge text
    // --------------------------------------------------

    const lvl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    lvl.textContent =
    tileId === "AR-01"
        ? "★"
        : level;

    lvl.setAttribute(
        "x",
        LABEL.badgeSize / 2
    );

    lvl.setAttribute(
        "y",
        10
    );

    lvl.setAttribute(
    "fill",
    tileId === "AR-01"
        ? LABEL.starColor
        : LABEL.textColor
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
           (LABEL.badgeSize - LABEL.plateHeight) / 2
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

    label.appendChild(plate);

    // --------------------------------------------------
// Tile ID
// --------------------------------------------------

const tileLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
);

tileLabel.textContent = tileId;

tileLabel.setAttribute(
    "x",
    LABEL.badgeSize + (plateWidth / 2) - 2
);

tileLabel.setAttribute(
    "y",
    -2
);

tileLabel.setAttribute(
    "fill",
    "#2C2C2C"
);

tileLabel.setAttribute(
    "font-size",
    7.5
);

tileLabel.setAttribute(
    "font-family",
    LABEL.fontFamily
);

    tileLabel.setAttribute(
    "font-weight",
    "bold"
);

tileLabel.setAttribute(
    "text-anchor",
    "middle"
);

label.appendChild(tileLabel);

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
         9 + ((LABEL.badgeSize - LABEL.plateHeight) / 2)
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
// Protection Timer
// --------------------------------------------------

const timerLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
);

    const timerGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
);

// Protection timer
let timerText = "";
let timerIcon = "shield";

if (tileId === "AR-01") {

    const arcadia = getArcadiaTimer();

    console.log("Arcadia Timer:", arcadia);

    if (arcadia) {

        timerText = arcadia.countdown;
        timerIcon = arcadia.icon;

    }

} else {

    const protectedUntil =
        tileState?.protectedUntil;

    const countdown =
        formatCountdown(protectedUntil);

    if (countdown)
        timerText = countdown;
}

timerLabel.textContent = timerText;

    const shieldX =
    LABEL.badgeSize + LABEL.platePadding;

const timerX =
    shieldX + 10;

const timerY =
    LABEL.plateHeight + 10;

timerLabel.setAttribute(
    "x",
    9
);

timerLabel.setAttribute(
    "y",
    0
);

timerLabel.setAttribute(
    "fill",
    "#0000ff"
);

timerLabel.setAttribute(
    "font-size",
    7.5
);

timerLabel.setAttribute(
    "font-family",
    LABEL.fontFamily
);

    timerLabel.setAttribute(
    "font-weight",
    "bold"
);

    timerLabel.setAttribute(
    "filter",
    `url(#${LABEL.shadowId})`
);

    

timerLabel.setAttribute(
    "text-anchor",
    "start"
);

    
if (timerText) {

    if (timerIcon === "battle") {

    const battle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    battle.textContent = "⚔";

    battle.setAttribute("x", 0);
    battle.setAttribute("y", 0);

    battle.setAttribute("font-size", 8);
    battle.setAttribute("font-family", LABEL.fontFamily);
    battle.setAttribute("fill", "#FFD700");

    battle.setAttribute(
        "filter",
        `url(#${LABEL.shadowId})`
    );

    timerGroup.appendChild(battle);

} else {

    const shield = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "use"
    );

    shield.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        "#atlasShield"
    );

    shield.setAttribute("width", 8);
    shield.setAttribute("height", 8);

    shield.setAttribute("x", 0);
    shield.setAttribute("y", -7);

    shield.setAttribute("fill", "#FFFFFF");

    shield.setAttribute(
        "filter",
        `url(#${LABEL.shadowId})`
    );

    timerGroup.appendChild(shield);

}
 
timerGroup.appendChild(timerLabel);
    timerGroup.setAttribute(
    "transform",
    `translate(${LABEL.badgeSize + (plateWidth / 2) - 22}, ${LABEL.plateHeight + 10})`
);

label.appendChild(timerGroup);

}    
    label.appendChild(badge);
label.appendChild(lvl);

  
   // --------------------------------------------------
// Position from SVG Guide
// --------------------------------------------------

const guide = getGuideData(tileId);
    console.log(tileId, tileId + "p", guide);

    console.log(
    "Drawing:",
    tileId,
    "using",
    guide
);

if (!guide) return;

const labelWidth =
    LABEL.badgeSize - 2 + plateWidth;

const offsetX =
    -(labelWidth / 2);

const offsetY =
    -(LABEL.plateHeight / 2);

label.setAttribute(
    "transform",
    `
    translate(${guide.mid.x}, ${guide.mid.y})
    rotate(${guide.angle})
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

function getGuideData(tileId) {

    const guide = document.getElementById(tileId + "p");

    if (!guide) return null;

    const len = guide.getTotalLength();

const svg = guide.ownerSVGElement;

const start = guide.getPointAtLength(0)
    .matrixTransform(guide.getScreenCTM())
    .matrixTransform(svg.getScreenCTM().inverse());

const end = guide.getPointAtLength(len)
    .matrixTransform(guide.getScreenCTM())
    .matrixTransform(svg.getScreenCTM().inverse());

const mid = guide.getPointAtLength(len / 2)
    .matrixTransform(guide.getScreenCTM())
    .matrixTransform(svg.getScreenCTM().inverse());

const angle =
    Math.atan2(
        end.y - start.y,
        end.x - start.x
    ) * 180 / Math.PI;

    return {
        start,
        end,
        mid,
        angle
    };

}

startAtlas();
