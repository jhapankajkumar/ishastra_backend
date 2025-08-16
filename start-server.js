// Simple server starter to troubleshoot
const path = require('path');
const express = require('express');

//console.log('Starting server...');
//console.log('Current directory:', process.cwd());
//console.log('Looking for server at:', path.join(__dirname, 'src', 'server.js'));

try {
  require('./src/server.js');
} catch (error) {
  console.error('Error starting server:', error);
  console.error('Stack:', error.stack);
}
