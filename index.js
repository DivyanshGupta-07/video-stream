import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { exec } from "child_process"; //learn it
import { stderr, stdout } from "process";

const app = express();

//multer middleware
const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + uuidv4() + path.extname(file.originalname));
  },
});

//multer configuration
const upload = multer({ storage: storage });

//middlewares
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type,Accept"
  );
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

//routes
app.get("/", (req, res) => {
  res.json({ message: "hi from server" });
});

app.post("/upload", upload.single("file"), (req, res) => {
  const videoId = uuidv4();
  const videoPath = req.file.path;
  const outputPath = `./uploads/videos/${videoId}`;
  const hlsPath = `${outputPath}/index.m3u8`;
  console.log("hls path : - ", hlsPath);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  //ffmpeg command
  const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;

  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(`exex error : ${error}`);
    }
    console.log(`stdout : ${stdout}`);
    console.log(`stderr : ${stderr}`);

    //video url
    const videoUrl = `http://localhost:8000/uploads/videos/${videoId}/index.m3u8`;

    res.json({
      message: "video sucessfully converted to HLS formate",
      videoUrl: videoUrl,
      videoId: videoId,
    });
  });
});

app.listen(8000, () => {
  console.log("app is lisening at post 8000");
});
