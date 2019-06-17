/* 
    THE S3 LOG ANALYSER
    CHARTING FUNCTIONS
    BY DAVID BLAND
*/

function displayData() {
    // Create crossfilter of data
    let ndx = crossfilter(dataArray);

    // Remove holding notice & show chart containers
    $('#heading-no-data').hide();
    $('#section-visualise-data article').show();

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

    // Scroll to charts
    $(window).scrollTop($('#message-area-load-logs').offset().top - $('header').height());
    // Display charts
    dc.renderAll();
}

// Re-render charts if page width changes
$(window).resize(function() {
    dc.renderAll();
});

/** RESETS **/

function resetChartArea() {
    $('#section-visualise-data article').hide();
    $('#heading-no-data').show();
    $('#button-change-filter-footer').hide();
}

// Requests over time line graph
function chartRequestsOverTime(ndx) {
    // Create date dimension by day & group by count
    let dateDim = ndx.dimension(function(d) { return d3.timeDay(d.TimeDate)});
    let countGroup = dateDim.group();

    // Get max & min dates
    let minDate = d3.timeDay.offset(dateDim.bottom(1)[0].TimeDate, -1);
    let maxDate = dateDim.top(1)[0].TimeDate;

    // Create graph
    dc.lineChart("#chart-requests-over-time")
        .dimension(dateDim)
        .group(countGroup)
        .x(d3.scaleTime().domain([minDate,maxDate]))
        .xUnits(d3.timeDays)
        .xAxisLabel("Time")
        .elasticY(true)
        .yAxisLabel("No. of Requests")
        .xyTipsOn(true)
        .defined(function(d) {
            if(d.y !== null) {
                return d.y;
            }
            return 0;         
        });
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

    // Create legend
    let chartLegend = dc.legend().x(0).y(300).autoItemWidth(true).gap(5)
        .legendText(function(d) {
            return d.name.substr(0,50) + '...';
        });

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
        .legend(chartLegend);
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
    let dateDim = ndx.dimension(function(d) { return d3.timeDay(d.TimeDate)});
    let countGroup = dateDim.group().reduceSum(dc.pluck('BytesSent'));

    // Get max & min dates (+/-1) plus range of dates between for x axis
    let minDate = d3.timeDay.offset(dateDim.bottom(1)[0].TimeDate, -1);
    let maxDate = dateDim.top(1)[0].TimeDate;

    // Get min and max bytes for range
    let minBytes = 0;
    let maxBytes = 10000;

    // Create graph
    dc.barChart("#chart-bytes-sent-over-time")
        .dimension(dateDim)
        .group(countGroup)
        .x(d3.scaleTime().domain([minDate,maxDate]))
        .xUnits(d3.timeDays)
        .xAxisLabel("Time")
        .yAxisLabel("Bytes")
        .margins().left = 50;
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
    let countGroup = protocolDim.group().reduce(percentageAdd, percentageRemove, percentageInitial);

    // Reduce to percentage functions
    function percentageAdd(p, v) {
        p.count++;
        p.percentage = p.count / protocolDim.groupAll().value();
        return p;
    }
    function percentageRemove(p, v) {
        p.count--;
        p.percentage = p.count / protocolDim.groupAll().value();
        return p;
    }
    function percentageInitial(p, v) {        
        return {count: 0, percentage: 0};
    }

    // Create graph
    dc.barChart("#chart-requests-by-protocol")
        .dimension(protocolDim)
        .group(countGroup)
        .x(d3.scaleOrdinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Protocol")
        .valueAccessor(function(d) {
            return d.value.percentage*100;
        })
        .yAxisLabel("% Requests");
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