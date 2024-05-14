const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3011;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

//data key
const username = process.env.User_name;
const password = process.env.Password;


//middleware
app.use(cors({
  origin: ["https://blogzone-bf45b.web.app", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if(!token) return res.status(401).send({message: 'unauthorized access'})
  if (token) {
    jwt.verify(token, process.env.API_SECRET_KEY, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({message: 'unauthorized access'})
        
      }
      req.user = decoded;
      next()
    });
  }
};


const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${username}:${password}@cluster0.zukg64l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    const blogsCollection = client.db("blogsData").collection("user_blogs");
    const commentsCollection = client
      .db("blogsData")
      .collection("user_comments");
    const wishListCollection = client
      .db("blogsData")
      .collection("user_wishlist");
    const newsLetterCollection = client
      .db("blogsData")
      .collection("newsletter_email");

    //jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.API_SECRET_KEY, {
        expiresIn: "1h",
      });
      res.cookie("token", token, cookieOptions).send({ success: true });
    });

    //clearing Token
    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    app.post("/blogs", verifyToken, async (req, res) => {
      const blog = req.body;
      if(req.user.email !== blog.email){
        return res.status(403).send({message: 'forbidden access'})
      }
      const result = await blogsCollection.insertOne(blog);
      res.send(result);
    });

    app.get("/blogs", async (req, res) => {
      const filter = req.query.category;
      const searchBlog = req.query.search;
      let query = {
        title: { $regex: searchBlog, $options: "i" },
      };
      if (filter) query.category = filter;
      const result = await blogsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/blog/:id", async (req, res) => {
      const id = { _id: new ObjectId(req.params.id) };
      const result = await blogsCollection.findOne(id);
      res.send(result);
    });

    //update blogs
    app.put("/update-blogs/:id", async (req, res) => {
      const blogData = req.body;
      const query = { _id: new ObjectId(req.params.id) };
      const options = { upsert: true };
      const updateBlog = {
        $set: {
          ...blogData,
        },
      };
      const result = await blogsCollection.updateOne(
        query,
        updateBlog,
        options
      );
      res.send(result);
    });

    //recent blogs
    app.get("/recent-blogs", async (req, res) => {
      const result = await blogsCollection
        .find()
        .sort({ timestamp: -1 })
        .toArray();
      res.send(result);
    });

    //create comments
    app.post("/send-comments", async (req, res) => {
      const comment = req.body;
      const result = await commentsCollection.insertOne(comment);
      res.send(result);
    });

    //get all comment
    app.get("/comments/:id", async (req, res) => {
      const result = await commentsCollection
        .find({ id: req.params.id })
        .toArray();
      res.send(result);
    });

    //add to wishlist
    app.post("/wishlist", async (req, res) => {
      const listData = req.body;
      const result = await wishListCollection.insertOne(listData);
      res.send(result);
    });

    //get from wishlist
    app.get("/wishlist/:email", verifyToken, async (req, res) => {
      const token = req.user.email
      if(token !== req.params.email){
        return res.status(403).send({message: 'forbidden access'})
      }
      const result = await wishListCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });

    //delete wishlist data
    app.delete("/delete-wishlist", async (req, res) => {
      // const email = req.query.email
      const email = req.query.email;
      const id = req.query.id;
      const result = await wishListCollection.deleteOne({
        email: email,
        id: id,
      });
      res.send(result);
    });

    //newletter
    app.post("/newsletter",async(req, res)=>{
      const email = req.body;
      console.log(email);
      const result = await newsLetterCollection.insertOne(email)
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

app.get("/", async (req, res) => {
  res.send("server responses");
});

app.listen(port, () => {
  // console.log(`survice running on port : ${port}`);
});
