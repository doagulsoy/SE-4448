import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.API_SECRET,
});

export function uploadImage(imageUploaded) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      imageUploaded,
      { width: 470, height: 600, crop: "fit", quality: 70 },
      (err, res) => {
        if (err) reject(err);
        resolve(res);
      }
    );
  });
}

export function uploadProfilePhoto(imageUploaded) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      imageUploaded,
      { width: 150, height: 150, crop: "fit", quality: 70 },
      (err, res) => {
        if (err) reject(err);
        resolve(res);
      }
    );
  });
}
