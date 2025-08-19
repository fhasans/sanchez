// api/hello.js

module.exports = (req, res) => {
  // Atur header CORS untuk memastikan browser bisa mengaksesnya
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.status(200).json({
    message: "Hello from the API! If you see this, the API folder is working.",
  });
};
