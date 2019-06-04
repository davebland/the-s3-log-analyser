# The S3 Log Analyser

Interactive Frontend Development Milestone Project for Code Institute.

A web application to retrieve two common types of log files stored in Amazon's Web Services (AWS) object storage system (S3). The data contained in the log files is access records for an S3 bucket or CloudFront distribution and the app visualises it for the user as charts & tables.

Remote IP addresses ignored for data protection.

## Demo

## UX

This application makes it quick and easy for a user to connect to thier AWS S3 bucket and analyse access logs stored there by way of charts & tables. It is a single page website.

### User Stories

1. As a new user, the purpose of the application is clear.
2. The user interface is intuitive enough that an IT literate user with knowledge of AWS can use it without looking at the help documentation.
3. A user can use the help button to bring up instructions on how to use the app.
4. The charts & tables are relevant to the purpose of presenting the data.
5. Where data values are missing in the log files, these are presented gracefully on the charts.
6. If a S3 bucket doesn't contain correctly formatted log files the application fails gracefully with a relevant error message.
7. Large data sets load fast enough to be usable or fail gracefully.

## Features

- Locally saved API credentials
- Extensive use of JS promises
- Error management incld. classification warning/fatal
- Regular expressions to help process object list and log entries

### Future Additions

- Manage different types of log files
- Display dates in other time zones

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

### Technical Challenges

- Implemented safety limit of x iterations of list object
- Bucket must only contain log files...
- Decompress .gz log files using browser with header ResponseContentEncoding

### User Story Testing

## Deployment

Scripts loaded after HTML via defer attribute. All JS & CSS minified for size.

## Credits

### Content

### Media

### Acknowledgements

- wireframe.cc (online wireframing tool)
- Bootstrap official documentation
- jQuery officail documentation
- HTML5 validator https://validator.w3.org/
- CSS3 validator https://jigsaw.w3.org/css-validator/