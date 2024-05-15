const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const user = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const cookieParser = require('cookie-parser');

const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
      return res.status(403).send('Token is required');
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).send('Invalid Token');
      }
      req.user = decoded;
      next();
  });
 };




// ------- Middleware ----
app.use(cors({
    origin: ['https://refork-bd.web.app/'],
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
    
    // await client.connect();

   const foodCollection = client.db('ReFork').collection('food');
   const requestCollection = client.db('ReFork').collection('food_request');
   
   //Auth
   app.post("/jwt", async (req, res) => {
    try {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "3h",
      });
      res.send({ token });
    } catch (error) {
      console.error("Error generating JWT:", error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  });
  
  // POST

  app.post("/add_food", async (req, res) => {
    const foodData = req.body;
    const result = await foodCollection.insertOne(foodData);
    res.send(result);
  });
  app.post("/request_food", async (req, res) => {
    const foodData = req.body;
    const result = await requestCollection.insertOne(foodData);
    res.send(result);
  });


  //GET

  
  app.get('/foods', async (req, res) => {
    const cursor = foodCollection.find();
    const result = await cursor.toArray();
    res.send(result)
    
  })
  app.get('/foods/request_food/:email', verifyJWT, async (req, res) =>{
    const userEmail = req.params.email;
    
    const result =  await requestCollection.find({email:userEmail}).toArray();
    res.send(result);
  })
  app.get('/manage_food/:email', verifyJWT, async (req, res) =>{
    
    const userEmail = req.params.email;
    const result =  await foodCollection.find({user_email:userEmail}).toArray();
    res.send(result);
  })

  app.get('/update/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id)
    const query = {_id: new ObjectId(id)}
    const result = await foodCollection.findOne(query);
    res.send(result);
  })
  //Delete

  app.delete('/foods/:id', async (req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await foodCollection.deleteOne(query);
    res.send(result);
  })
 
  
  //Update

 app.put('/foods/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) }
    const options = { upsert: true };
    const itemUpdated = req.body;

    const item = {
        $set: {
          // food_name, notes, location, food_image, date, status, quantity, user_name, user_photo, user_email
          food_name: itemUpdated.food_name,
          notes : itemUpdated.notes,
          location: itemUpdated.location,
          food_image: itemUpdated.food_image,
          date: itemUpdated.date,
          status: itemUpdated.status,
          quantity: itemUpdated.quantity,
          
        }
    }

    const result = await foodCollection.updateOne(filter, item, options);
    res.send(result);
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

    
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
