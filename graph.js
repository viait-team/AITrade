// === DATA DEFINITIONS (WITH CORRECTION) ===

const levelColors = {
    0: "#1f77b4", 1: "#2ca02c", 2: "#ff7f0e", 3: "#d62728", 4: "#7f7f7f"
};
const nodes = [
    { id: "P (Observed Market Price)", level: 0 }, { id: "E (Reported Earnings)", level: 0 },
    { id: "PE (Price/Earnings Ratio)", level: 1 }, { id: "g (Projected Growth Rate)", level: 1 },
    { id: "g′ (TTM Growth Rate)", level: 1 }, { id: "Cumulative Compound Earnings", level: 2 },
    { id: "PEG (PE to Growth)", level: 2 }, { id: "Fair Value (from fundamentals)", level: 3 },
    { id: "Break-even Threshold", level: 3 }, { id: "Years (Time Horizon)", level: 4 }
];
const links = [
    { source: "P (Observed Market Price)", target: "PE (Price/Earnings Ratio)", label: "derive" },
    { source: "E (Reported Earnings)", target: "PE (Price/Earnings Ratio)", label: "derive" },
    { source: "E (Reported Earnings)", target: "g (Projected Growth Rate)", label: "has" },
    { source: "E (Reported Earnings)", target: "g′ (TTM Growth Rate)", label: "has" },
    { source: "g (Projected Growth Rate)", target: "Cumulative Compound Earnings", label: "compound" },
    { source: "g′ (TTM Growth Rate)", target: "Cumulative Compound Earnings", label: "compound" },
    { source: "PE (Price/Earnings Ratio)", target: "PEG (PE to Growth)", label: "derive" },
    { source: "g (Projected Growth Rate)", target: "PEG (PE to Growth)", label: "derive" },
    { source: "P (Observed Market Price)", target: "Fair Value (from fundamentals)", label: "derive" },
    // === FIX 1: REMOVED THE EXTRA PARENTHESIS FROM THE SOURCE ID BELOW ===
    { source: "Cumulative Compound Earnings", target: "Fair Value (from fundamentals)", label: "derive" },
    { source: "Fair Value (from fundamentals)", target: "Break-even Threshold", label: "implies" },
    { source: "Break-even Threshold", target: "Years (Time Horizon)", label: "yields" }
];

function drawChart() {
    // 1. SELECT THE CONTAINER AND SVG
    const container = d3.select('#chart-container');
    const svg = d3.select('#my-chart');

    svg.selectAll('*').remove();

    // 2. GET DIMENSIONS
    const width = container.node().getBoundingClientRect().width;
    // === FIX 2: MAKE HEIGHT CALCULATION ROBUST (e.g., a 4:3 aspect ratio) ===
    const height = width * 0.75; 
    svg.attr('viewBox', `0 0 ${width} ${height}`); // Helps with responsiveness

    // Create a main group for all chart elements
    const g = svg.append("g").attr("id", "chart-group");

    g.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#999");

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(160))
        .force("charge", d3.forceManyBody().strength(-600))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links).join("line")
        .attr("class", "link")
        .attr("marker-end", "url(#arrow)");

    const linkLabels = g.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(links).join("text")
        .attr("class", "label")
        .text(d => d.label);

    const node = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes).join("g")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("circle").attr("r", 24).attr("fill", d => levelColors[d.level]);
    node.append("text").attr("x", 30).attr("y", 5).text(d => d.id);

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        linkLabels.attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2 - 10);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
        event.sourceEvent.stopPropagation();
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    const zoom = d3.zoom()
        .scaleExtent([0.1, 5])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    simulation.on("end", () => {
        const bbox = g.node().getBBox();
        const scale = Math.min(width / bbox.width, height / bbox.height) * 0.9;
        const translateX = (width - bbox.width * scale) / 2 - bbox.x * scale;
        const translateY = (height - bbox.height * scale) / 2 - bbox.y * scale;

        const initialTransform = d3.zoomIdentity
            .translate(translateX, translateY)
            .scale(scale);

        svg.call(zoom.transform, initialTransform);
    });
}

// === EXECUTION CODE (No changes needed here) ===

// Draw the chart for the first time on page load
drawChart();

// Use ResizeObserver to redraw the chart whenever the container's size changes.
const resizeObserver = new ResizeObserver(() => {
    drawChart();
});

// Make sure your HTML has a div with this id
if (document.getElementById('chart-container')) {
    resizeObserver.observe(document.getElementById('chart-container'));
}