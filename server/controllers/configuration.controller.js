const fs = require('fs');
const path = require('path');

const getEnvExample = (req, res) => {
  try {
    // Construct the path to the .env.example file in the project root
    const filePath = path.join(__dirname, '..', '..', '.env.example');

    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Send the content in a JSON response
    res.json({ content: fileContent });
  } catch (error) {
    console.error('Error reading .env.example file:', error);
    res.status(500).json({ error: 'Could not read the environment guide file.' });
  }
};

module.exports = {
  getEnvExample,
};