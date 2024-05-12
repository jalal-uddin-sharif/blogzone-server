const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3011
require('dotenv').config()


//data key
const username = process.env.User_name;
const password = process.env.Password;

console.log(username, password);


//middleware
app.use(cors({
    origin: ['http://localhost:5173']
}))
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${username}:${password}@cluster0.zukg64l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const blogsCollection = client.db('blogsData').collection('user_blogs')
    const commentsCollection = client.db('blogsData').collection('user_comments')

    app.post("/blogs", async(req, res)=>{
        const blog = req.body;
        const result = await blogsCollection.insertOne(blog)
        res.send(result)
    })

    app.get("/blogs", async(req, res)=>{
      const filter = req.query.category;
      const searchBlog = req.query.search;
      let query = {
        title: {$regex: searchBlog, $options: 'i'},
      }
      if(filter) query.category = filter;
      const result = await blogsCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/blog/:id", async(req, res)=>{
      const id = {_id: new ObjectId(req.params.id)}
      const result = await blogsCollection.findOne(id)
      res.send(result)
    })

    //create comments
    app.post("/send-comments", async(req, res)=>{
      const comment = req.body;
      const result = await commentsCollection.insertOne(comment)
      res.send(result)
    })

    //get all comment
    app.get("/comments/:id", async(req, res)=>{
      console.log(req.params.id);
      const result = await commentsCollection.find({id: req.params.id}).toArray()
      res.send(result)
    })
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/', async(req, res)=>{
    res.send('server responses')
})

app.listen(port, () =>{
    console.log(`survice running on port : ${port}`);
})