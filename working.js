
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const inputImageDirectory = path.join(__dirname, 'images');
const outputVideoFile = path.join(__dirname, 'video.mp4');

const imageFiles = fs
  .readdirSync(inputImageDirectory)
  .filter(
    (file) =>
      ['.jpg', '.png', '.jpeg'].includes(path.extname(file).toLowerCase())
  )
  .map((file) => path.join(inputImageDirectory, file));

if (imageFiles.length === 0) {
  console.error('No image files found in the input directory.');
  return;
}

const ffmpegArgs = [
  '-y',
  '-f',
  'image2pipe',
  '-framerate',
  '1',
  '-i',
  '-',
  '-vcodec',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  '-vf',
  'scale=w=1920:h=1080:force_original_aspect_ratio=decrease,setsar=1,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
  '-r',
  '30',
  '-y',
  '-an',
  '-vf',
  'pad=1920:1080:0:0:black@0.0',
  '-vcodec',
  'libx264',
  '-crf',
  '23',
  '-preset',
  'veryfast',
  '-pix_fmt',
  'yuv420p',
  '-metadata',
  'title=Video Title',
  '-metadata',
  'artist=Video Artist',
  '-metadata',
  'album=Video Album',
  '-metadata',
  'genre=Video Genre',
  '-metadata',
  'year=2023',
  '-metadata',
  'track=0/1',
  '-metadata',
  'composer=Video Composer',
  '-metadata',
  'comment=Video Comment',
  '-metadata',
  'description=Video Description',
  '-metadata',
  'synopsis=Video Synopsis',
  '-metadata',
  'show=Video Show',
  '-metadata',
  'episode_id=0',
  '-metadata',
  'network=Video Network',
  '-metadata',
  'lyrics=Video Lyrics',
  '-metadata',
  'disc=0',
  '-metadata',
  'date=2023-06-11T00:00:00Z',
  '-metadata',
  'timecode=00:00:00:00',
  '-metadata',
  'encoder=Video Encoder',
  outputVideoFile,
];

const createImageReadStream = () => {
  let currentIndex = 0;

  const stream = new Readable({
    read() {
      if (currentIndex >= imageFiles.length) {
        this.push(null);
        return;
      }

      const imagePath = imageFiles[currentIndex];
      const imageStream = fs.createReadStream(imagePath);

      imageStream.on('data', (chunk) => {
        this.push(chunk);
      });

      imageStream.on('end', () => {
        currentIndex++;
      });
    },
  });

  return stream;
};

const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

createImageReadStream().pipe(ffmpegProcess.stdin);

ffmpegProcess.stderr.on('data', (data) => {
  console.error(`FFmpeg stderr: ${data}`);
});

ffmpegProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Video conversion completed successfully');
  } else {
    console.error(`FFmpeg process exited with code ${code}`);
  }
});
