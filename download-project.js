const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a zip file of the entire project
const output = fs.createWriteStream('kundina-project.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', function() {
  console.log('Project archived! Download kundina-project.zip');
  console.log(archive.pointer() + ' total bytes');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Add the entire project directory
archive.directory('./', 'kundina/');
archive.finalize();