const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const user = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const cookieParser = require('cookie-parser');

// ------- Middleware ----
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());


const uri = `mongodb+srv://${user}:${password}@refork.r4wiaah.mongodb.net/?retryWrites=true&w=majority&appName=ReFork`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    await client.connect();

   const foodCollection = client.db('ReFork').collection('food');
   
   //Auth
   
   app.post('/jwt', async (req, res) =>{
           const user = req.body;
           const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2h'})
           res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'none'
           })
           .send({success: true});
   })

  // POST

  app.post("/add_food", async (req, res) => {
    const foodData = req.body;
    const result = await foodCollection.insertOne(foodData);
    res.send(result);
  });

  //GET

  
  app.get('/foods', async (req, res) => {
    const cursor = foodCollection.find();
    const result = await cursor.toArray();
    res.send(result)
    
  })

   //Search 

   const sanitizeSearch = (search) => {
    return search.replace(/[^a-zA-Z0-9\s]/g, ''); 
}
   app.get("/foods_item", async (req, res) => {
    const search = req.query.search;

    const sanitizedSearch = sanitizeSearch(search);

    let query = {
      food_name: { $regex: sanitizedSearch, $options: "i" },
    };

    const result = await foodCollection.find(query).toArray();
    res.send(result);
  });

    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Server is Running');
})

app.listen(port, ()=> {
    console.log('Server is running', port);
})
