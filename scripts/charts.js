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
    chartBytesSentOverTime(ndx);
    chartRequestsByProtocol(ndx);
    // Generate leaderboards
    leaderboardFilesByCount(ndx);
    leaderboardFilesByTime(ndx);

    // Display charts
    dc.renderAll();
}

// Re-render charts if page width changes
$(window).resize(function() {
    dc.renderAll();
});

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
    let operationDim = ndx.dimension(function(ndx) {
        // Select operation by truncating at 2nd . (most operations are xxx.yyy....)
        let end = ndx.Operation.lastIndexOf(".");
        if (end > -1) {
            return ndx.Operation.substring(0,end);
        } else {
            // If no 2nd . return full operation
            return ndx.Operation;
        }
        
    });
    let countGroup = operationDim.group();

    // Create a pie chart
    dc.pieChart("#chart-requests-by-type")
        .width(() => {return $('#chart-requests-by-type').width();})
        .height(400)
        .dimension(operationDim)
        .group(countGroup)
        .slicesCap(5);
}

// Requests by user agent pie chart
function chartRequestsByUserAgent(ndx) {
    // Create type dimension & group by count
    let userAgentDim = ndx.dimension(dc.pluck('UserAgent'));
    let countGroup = userAgentDim.group();

    // Create a pie chart
    dc.pieChart("#chart-requests-by-user-agent")
        .width(() => {return $('#chart-requests-by-type').width();})
        .radius(150)
        .cy(150)
        .height(400)
        .dimension(userAgentDim)
        .group(countGroup)
        .slicesCap(5)
        .label((d) => { return d.key.substr(0,10) + '...';})
        .legend(dc.legend().x(0).y(300).autoItemWidth(true).gap(5));
}

// Response by http status pie chart
function chartResponseByHttpStatus(ndx) {
    // Create type dimension & group by count
    let httpStatusDim = ndx.dimension(dc.pluck('HttpStatus'));
    let countGroup = httpStatusDim.group();

    // Create a pie chart
    dc.pieChart("#chart-response-by-http-status")
        .width(() => {return $('#chart-requests-by-type').width();})
        .height(400)
        .dimension(httpStatusDim)
        .group(countGroup)
        .slicesCap(5);
}

// Bytes sent over time line graph
function chartBytesSentOverTime(ndx) {
    // Create date dimension by day only then group by day and sum bytes sent
    let dateDim = ndx.dimension(function(d) { return d.TimeDate.setHours(0,0,0,0)});
    let countGroup = dateDim.group().reduceSum(dc.pluck('BytesSent'));

    // Get max & min dates (+/-1) plus range of dates between
    let minDate = dateDim.bottom(1)[0].TimeDate;
    let maxDate = dateDim.top(1)[0].TimeDate;

    // Create graph
    dc.lineChart("#chart-bytes-sent-over-time")
        .dimension(dateDim)
        .group(countGroup)
        .x(d3.scaleTime().domain([minDate,maxDate]));
}

// Request by encryption bar chart
function chartRequestsByProtocol(ndx) {
    // Create protocol dimension and group
    let protocolDim = ndx.dimension(function(ndx) {
        if (ndx.Protocol == '-') {
            // If no protocol must be HTTP
            return 'HTTP';            
        } else {
            return 'HTTPS';
        }
    });
    let countGroup = protocolDim.group();

    // Create graph
    dc.barChart("#chart-requests-by-protocol")
        .dimension(protocolDim)
        .group(countGroup)
        .x(d3.scaleOrdinal())
        .xUnits(dc.units.ordinal);
}

// File requested by count leaderboard
function leaderboardFilesByCount(ndx) {
    // Create file requested dimension and group by count of requests
    let fileDim = ndx.dimension(dc.pluck('FileRequested'));
    let countGroup = fileDim.group();

    // Create leaderboard
    dc.dataTable("#leaderboard-files-by-count")        
        .dimension(countGroup)
        .columns([
            {
                label: "File",
                format: function (d) { return d.key; }
            },
            {
                label: "Count",
                format: function (d) { return d.value; }
            }
        ])
        .order(d3.descending)
        .size(10);
}

// File requested by processing time leaderboard
function leaderboardFilesByTime(ndx) {
    // Create file requested dimension and group by average time to process
    let fileDim = ndx.dimension(dc.pluck('FileRequested'));
    let countGroup = fileDim.group().reduce(avgAdd,avgRemove,avgInitial);

    // Time taken averaging functions
    function avgAdd(p, v) {
        p.count++;
        p.total += v.TotalTime;
        p.avg = p.total / p.count;
        return p;
    }    
    function avgRemove(p, v) {
        p.count--;
        if (p.count == 0) {
            p.total = 0;
            p.avg = 0;
        } else {
            p.total -= v.TotalTime;
            p.avg = p.total / p.count; 
        }
        return p;
    }    
    function avgInitial() {
        return {avg: 0, count: 0, total: 0};
    }

    // Create leaderboard
    dc.dataTable("#leaderboard-files-by-time")        
        .dimension(countGroup)
        .columns([
            {
                label: "File",
                format: function (d) { return d.key; }
            },
            {
                label: "Average Processing Time",
                format: function (d) { return d.value.avg; }
            }
        ])
        .order(d3.descending)
        .size(10);
}