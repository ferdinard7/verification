const dotenv = require("dotenv").config();
const express  = require("express");

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/users", require("./routes/user"));


app.listen(port, () => {
    console.log(`port is running on ${port}`);
})