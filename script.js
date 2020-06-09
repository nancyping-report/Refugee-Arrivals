var width = document.querySelector("#chart").clientWidth;
var height = document.querySelector("#chart").clientHeight;
var margin = {top: 80, left: 250, right: 150, bottom: 130};
var innerWidth = width - margin.left - margin.right;
var innerHeight = height - margin.top - margin.bottom;

// default value
var selectedDataType = "gross";
var selectedRegion = "Asia";

// create a canvas
var svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
//Set the Label
var xAxisLabel = svg.append("text")
    .attr("class","axisLabel")
    .attr("x", width/2)
    .attr("y", height-margin.bottom/2)
    .text("Year");

var yAxisLabel = svg.append("text")
    .attr("class","axisLabel")
    .attr("transform","rotate(-90)")
    .attr("x",-height/2)
    .attr("y",margin.left/2)
    .text("Total Refugee Arrivals");
//Set xScale and yScale
var xScale = d3.scaleBand()
    .domain(d3.range(2009, 2019, 1)) // Data are extracted from the last 10 years 
    .rangeRound([margin.left, width-margin.right])
    .padding(0.5);

var xAxis = svg.append("g")
    .attr("class","x axis")
    .attr("transform", `translate(0,${height-margin.bottom})`)
    .call(d3.axisBottom().scale(xScale).tickFormat(d3.format("Y")))//format the ticket to 60k instead of 60000
    .selectAll(".tick line")
    .remove();

var yScale = d3.scaleLinear()
    .range([height-margin.bottom, margin.top])
    .domain([0, 60000]);

var yAxis = svg.append("g")
    .attr("class","axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft().scale(yScale).tickFormat(d3.format(".2s")));


// create a function to store the bar chart so don't need to repeatedly write it
function plot_barchart(data, region="Asia", isPerCapita=false) {

    var region_data = data.filter(function(d) {
        return d.region === region;
    });

    if (isPerCapita) {
        region_data = region_data.map(function(d){
            let year = d.year;
            let region = d.region;
            let population = d.population;
            let arrivals_percapita = Math.round(d.arrivals/population * 1000000000) ; // 1billion
            return {"year": year, "region": region, "arrivals":arrivals_percapita, "population":population};
        })

        yAxisLabel.text("Total Refugee Arrivals (Per Billion)");
        
    } else {
        yAxisLabel.text("Total Refugee Arrivals");
    }

    // update y axis
    var y_max = d3.max(region_data, function(d) { return +d.arrivals; });
    yScale.domain([0, (Math.ceil(y_max/1000)+1)*1000]);

    // strech the y scale
    yAxis.transition()
        .duration(1000)
        .call(d3.axisLeft().scale(yScale))

    /*
    grid.transition()
        .duration(1000)
        .call(d3.axisLeft().scale(yScale).tickFormat("").tickSize(-(innerWidth)));
    */

    // use the duration, transition to make the delay effect
    svg.selectAll("rect")
        .data(region_data)
        .transition()
        .duration(1000)
        .attr("x",function(d) { return xScale(d.year); })
        .attr("y", function(d) { return yScale(d.arrivals); })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) { return height - margin.bottom - yScale(d.arrivals); })
        .attr("fill", "#2F4A6D");
    
    // draw the bars
    var bars = svg.selectAll("rect")
        .data(region_data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return xScale(d.year); })
        .attr("y", function(d) { return yScale(d.arrivals); })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) { return height - margin.bottom - yScale(d.arrivals); })
        .attr("fill", "#2F4A6D")

        


    // add the mouseover effect 
    //add the tooltip
    var tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip");

    bars.on("mouseover", function(d){ 
        if (selectedDataType == "gross") {
            d3.select(this)
            .attr("fill", "#80cbc4")
            .attr("stroke", "#80cbc4")
        }else{
            d3.select(this)
            .attr("fill", "lightsalmon")
            .attr("stroke", "lightsalmon")
        }
        d3.select(this)
            .attr("width", xScale.bandwidth()+2)
            .attr("height", function(d) { return height - margin.bottom - yScale(d.arrivals)+2; })

        var x = +d3.select(this).attr("x")+20; 
        var y = +d3.select(this).attr("y")-10;

        tooltip.style("visibility", "visible")
        .style("left", x + "px")
        .style("top", y + "px")
        .text(d.region + " : " + d.arrivals);
        
    }).on("mouseout", function(){ 
        d3.select(this)
            .attr("fill","#2F4A6D")
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            .attr("width", xScale.bandwidth())
            .attr("height", function(d) { return height - margin.bottom - yScale(d.arrivals); })
            tooltip.style("visibility", "hidden");
    })
    
};





var promises = [
    d3.csv("./data/Refugee(arrivals)_2009-2018.csv"), 
    d3.csv("./data/Population.csv")
];

// load data
Promise.all(promises).then(function(csv_data) {

    var refugee_data = csv_data[0];
    var population_data = csv_data[1];

    // merged datasets
    var merged_data = refugee_data.map(function(r) {
        let year = r.year;
        let region = r.region;
        let arrivals = r.arrivals;
        let population = population_data.filter(function(p) {
            return p.year == year && p.region == region;
        })[0]["population"];
        return {"year": year, "region": region, "arrivals":arrivals, "population":population};
    })


    // default page
    plot_barchart(merged_data)

    regions = merged_data.map(function(d){ return d.region});

    // click effect
    regions.forEach(function(region) {
        //https://stackoverflow.com/questions/5963182/how-to-remove-spaces-from-a-string-using-javascript
        //;.replace(/\s/g, '')) remove the space between words
        let selected_button = d3.select("#" + region.replace(/\s/g, ''));
        selected_button.on("click", function(){
            
            // change to the original color of the last selected button
            d3.select("#" + selectedRegion.replace(/\s/g, '')).style("background-color","#2F4A6D");
            // highlight selected button
            selected_button.style("background-color","steelblue");

            // gross mode
            if (selectedDataType == "gross") {
                plot_barchart(merged_data, region, false);
            } else {
                // per capita mode
                plot_barchart(merged_data, region, true);
    
                d3.select("#title")
                    .text("Total Refugee Arrivals To U.S. From " + region + " Between Fiscal Year 2009 And 2018 (Per Capita)");
            }
            selectedRegion = region;

        });
    });

    // drop-down options for gross data or data per capita
    d3.select("#gross").on("click", function(){
        //let selected_region = d3.select("#region_placeholder").attr("value");
        plot_barchart(merged_data, selectedRegion, false);

        d3.select("#title")
            .text("Total Refugee Arrivals To U.S. From " + selectedRegion + " Between Fiscal Year 2009 And 2018");
        selectedDataType = "gross";
    });

    d3.select("#perCapita").on("click", function(){
        //let selected_region = d3.select("#region_placeholder").attr("value");
        plot_barchart(merged_data, selectedRegion, true);

        d3.select("#title")
            .text("Total Refugee Arrivals To U.S. From " + selectedRegion + " Between Fiscal Year 2009 And 2018 (Per Capita)");

        selectedDataType = "perCapita";
    });

});
