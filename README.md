# The S3 Log Analyser

Interactive Frontend Development Milestone Project for Code Institute.

A web application to analyse two common types of log files generated by Amazon's Web Services (AWS) and stored in its object storage system (S3). Specifically, S3 Access Logs and CloudFront Access Logs. The application interprets and visualises the data for the user as charts & tables.

Log files are retrieved using the AWS API with login credentials supplied by the user. Users have the option to store their credentials in the local browser for a future session if they wish.

Remote IP addresses in the access logs are ignored to anonymise the data. All processing is done locally in the browser using JavaScript.

## Demo

See https://daveb.me.uk/the-s3-log-analyser.

A demo data set is available by clicking on the 'Use DEMO Creds' button to load access credentials for an S3 bucket containing example log files. * Please note - hosting the source code locally will mean DEMO Creds may not load correctly, use the link above to avoid this.

Currently the site only works in Chrome browser as Firefox, Edge (and others untested) do not support the required regex 'look behind' assertion. Basic regex assertion compatibility checking implemented to prevent use in Firefox & Edge browsers.

## UX

The purpose of the application is to provide a quick and easy way for a user to visualise the data contained in log files held within an S3 bucket. A typical example would be to view patterns of requests made to a website hosted in an S3 bucket or served through a CloudFront distribution. The charts and tables show relevant dimensions of the data for this purpose. The app is for users familiar with AWS, its logging functions and credential management (although limited help will be available in a help modal). The application is a single page website.

Currently the app supports 2 of AWS's common log file types, see the site's help modal for more information. Users need to choose between whether they would like to view S3 Access Logs OR CloudFront Access Logs as the two types will often represent the same information (i.e. if the user is logging CloudFront requests to a site hosted in the bucket as well as bucket access).

The application is usable on all device sizes although is primarily designed for desktop viewing.

### User Stories

1. Correct user interaction flow is enforced by input elements being disabled/enabled at the right times. It is not possible to break the application by clicking a button out of sequence.
2. The user interface is intuitive enough that an IT literate user with knowledge of AWS can use it without looking at the help documentation.
3. When filtering the logs to view by date, a user cannot break the application by selecting a date out of range or where no logs exist.
4. A user can use the help button at any time to bring up instructions on how to use the app.
5. The charts & tables are relevant to the purpose of presenting the data.
6. The charts and tables are dynamic where appropriate, responding to a user selecting a data filter in any other chart.
7. Where data values are missing in the log files, these are presented gracefully on the charts.
8. If a S3 bucket contains incorrectly formatted log files the application fails gracefully with a relevant error message.
9. Large data sets load fast enough to be usable.
10. The site must work acceptably on all device sizes.

## Features

- Locally saved API credentials (browser local storage)
- Extensive use of JS promises
- Error management including classification whether warning or fatal
- Automated decompression of CloudFront log files in .gz format using browser 'Content Encoding' header
- Dynamic population of date form elements min/max attributes using JS

### Future Additions

- Analyse different types of log files
- Display dates in other time zones
- Compatibility with other browsers
- Modify the date filter according to log type selected
- Visualise bar & line chart data in smaller increments than 1 day
- Change x-axis tick orientation according to number of ticks to prevent overlap

## Technologies

- HTML5
- CSS3
- JavaScript
- Libraries
    - Bootstrap (4.3.1)
    - jQuery (3.4.1)
    - AWS SDK for JS, S3 service only (2.461)
    - dc.js (3.0.12)
        - crossfilter.js (1.4.7)
        - d3.js (5.9.2)
    - FontAwesome (5.9.0)

## Testing

Throughout the building of the application I have tested each function as it was written using the JS console in browser developer tools.

To test the first major stage of the app's logic, getting and processing log file names (AWS listObjects requests) I used a test bucket containing a variety of test objects with correct and incorrect names. This allowed me to test that dates within the object key string are correctly interpreted and where a valid date does not exist the object is removed from the ‘get list’ & the user informed. This ensures that the data retrieved in the 2nd stage of the application (get objects) is likely to be valid log files. 

To test the 2nd of the app’s logic, getting log file content (AWS getObject requests) and parsing it into a usable data format I used a combination of the real API calls and test log strings written into the code. This meant I could repeatedly test the parsing functions to ensure the interpretation of the space and tab separated log files works as intended with a variety of file contents.

To test the 3rd stage of the app's logic, generating & displaying charts, I copied some real log file content strings into the code as above. This meant I could extensively test the charting functions as they were built without making repeated API calls.

I also extensively tested the full flow with real log file data in my test S3 bucket.

After considering using an automated testing library I decided against this as it added little value to the testing process.

### Technical Challenges

- To manage a bucket containing a very large number of files I implemented a safety limit on the number of iterations of AWS listObjects requests (10 iterations at 1000 keys per iteration). Testing showed that the subsequent getObjects requests work acceptably with this number of objects but any more would likely result in a slow/poor user experience.
- CloudFront logs are compressed using .gz format. Used Content Encoding header to get the browser to automatically decompress these without using an external JS library.

### User Story Testing

1. Extensive manual testing of the applications flow including asking a non-technical person to use the app.
2. Added clear arrows/text helpers to make the interaction flow obvious without using help docs.
3. Manually tested by selecting out of range dates revealed a bug, rectified by added a 'no log files selected' error catch to code.
4. Yes, help button always available in header.
5. Compared the charts and tables in the app against similar analytics tools already available in AWS and other website hosting.
6. Yes, pie charts and bar charts filter dynamically apart from those where the grouping of the data dimension makes is not possible.
7. Added code to the log file parsing functions to interpret '-' (AWS no data indicator) as 0 or ignored in the charts. Implemented charting functions to create ‘0’ data points for dates in the requested range where no log files exist.
8. Tested extensively with dummy objects names and content to ensure that invalid log files are ignored, and the user informed via error reporting modal. 
9. Experimented with listing and retrieving several 1000 log files from test data and as a result implemented safety limit of 10,000 objects. Retrieval of 1000+ objects is relatively slow (20s+) but the user gets feedback in the form of a counter so this is acceptable.
10. Tested site on a variety of device sizes using browser development tools. Design is responsive, largely using Bootstrap library functions and grid layout. Adjusted formatting of charts and tables so they are rendered in a usable size on smaller devices. Added function to re-draw charts when device size changes (i.e. a user resizes the window).

## Deployment

Deployed to a website served from AWS S3 bucket via CloudFront.

Scripts loaded after HTML via defer attribute. All JS & CSS minified for size.

## Credits

Code for function ensure_group_bins() taken from dc.js wiki.

### Content

All content produced by me other than CSS & JS libraries as documented.

### Acknowledgements

- wireframe.cc (online wireframing tool)
- Bootstrap official documentation
- jQuery official documentation
- d3, dc & crossfilter official documentation
- https://animateddata.co.uk/articles/crossfilter/ - helped a lot with understanding crossfilter.
- HTML5 validator https://validator.w3.org/
- CSS3 validator https://jigsaw.w3.org/css-validator/
