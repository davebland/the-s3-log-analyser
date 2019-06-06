/* 
    THE S3 LOG ANALYSER
    CHARTING FUNCTIONS
    BY DAVID BLAND
*/

function displayData() {
    // Create crossfilter of data
    let ndx = crossfilter(dataArray);

    // Generate charts
    chartRequestsOverTime(ndx);

    // Display charts
    dc.renderAll();
}

// Requests over time line graph
function chartRequestsOverTime(ndx) {
    // Create date dimension & group by count
    let dateDim = ndx.dimension(dc.pluck('TimeDate'));
    let countGroup = dateDim.group();

    // Get max & min dates
    let minDate = dateDim.bottom(1)[0].TimeDate;
    let maxDate = dateDim.top(1)[0].TimeDate;

    // Create graph
    dc.lineChart("#chart-requests-over-time")
        .dimension(dateDim)
        .group(countGroup)
        .x(d3.scaleTime().domain([minDate,maxDate]));
}