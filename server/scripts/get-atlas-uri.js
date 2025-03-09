/**
 * This script helps you get your MongoDB Atlas connection string.
 * Run it with: node scripts/get-atlas-uri.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('MongoDB Atlas Connection String Helper');
console.log('=====================================');
console.log('This script will help you create a valid MongoDB Atlas connection string.');
console.log('');

let username, password, clusterUrl, dbName;

rl.question('Enter your MongoDB Atlas username: ', (answer) => {
  username = answer;
  
  rl.question('Enter your MongoDB Atlas password: ', (answer) => {
    password = answer;
    
    rl.question('Enter your cluster URL (e.g., cluster0.abc123.mongodb.net): ', (answer) => {
      clusterUrl = answer;
      
      rl.question('Enter your database name (e.g., undercover-game): ', (answer) => {
        dbName = answer;
        
        // Encode username and password for URL
        const encodedUsername = encodeURIComponent(username);
        const encodedPassword = encodeURIComponent(password);
        
        // Create the connection string
        const connectionString = `mongodb+srv://${encodedUsername}:${encodedPassword}@${clusterUrl}/${dbName}?retryWrites=true&w=majority`;
        
        console.log('\nYour MongoDB Atlas connection string:');
        console.log(connectionString);
        console.log('\nAdd this to your .env file as MONGODB_URI');
        
        rl.close();
      });
    });
  });
}); 