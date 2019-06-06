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
    chartRequestsByType(ndx);
    chartRequestsByUserAgent(ndx);
    chartResponseByHttpStatus(ndx);

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

// Requests by type pie chart
function chartRequestsByType(ndx) {
    // Create type dimension & group by count
    let operationDim = ndx.dimension(dc.pluck('Operation'));
    let countGroup = operationDim.group();

    // Create a pie chart
    dc.pieChart("#chart-requests-by-type")
        .dimension(operationDim)
        .group(countGroup);
}

// Requests by user agent pie chart
function chartRequestsByUserAgent(ndx) {
    // Create type dimension & group by count
    let userAgentDim = ndx.dimension(dc.pluck('UserAgent'));
    let countGroup = userAgentDim.group();

    // Create a pie chart
    dc.pieChart("#chart-requests-by-user-agent")
        .dimension(userAgentDim)
        .group(countGroup);
}

// Response by http status pie chart
function chartResponseByHttpStatus(ndx) {
    // Create type dimension & group by count
    let httpStatusDim = ndx.dimension(dc.pluck('HttpStatus'));
    let countGroup = httpStatusDim.group();

    // Create a pie chart
    dc.pieChart("#chart-response-by-http-status")
        .dimension(httpStatusDim)
        .group(countGroup);
}