const fs = require('fs');
const path = require('path');

// Path to the Gallery folder
const photosDir = path.join(__dirname, '..', 'Gallery');
const outputDir = path.join(__dirname, '..', 'public');
const outputFile = path.join(outputDir, 'virtual-matrix-photos.json');

// Function to read photos and generate JSON
async function generatePhotoGallery() {
  try {
    // Check if Photos directory exists
    if (!fs.existsSync(photosDir)) {
      console.log('Gallery directory not found:', photosDir);
      return;
    }

    // Read all files in the directory
    const files = fs.readdirSync(photosDir);
    
    // Filter for image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'].includes(ext);
    });

    // Create photo objects with metadata
    const photos = imageFiles.map((file, index) => ({
      id: index + 1,
      name: file,
      title: path.parse(file).name,
      path: `/Gallery/${file}`,
      size: fs.statSync(path.join(photosDir, file)).size
    }));

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to JSON file
    fs.writeFileSync(outputFile, JSON.stringify(photos, null, 2));
    
    console.log(`Generated gallery with ${photos.length} photos`);
    console.log(`Output file: ${outputFile}`);
    
    // Also copy the photos to public folder for direct access
    const publicPhotosDir = path.join(outputDir, 'Gallery');
    if (!fs.existsSync(publicPhotosDir)) {
      fs.mkdirSync(publicPhotosDir, { recursive: true });
    }
    
    // Copy each photo to public directory
    photos.forEach(photo => {
      const sourcePath = path.join(photosDir, photo.name);
      const destPath = path.join(publicPhotosDir, photo.name);
      
      // Only copy if file exists and is less than 5MB (to avoid copying huge files)
      const stats = fs.statSync(sourcePath);
      if (stats.size < 5 * 1024 * 1024) { // 5MB limit
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${photo.name}`);
      } else {
        console.log(`Skipped large file: ${photo.name} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      }
    });
    
  } catch (error) {
    console.error('Error generating photo gallery:', error);
  }
}

// Run the function
generatePhotoGallery();