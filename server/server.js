const express = require('express');
const cors = require('cors');
const tmp = require('tmp');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://javasher.onrender.com', 'https://javasher-frontend.onrender.com']
    : 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

app.post('/compile', async (req, res) => {
  const { code } = req.body;
  
  // Create temporary directory
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  const filePath = path.join(tmpDir.name, 'Main.java');
  
  try {
    // Write code to file
    fs.writeFileSync(filePath, code);
    
    // Compile the code
    exec(`javac ${filePath}`, (compileError, compileStdout, compileStderr) => {
      if (compileError) {
        tmpDir.removeCallback();
        return res.json({ error: compileStderr });
      }
      
      // Run the compiled code
      exec(`cd ${tmpDir.name} && java Main`, (runError, runStdout, runStderr) => {
        tmpDir.removeCallback();
        
        if (runError) {
          return res.json({ error: runStderr });
        }
        
        res.json({ output: runStdout });
      });
    });
  } catch (error) {
    tmpDir.removeCallback();
    res.json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
