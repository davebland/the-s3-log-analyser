# The S3 Log Analyser

Interactive Frontend Development Milestone Project for Code Institute.

A web application to retrieve two common types of log files stored in Amazon's Web Services (AWS) object storage system (S3). The data contained in the log files is access records for a website hosted in a S3 bucket or served via CloudFront distribution. The application visualises it for the user as charts & tables.

Log files are retrieved using the AWS API with login credentials supplied by the user. Users have the option to store their credentials in their local browser for future session & all of the processing of the data is also done locally.

Remote IP addresses in the access logs are ignored to anonymise the date.

## Demo

See [https://daveb.me.uk/the-s3-log-analyser/] – for demo credentials request secret key.

Use Chrome browser as Firefox (and others untested) do not support required regex look behind assertion.

## UX

The application should provide a quick and easy way for a user to connect to an AWS S3 bucket and analyse access logs stored there by way of charts & tables. I have assumed that the user will be familiar with using AWS including access credentials and logging although limited help will be available in a help modal. It is a single page website.

Users need to choose between types S3 (bucket) logs or CloudFront logs as the two types will often represent the same information. I.e. if the user is logging CloudFront requests to a site hosted in the bucket as well as bucket access.

Log file date derived from file name rather than date modified property.

### User Stories

1. Correct interaction flow is enforced by input elements being disabled/enabled at the right times. It is not possible to break the application by clicking a button out of sequence.
2. The user interface is intuitive enough that an IT literate user with knowledge of AWS can use it without looking at the help documentation.
3. When filtering the logs to view, a user cannot break the application by selecting a date out of range.
4. A user can use the help button at any time to bring up instructions on how to use the app.
5. The charts & tables are relevant to the purpose of presenting the data (that is to analyse requests to a website over the selected period).
6. The charts and tables are dynamic, responding to a user selecting a data range in any other chart.
7. Where data values are missing in the log files, these are presented gracefully on the charts.
8. If a S3 bucket contains incorrectly formatted log files the application fails gracefully with a relevant error message.
9. Large data sets load fast enough to be usable.

## Features

- Locally saved API credentials (browser local storage)
- Extensive use of JS promises
- Error management including classification whether warning or fatal
- Automated un-zipping of CloudFront log files in .gz format using browser Content Encoding header
- Dynamic population of date form elements min/max attributes using JS

### Future Additions

- Analyse different types of log files
- Display dates in other time zones
- Firefox doesn't support regex look behind assertion and prevents script load
- Change the date filter according to log type selected

## Technologies

- HTML5
- CSS3
- Libraries
    - Bootstrap (4.3.1)
    - jQuery (3.4.1)
    - AWS SDK for JS, S3 service only (2.461)
    - dc.js (3.0.12)
        - crossfilter.js (1.4.7)
        - d3.js (5.9.2)

## Testing

Manual testing of functions using development tools in browser.
Testing of log file name management using test files in demo bucket.
Automated Jasmine testing tbd.

### Technical Challenges

- To manage a bucket containing a very large number of files I implemented a safety limit on the number of iterations of AWS list objects (at max 1000 per request). Get object request limit tbd.
- If a bucket contains a file with a correctly formatted name (e.g. has date string in) but no log file data this will be represented as nulls within the charts & graphs.
- CloudFront logs are compressed using .gz format. Used Content Encoding header to get the browser to automatically decompress these without using an external JS library.

### User Story Testing

Tbd.

## Deployment

Deployed to a site served from AWS S3 bucket via CloudFront (to gather data for app).
Scripts loaded after HTML via defer attribute. All JS & CSS minified for size.

## Credits

### Content

All content produced by myself other than CSS & JS libraries as documented.

### Media

### Acknowledgements

- wireframe.cc (online wireframing tool)
- Bootstrap official documentation
- jQuery officail documentation
- https://animateddata.co.uk/articles/crossfilter/ - helped a lot with understanding crossfilter.
- HTML5 validator https://validator.w3.org/
- CSS3 validator https://jigsaw.w3.org/css-validator/