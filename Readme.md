📷 Image Processing API

📖 Overview

The Image Processing API enables users to:

📂 Upload a CSV file containing image URLs.

📉 Compress images to 50% of their original size.

☁ Upload the compressed images to Cloudinary.

🔗 Retrieve the updated URLs of compressed images.

🔍 Check the processing status using a unique request ID.

🌍 Base URL

http://localhost:3000

🚀 Endpoints

1️⃣ Upload API

🔗 Endpoint:

POST /upload

📌 Description:

Accepts a CSV file containing image URLs.

Processes images and returns a unique request ID.

📝 Request:

Headers:

Content-Type: multipart/form-data

Body:

file: The CSV file to be uploaded.

✅ Response:

Status Code: 200 OK

Body:

{
"requestId": "unique-request-id"
}

📌 Example Request:

curl -X POST http://localhost:3000/upload \
 -H "Content-Type: multipart/form-data" \
 -F "file=@path/to/your/file.csv"

📌 Example Response:

{
"requestId": "123e4567-e89b-12d3-a456-426614174000"
}

2️⃣ Status API

🔗 Endpoint:

GET /status/:id

📌 Description:

Checks the processing status using the request ID.

📝 Request:

Parameters:

id: The unique request ID returned by the Upload API.

✅ Response:

Status Code: 200 OK

Body:

{
"status": "Processing" | "Completed" | "Failed"
}

📌 Example Request:

curl -X GET http://localhost:3000/status/123e4567-e89b-12d3-a456-426614174000

📌 Example Response:

{
"status": "Processing"
}

🔄 Detailed Workflow

🖼 1. Upload CSV File

✅ The user uploads a CSV file containing image URLs.
✅ The server saves the file and returns a unique request ID.
✅ The server starts processing the CSV file asynchronously.

⚙ 2. Processing CSV File

🔹 The server reads and parses the CSV file.
🔹 Each image is compressed to 50% of its original size.
🔹 The compressed images are uploaded to Cloudinary.
🔹 The CSV file is updated with new URLs of the compressed images.
🔹 The processing status is updated to "Completed" or "Failed".

🔎 3. Check Processing Status

🔹 The user checks the processing status using the request ID.
🔹 The server returns the current processing status.

⚠ Error Handling

🚨 Status Code

❌ Description

400 Bad Request

Invalid request (e.g., no file uploaded, invalid file type).

404 Not Found

Request ID not found.

500 Internal Server Error

An unexpected server error occurred.

📜 License

This project is licensed under the MIT License.

👨‍💻 Author

Souradeep Hazra
