import express from 'express';
import cors from 'cors';
import axios from 'axios';

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Compile endpoint
app.post('/compile', async (req, res) => {
  const { code } = req.body;
  
  try {
    const response = await axios.post('https://api.jdoodle.com/v1/execute', {
      script: code,
      language: 'java',
      versionIndex: '4', // JDK 17
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET
    });

    if (response.data.error) {
      res.json({ error: response.data.error });
    } else {
      res.json({ output: response.data.output });
    }
  } catch (error) {
    console.error('Compilation error:', error.response?.data || error.message);
    res.json({ 
      error: error.response?.data?.error || error.message || 'Compilation failed'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
