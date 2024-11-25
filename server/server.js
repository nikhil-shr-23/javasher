import express from 'express';
import cors from 'cors';
import tmp from 'tmp';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['https://javasherr.onrender.com', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'JavaSher Compiler API is running' });
});

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
