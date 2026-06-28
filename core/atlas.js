async function loadAtlasMap() {

    try {

        const response = await fetch("images/atlas/ProjectAtlas_Master_v1.4.svg");

        if (!response.ok) throw new Error("Unable to load SVG");

        const svg = await response.text();

        document.getElementById("svgHolder").innerHTML = svg;

        console.log("Atlas SVG Loaded");

        // --------------------------------------------------
        // First test
        // --------------------------------------------------

        const arcadia = document.getElementById("AR-01");

        arcadia.style.fill = "#FFD54A";

    }

    catch(error){

        console.error(error);

    }

}

loadAtlasMap();
