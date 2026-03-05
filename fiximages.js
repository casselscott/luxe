require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const validImages = [
    "image1.jpg",
    "image3.jpg",
    "image5.jpg",
    "image6.jpg",
    "image7.jpg",
    "image9.jpg",
    "image11.jpg",
    "image12.jpg",
    "image14.jpg",
    "image15.jpg",
    "image16.jpg",
    "image17.jpg",
    "image18.jpg",
    "image19.jpg",
    "image20.jpg",
    "image21.jpg",
    "image22.jpg",
    "image23.jpg",
    "image24.jpg",
    "image25.jpg",
    "image26.jpg",
    "image28.jpg",
    "image29.jpg",
    "image30.jpg",
    "image31.jpg",
    "image32.jpg",
    "image33.jpg",
    "image34.jpg",
    "image36.jpg",
    "image37.jpg",
    "image38.jpg",
    "image39.jpg",
    "image40.jpg",
    "image41.jpg",
    "image42.png",
    "image43.png",
    "image44.png",
    "image45.png",
    "image46.png",
    "image47.png",
    "image48.png",
    "image49.png",
    "image50.png",
    "image51.png",
    "image52.png",
    "image53.png",
    "image54.png",
    "image55.jpg",
    "image56.jpg",
  ];

  const products = await db.collection("products").find({}).toArray();
  console.log("Total products:", products.length);

  let fixed = 0;
  for (const product of products) {
    const imgPath = product.image;
    if (imgPath && imgPath.startsWith("/images/")) {
      const filename = imgPath.replace("/images/", "");
      if (!validImages.includes(filename)) {
        console.log("BROKEN:", imgPath, "→", product.name);
        await db
          .collection("products")
          .updateOne(
            { _id: product._id },
            { $set: { image: "/images/image1.jpg" } },
          );
        fixed++;
      }
    }
  }
  console.log("Fixed", fixed, "broken images");
  process.exit();
});
