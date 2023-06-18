// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffmpeg = require('fluent-ffmpeg');
// ffmpeg.setFfmpegPath(ffmpegPath);



// const command = ffmpeg();
// imageFiles.forEach((file, index) => {
//   command.input(file);
//   command.complexFilter(`[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,crop=1920:1080,setpts=PTS-STARTPTS+${index}/TB[v${index}]`);
// });
// command
//   .inputOption('-framerate 1') // Set the frame rate (1 frame per second)
//   .output(outputVideoFile)
//   .outputOptions('-vcodec libx264')
//   .outputOptions('-pix_fmt yuv420p')
//   .complexFilter(`[${imageFiles.length - 1}:v]scale=1920:1080:force_original_aspect_ratio=decrease,crop=1920:1080,setpts=PTS-STARTPTS+${imageFiles.length - 1}/TB[v${imageFiles.length - 1}]`)
//   .outputOptions(`-map [v${imageFiles.length - 1}]`)
//   .on('start', commandLine => console.log('FFmpeg command:', commandLine))
//   .on('error', (err, stdout, stderr) => console.error('Error:', err.message))
//   .on('end', () => console.log('Video slides generated successfully.'))
//   .run();


const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const axios = require('axios');

const outputVideoFile = path.join(__dirname, 'video.mp4');

const imageFiles = [
  'https://pixabay.com/get/g3d6ffc9d12ef5402146e848c574b2e5b3735bd3094bdb5a8f7f6ccdc643bf6fd8316eb3e64baa11edd1ac1493fd0c31417780dfa7c6f8bc4c47b7b9dda41f9e9_1280.jpg',
  'https://pixabay.com/get/g96f48e9770ddb6cd8c2a267bffaa2468668cfe3c653e152d005b30cccc00b673554a3db8a2a6518c012aab1e21fd7b9a0eb9ad9bfdd33b0bdcb3732fb326bd10_1280.jpg',
  'https://pixabay.com/get/g6e2fbd1f01b124b96619099d02a043c9201a6732fa3cb3044d7de248ee6d3a08c3bbc8c40689a93cd2c54a5828b7d6bb_1280.jpg',
  'https://pixabay.com/get/gdadebf3af0860aa0941fd953012efbd90964104032505ccfdee43d5456b71b6c66940e01e2dfa11861f33db8f403be41eef35103db6c76fdc02d4a0b977f2fd3_1280.jpg',
  'https://pixabay.com/get/g9ae8b63dc0856e4e090c9e6ae4bbf71eba34a4f721fee1a7d69d74e7782ac07587bb062e017970f61f18c937d8c6615e2c37a7494146d352b823bef3e28bc7ee_1280.jpg',
  'https://pixabay.com/get/g40cd7f823c55645c87a57f719f5adf281a6e0d1d1c2bf98cfcf4e6ffe0f3c8f581e2a34818f29a20bd2974a088b3065b2ce944ef5bba76f24986a9e4a97adcf9_1280.jpg',
];

const downloadImage = async (imageUrl, imagePath) => {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  fs.writeFileSync(imagePath, Buffer.from(response.data), 'binary');
};

const createImageReadStream = () => {
  let currentIndex = 0;
  const delayBetweenImages = 5000; // 5 seconds delay (adjust as needed)

  const stream = new Readable({
    async read() {
      if (currentIndex >= imageFiles.length) {
        this.push(null);
        return;
      }

      const imagePath = `image_${currentIndex}.jpg`;
      const imageUrl = imageFiles[currentIndex];

      try {
        await downloadImage(imageUrl, imagePath);
        this.push(fs.readFileSync(imagePath));

        currentIndex++;
        setTimeout(() => {
          this.read();
        }, delayBetweenImages);
      } catch (error) {
        console.error(`Failed to fetch image: ${imagePath}`);
        currentIndex++;
        setTimeout(() => {
          this.read();
        }, delayBetweenImages);
      }
    },
  });

  return stream;
};

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

const createVideo = async () => {
  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

  const imageStream = createImageReadStream();

  imageStream.pipe(ffmpegProcess.stdin);

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
};

createVideo();

