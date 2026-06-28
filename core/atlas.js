async function loadAtlasMap() {

    try {

        const response = await fetch("images/atlas/ProjectAtlas_Master_v1.4.svg");

        if (!response.ok) {
            throw new Error("Unable to load SVG");
        }

        const svg = await response.text();

        document.getElementById("svgHolder").innerHTML = svg;

        console.log("Atlas SVG Loaded");

    }
    catch(error){

        document.getElementById("svgHolder").innerHTML =
        `
            <div style="
                text-align:center;
                color:#ff6666;
                font-size:22px;
                padding:40px;">
                Failed to load Project Atlas SVG
            </div>
        `;

        console.error(error);

    }

}

loadAtlasMap();
