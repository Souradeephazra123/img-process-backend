import path from "path";
import fs from "fs";
import sharp from "sharp";
import cloudinary from "cloudinary";
import axios from "axios";
import CSVModule from "../models/upload.mongo.js";

async function uploadImage(filePath) {
  try {
    if (!filePath) {
      return res.status(400).send("No files were uploaded.");
    }
    //upload to cloudinary
    // Configuration
    cloudinary.config({
      cloud_name: "dsgpbsrxt",
      api_key: "124451358676636",
      api_secret: process.env.CLOUDINARY_API_SECRET, 
    });

    // Upload an image
    const uploadResult = await cloudinary.uploader
      .upload(filePath, {
        public_id: "imgUrl",
      })
      .catch((error) => {
        console.log(error);
      });

    return { status: "200", url: uploadResult.secure_url };
  } catch (error) {
    console.error(error);
    return { status: "500", msg: error.message };
  }
}

export async function upload(req, res) {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).send("No files were uploaded.");
    }
    const file = req.files.file;
    const fileName = path.basename(file.name); //sanitize the file name
    const fileExtension = fileName.split(".").pop();
    const allowedExtensions = ["csv"];
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).send("Only csv files are allowed");
    }

    const dirname = path.resolve();
    const filePath = `${dirname}/src/uploads/${fileName}`;

    await file.mv(filePath);

    // const requestId = uuidv4();

    //create a new csv module
    const csvModule = new CSVModule({
      name: fileName,
      size: file.size,
      result: [],
      status: "Processing",
    });

    await csvModule.save();

    const id = csvModule._id;

    processingImage(filePath, id);
    return res.status(200).json({ id });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
}

async function processingImage(filePath, requestId) {
  //read the csv file
  // Read and parse the CSV file
  const results = [];

  await CSVModule.findByIdAndUpdate(
    { _id: requestId },
    { status: "Parsing csv" }
  );

  const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
  const lines = fileContent.split("\n");

  for (const line of lines) {
    const values = line.split(",");
    results.push(values);
  }

  //compress all images and save them

  //create an img folder
  await CSVModule.findByIdAndUpdate(
    { _id: requestId },
    { status: "Compressing image" }
  );

  const dirname = path.resolve();
  fs.mkdirSync(`${dirname}/uploads/images`, { recursive: true });
  const imageUrlArr = results.slice(1);
  for (let i = 0; i < imageUrlArr.length; i++) {
    if (imageUrlArr[i].length < 3) {
      continue;
    }
    const rowPath = `${dirname}/uploads/images/img${i}`;
    fs.mkdirSync(rowPath, { recursive: true });

    const cleanedUrls = imageUrlArr[i].map((url) =>
      url.replace(/["\r]/g, "").trim()
    );

    const urls = cleanedUrls.slice(2);

    for (let j = 0; j < urls.length; j++) {
      await compressImage(urls[j], rowPath);
    }
  }

  const resultArr = [];
  await CSVModule.findByIdAndUpdate(
    { _id: requestId },
    { status: "Uploading image to cloud" }
  );

  //now get the compressed images and upload them to cloudinary
  for (let i = 0; i < imageUrlArr.length; i++) {
    if (imageUrlArr[i].length < 3) {
      continue;
    }
    const rowPath = `${dirname}/uploads/images/img${i}`;
    const files = fs.readdirSync(rowPath);
    let res = "";
    for (const file of files) {
      const filePath = `${rowPath}/${file}`;

      const url = await uploadImage(filePath);

      res += url.url + ",";
    }
    resultArr.push(res);
    res = "";
  }

  await CSVModule.findByIdAndUpdate(
    { _id: requestId },
    { status: "Modifying csv" }
  );

  const newResults = results.map((row, index) => {
    if (row.length >= 3) {
      if (index === 0) {
        return [...row, "Output Image Urls"]; // Keep the header row unchanged
      }
      return [...row, resultArr[index - 1]]; // Append the new URLs
    } else {
      return row;
    }
  });

  await CSVModule.findByIdAndUpdate({ _id: requestId }, { result: newResults });

  const csvContent = newResults.map((row) => row.join(",")).join("\n");

  fs.writeFileSync(filePath, csvContent, { encoding: "utf-8" });

  //remove the images folder
  fs.rmdirSync(`${dirname}/uploads/images`, { recursive: true });

  try {
    fs.unlinkSync(filePath);
  } catch (unlinkErr) {
    console.error("Error removing original CSV file:", unlinkErr);
  }

  // Return the updated CSV file
  // res.download(filePath, "updated_file.csv", (err) => {
  //   if (err) {
  //     console.error("Error sending file:", err);
  //     res.status(500).send("Error sending file.");
  //   }
  //   // Remove the original CSV file after sending it
  //   try {
  //     fs.unlinkSync(filePath);
  //     console.log("Original CSV file removed successfully.");
  //   } catch (unlinkErr) {
  //     console.error("Error removing original CSV file:", unlinkErr);
  //   }
  // });

  await CSVModule.findByIdAndUpdate(
    { _id: requestId },
    { status: "Completed" }
  );
}

export async function getStatus(req, res) {
  try {
    const { id } = req.params;
    const csvModule = await CSVModule.findById(id);
    if (!csvModule) {
      return res.status(404).send("No csv module found");
    }
    return res.status(200).json({ status: csvModule.status });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error.message);
  }
}

async function compressImage(fileUrl, outputDir) {
  try {
    if (!fileUrl) {
      return res.status(400).send("No files url found.");
    }
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    const fileName = path.basename(fileUrl);
    const fileExtension = fileName.split(".").pop();
    const allowedExtensions = ["jpg", "jpeg", "png"];
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).send("Only jpg, jpeg, png files are allowed");
    }

    const uploadPath = path.join(outputDir, `${fileName}`);

    // Get image metadata
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    const compressedSizeData = getMaxDimensions(
      originalWidth,
      originalHeight,
      0.5
    );

    // Compress the image to 50% of its original size
    const compressedFile = await image
      .resize({
        width: Math.floor(compressedSizeData.width),
        height: Math.floor(compressedSizeData.height),
      })
      .toFile(uploadPath);

    return { staus: "200", msg: "File uploaded and compressed successfully" };
  } catch (error) {
    console.error(error);
    return { staus: "500", msg: error.message };
  }
}

function getMaxDimensions(originalWidth, originalHeight, scaleFactor) {
  // Calculate the original area
  let originalArea = originalWidth * originalHeight;

  // Target area after scaling
  let targetArea = originalArea * scaleFactor;

  // Ratio factor (since width:height = 5:3, let width = 5x and height = 3x)
  let ratioFactor = 5 / 3;

  // Solve for x: (5x * 3x) = targetArea
  let x = Math.sqrt(targetArea / 15);

  // Calculate new width and height
  let newWidth = Math.round(5 * x);
  let newHeight = Math.round(3 * x);

  return { width: newWidth, height: newHeight };
}
