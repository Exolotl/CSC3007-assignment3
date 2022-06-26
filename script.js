var populationMap = new Map();
var areaMap = new Map();

let width = 1200;
let height = 580;

//let margin = {top: 20, right: 20, bottom: 20, left: 20};
let margin = 20;

let map = d3.select("#mapArea")
.append("svg")
.attr("preserveAspectRatio", "xMinYMin meet")
.attr("viewBox", "0 0 " + width + " " + height);

Promise.all([d3.json("sgmap.json"), d3.csv("population2021.csv")])
.then(data => {
    console.log(data[0]);
    console.log(data[1]);

    // Map data for tooltip display
    for (let i = 0; i < data[1].length; i++) {
        populationMap.set(data[1][i].Subzone.toUpperCase(), +data[1][i]['Population']);
        areaMap.set(data[1][i].Subzone.toUpperCase(), data[1][i]['Planning Area'].toUpperCase());
    }

    console.log(populationMap);
    console.log(areaMap);


    let populationDomain = [0, 1, 100, 500, 1000, 5000, 10000, 25000, 50000, 100000]
    let colorRange = ["#ffffd9","#edf8ba","#cdebb4","#97d7b9","#5dc0c0","#32a5c2","#217fb7","#2255a4","#1e3489","#081d58"]

    let populationColor = d3.scaleThreshold()
        .domain(populationDomain)
        .range(colorRange);
    
    // Map and projection
    var projection = d3.geoMercator()
        .center([103.851959, 1.290270])
        .fitExtent([[margin, margin], [width - margin, height-margin]], data[0]);

    let geopath = d3.geoPath().projection(projection);

    let tooltip = d3.select(".tooltip")
        .style("opacity", 0)
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    let mouseover = function(d) {
        // Tooltip
        tooltip
            .style("opacity", 0.9);
        d3.select(this)
            .transition()
            .style("stroke", "black")
            .style("opacity", 0.6)
            .style('stroke-width', '1px');
    }

    // mousemove events
    let mousemove = function(event, d) {
        tooltip
            .html("Area: " + (areaMap.get(d.properties.Name)||"NIL") 
            + "<br>" + 
            "Subzone: " + d.properties.Name 
            + "<br>" + 
            "Population: " + (populationMap.get(d.properties.Name)||0))
            .style("position", "absolute")
            .style("top", (event.pageY - margin)+"px")
            .style("left",(event.pageX + margin)+"px");
    }

    // mouseleave events
    let mouseleave = function(d) {
        tooltip
            .style("opacity", 0);
        d3.select(this)
            .transition()
            .style("stroke", "gray")
            .style('stroke-width', '0.2px')
            .style("opacity", 1);
    }

    // colour background to match ocean
    map.append("path")
        .datum({type: "Sphere"})
        .attr("id", "ocean")
        .attr("d", geopath)
        .attr("fill", "lightblue");

    map.append("g")
        .attr("id", "districts")
        .selectAll("path")
        .data(data[0].features)
        .enter()
        .append("path")
        .attr("d", geopath)
        .style("stroke", "gray")
        .style('stroke-width', '0.2px')
        .attr("fill", d => populationColor((populationMap.get(d.properties.Name)||0)))
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    
    let size = 25
    map.selectAll("squares")
        .data(populationDomain)
        .enter()
        .append("rect")
        .attr("x", width - 110)
        .attr("y", function(d,i){ return 250 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", size)
        .attr("height", size)
        .style("stroke", "black")
        .style('stroke-width', '0.5px')
        .style("fill", function(d){ return populationColor(d)})
    
    // Add one dot in the legend for each name.
    map.selectAll("labels")
        .data(populationDomain)
        .enter()
        .append("text")
        .attr("x", width - 105 + size*1.2)
        .attr("y", function(d,i){ return 250 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ return populationColor(d)})
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style("stroke", "black")
        .style('stroke-width', '0.5px');
})