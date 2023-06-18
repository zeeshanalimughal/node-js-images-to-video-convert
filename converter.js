import path from 'path';
import colors from 'colors';
import ffmpeg from 'fluent-ffmpeg';
import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminSvgo from 'imagemin-svgo';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compressor = async (input) => {
  const files = await imagemin([input], {
    destination: './images',
    plugins: [
      imageminJpegtran(),
      imageminGifsicle(),
      imageminSvgo({
        plugins: [
          { removeViewBox: false }
        ]
      }),
      imageminPngquant({
        quality: [0.7, 0.9]
      })
    ]
  });
};

/**
 * Media Converter Function
 * @param {string[]} inputs - array of input file paths
 * @param {string} output - path of output file
 * @param {number} slideDuration - duration (in seconds) for each image slide
 * @param {Function} callback - node-style callback fn (error, result)        
 * @param {Boolean} verbose - whether to log verbose output or not
 */
function convert(inputs, output, slideDuration, callback, verbose = true) {
  const command = ffmpeg();

  inputs.forEach((input) => {
    command.input(input);
  });

  command
    .inputOptions(`-framerate 1/${slideDuration}`)
    .outputOptions(`-r ${slideDuration}`)
    .output(output)
    .on('start', () => {
      if (verbose) {
        console.log();
        console.log('#####'.brightBlue + ' Conversion Started '.brightBlue + '☐'.brightGreen);
        console.log('#'.brightBlue);
        console.log(`   input:  ${inputs.join(', ')}`);
      }
      if (callback) callback(null);
    })
    .on('end', async () => {
      const imageExt = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"];
      if (imageExt.includes(path.extname(output).toLowerCase())) {
        let intervaller = null;
        if (verbose) {
          process.stdout.write(">>".magenta + " media converted and now optimizing ...");
          intervaller = setInterval(() => {
            process.stdout.write(".");
          }, 50);
        }
        await compressor(output).then(() => {
          if (verbose) {
            if (intervaller) clearInterval(intervaller);
            console.log("");
          }
        });
      }
      if (verbose) {
        console.log(`   output: ${output}`);
        console.log('#'.brightBlue);
        console.log('#####'.brightBlue + ' Conversion  Ended  '.brightBlue + '☑'.brightGreen);
        console.log();
      }
      if (callback) callback(null);
    })
    .on('error', (err) => {
      console.error(err);
      if (callback) callback(err);
    })
    .run();
}

const inputs = [
  path.join(__dirname, "images", "profile-1.jpg"),
  path.join(__dirname, "images", "profile-2.jpg"),
];
const output = path.join(__dirname, "video.mp4");
const slideDuration = 10; // Each image will be displayed for 10 seconds

convert(inputs, output, slideDuration, () => {
  console.log("Video Created");
});
