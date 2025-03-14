import * as THREE from 'https://cdn.skypack.dev/three@0.146.0';

// Disable scroll restoration and reset scroll position on load
window.history.scrollRestoration = "manual";
window.addEventListener("load", () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 10);
});

// Remove background canvas if it exists
const bgCanvas = document.getElementById('bg');
if (bgCanvas) {
  bgCanvas.remove();
}

// Function to create a rounded rectangle shape
function createRoundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + radius, -height / 2);
  shape.lineTo(width / 2 - radius, -height / 2);
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
  shape.lineTo(width / 2, height / 2 - radius);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
  shape.lineTo(-width / 2 + radius, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
  shape.lineTo(-width / 2, -height / 2 + radius);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);
  return shape;
}

// Set up the main scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(6, -33.42, -30);
camera.rotation.set(0.77, 0.1, 0.09);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding; // Ensure renderer uses sRGB encoding
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();

// Grid configuration
const gridRows = 3;
const gridCols = 6;
const planeWidth = 5;
const spacing = 6;
const cornerRadius = 0.5;
const scaleFactor = 2;

const duplicateFactor = 3;
const rowSpeeds = [0.01, -0.015, 0.01];
const totalImagesPerRow = gridCols * duplicateFactor;

// Create row groups for the grid
const rowGroups = [];
for (let i = 0; i < gridRows; i++) {
  const group = new THREE.Group();
  group.position.set(0, i * -10, 0);
  group.visible = false;
  rowGroups.unshift(group);
  scene.add(group);
}

// Load images and create planes
for (let i = 1; i <= gridRows * gridCols; i++) {
  const row = Math.floor((i - 1) / gridCols);
  const col = (i - 1) % gridCols;

  textureLoader.load(
    `/homepage images/${i}.png`,
    (texture) => {
      texture.encoding = THREE.sRGBEncoding; // Ensure texture uses sRGB encoding

      const aspectRatio = texture.image.width / texture.image.height;
      const planeHeight = planeWidth / aspectRatio;

      const roundedRect = createRoundedRectShape(
        planeWidth * scaleFactor,
        planeHeight * scaleFactor,
        cornerRadius
      );

      const geometry = new THREE.ShapeGeometry(roundedRect);

      // Calculate UVs for the geometry
      const uvArray = [];
      const positions = geometry.attributes.position.array;
      for (let j = 0; j < positions.length; j += 3) {
        const x = positions[j];
        const y = positions[j + 1];
        const u = (x + (planeWidth * scaleFactor) / 2) / (planeWidth * scaleFactor);
        const v = (y + (planeHeight * scaleFactor) / 2) / (planeHeight * scaleFactor);
        uvArray.push(u, v);
      }
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));

      // Create material for the image plane
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0, // Start fully transparent
        depthTest: false, // Disable depth testing to avoid rendering issues
        depthWrite: false, // Disable depth writing
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.name = "Image";

      // Add duplicated planes to the row group
      for (let k = 0; k < duplicateFactor; k++) {
        const xOffset = k * gridCols * (planeWidth + spacing);
        plane.position.set(
          col * (planeWidth + spacing) - ((gridCols - 1) * (planeWidth + spacing)) / 2 + xOffset,
          0,
          0
        );
        rowGroups[row].add(plane.clone());
      }
    },
    undefined,
    (err) => console.error(`Error loading texture ${i}.png`, err)
  );
}

// Animation setup
const animationStartTime = Date.now();
const rowDelay = 333;
const animationDuration = 1500;
const bounceDuration = 9000;

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = Date.now() - animationStartTime;

  rowGroups.forEach((group, index) => {
    const groupStartTime = index * rowDelay;

    if (elapsedTime > groupStartTime) {
      group.visible = true;
      const progress = Math.min((elapsedTime - groupStartTime) / animationDuration, 1);
      const bounceProgress = Math.min((elapsedTime - groupStartTime) / bounceDuration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const bounceEffect = Math.pow(0.9, bounceProgress * 3) * Math.sin(bounceProgress * 5 * Math.PI) * 0.01;

      group.rotation.y = THREE.MathUtils.lerp(Math.PI / 3, 0, easedProgress) + bounceEffect;
      group.position.z = THREE.MathUtils.lerp(0, -50, easedProgress) + bounceEffect;

      group.children.forEach((child) => {
        if (child.material) {
          child.material.opacity = Math.min(easedProgress, 1); // Clamp opacity to 1
        }

        // Move images horizontally
        const totalWidth = gridCols * (planeWidth + spacing) * duplicateFactor;
        child.position.x += rowSpeeds[index];

        // Wrap images around when they go off-screen
        if (child.position.x > totalWidth / 2) {
          child.position.x -= totalWidth;
        } else if (child.position.x < -totalWidth / 2) {
          child.position.x += totalWidth;
        }
      });
    }
  });

  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Set body height and overflow
document.body.style.height = `${window.innerHeight * 2.05}px`;
document.documentElement.style.overflow = "hidden";

// Set up the second scene for mosaics
const scene2 = new THREE.Scene();
const camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera2.position.set(-10, 0, 120);
camera2.rotation.set(0.2, -0.1, -0.1);

const renderer2 = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer2.setClearColor(0x000000, 0);
renderer2.domElement.style.position = 'absolute';
renderer2.domElement.style.top = '100vh';
renderer2.domElement.style.left = '0';
document.body.appendChild(renderer2.domElement);

// Resize function for the second canvas
function resizeCanvas2() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer2.setSize(width, height);
  camera2.aspect = width / height;
  camera2.updateProjectionMatrix();

  renderer2.domElement.style.top = `${window.innerHeight}px`;
  document.body.style.height = `${window.innerHeight * 2}px`;
}

resizeCanvas2();
window.addEventListener("resize", resizeCanvas2);

// Mosaic images and configuration
const images = [
  '/512art/dream.png',
  '/512art/majoras mask.png',
  '/512art/desert.png',
  '/512art/glass universe.png',
  '/512art/gaussian splat.png',
  '/512art/flickr.png',
  '/512art/morgan.png',
];

const imageWidth = 55;
const edgeSpacing = 5;

const leftMosaicGroup = new THREE.Group();
const rightMosaicGroup = new THREE.Group();
scene2.add(leftMosaicGroup);
scene2.add(rightMosaicGroup);

// Function to generate non-adjacent image sequences
function generateNonAdjacentSequence(imageIndices, repeatCount) {
  let result = [];
  const remaining = [...imageIndices];

  while (result.length < repeatCount * imageIndices.length) {
    for (let i = 0; i < remaining.length; i++) {
      const nextImage = remaining[i];
      if (result.length === 0 || result[result.length - 1] !== nextImage) {
        result.push(nextImage);
        remaining.splice(i, 1);
        break;
      }
    }
    if (remaining.length === 0) {
      remaining.push(...imageIndices);
    }
  }

  return result;
}

const leftSequence = generateNonAdjacentSequence([0, 1, 2, 3], 3);
const rightSequence = generateNonAdjacentSequence([4, 5, 6], 3);

// Function to add images to the mosaic with equal spacing
function addImagesToMosaicWithEqualSpacing(mosaicGroup, sequence, xOffset) {
  const textureLoader = new THREE.TextureLoader();
  const imageHeights = [];

  const promises = sequence.map((index) => {
    return new Promise((resolve) => {
      textureLoader.load(images[index], (texture) => {
        const image = texture.image;
        const aspectRatio = image.width / image.height;
        const imageHeight = imageWidth / aspectRatio;
        imageHeights.push(imageHeight);
        resolve({ texture, imageHeight });
      });
    });
  });

  Promise.all(promises).then((loadedImages) => {
    const totalHeight = imageHeights.reduce((sum, height) => sum + height, 0) + edgeSpacing * (imageHeights.length - 1);
    let startY = totalHeight / 2;

    loadedImages.forEach(({ texture, imageHeight }) => {
      const geometry = new THREE.PlaneGeometry(imageWidth, imageHeight);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(
        xOffset,
        startY - imageHeight / 2,
        0
      );
      plane.name = "MosaicImage";

      mosaicGroup.add(plane);
      startY -= imageHeight + edgeSpacing;
    });
  });
}

addImagesToMosaicWithEqualSpacing(leftMosaicGroup, leftSequence, -30);
addImagesToMosaicWithEqualSpacing(rightMosaicGroup, rightSequence, 30);

// Subpage links for mosaic images
const subpageLinks = [
  "dream.html",
  "zelda.html",
  "desert.html",
  "echoes.html",
  "dream.html",
  "zelda.html",
  "desert.html",
  "echoes.html",
  "dream.html",
  "zelda.html",
  "desert.html",
  "echoes.html",
  "portal.html",
  "https://www.flickr.com/photos/195552092@N07/albums/72177720313100049/",
  "morgan.html",
  "portal.html",
  "https://www.flickr.com/photos/195552092@N07/albums/72177720313100049/",
  "morgan.html",
  "portal.html",
  "https://www.flickr.com/photos/195552092@N07/albums/72177720313100049/",
  "morgan.html"
];

// Raycaster for touch interactions
const raycaster = new THREE.Raycaster();
const touchPosition = new THREE.Vector2();

// Handle taps in Scene 1
function handleScene1Tap(event) {
  touchPosition.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
  touchPosition.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(touchPosition, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0 && intersects[0].object.name === "Image") {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  }
}

// Handle taps in Scene 2
function handleScene2Tap(event) {
  touchPosition.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
  touchPosition.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(touchPosition, camera2);
  const allMeshes = [...leftMosaicGroup.children, ...rightMosaicGroup.children];
  const intersects = raycaster.intersectObjects(allMeshes, true);

  if (intersects.length > 0 && intersects[0].object.name === "MosaicImage") {
    const tappedImage = intersects[0].object;
    const imageIndex = allMeshes.findIndex(mesh => mesh === tappedImage);

    if (imageIndex !== -1 && subpageLinks[imageIndex]) {
      window.location.href = subpageLinks[imageIndex];
    }
  }
}

// Add touch event listener
window.addEventListener("touchstart", (event) => {
  if (window.scrollY < window.innerHeight - 10) {
    handleScene1Tap(event);
  } else {
    handleScene2Tap(event);
  }
});

// Animate the mosaics
function animateMosaics() {
  const rightMosaicHeight = rightMosaicGroup.children.reduce((sum, image) => {
    return sum + image.geometry.parameters.height + edgeSpacing;
  }, -edgeSpacing);

  rightMosaicGroup.children.forEach((image) => {
    image.position.y -= 0.05;

    if (image.position.y < -rightMosaicHeight / 2 - image.geometry.parameters.height / 2) {
      const topmostImage = rightMosaicGroup.children.reduce((topmost, img) => {
        return img.position.y > topmost.position.y ? img : topmost;
      }, rightMosaicGroup.children[0]);

      image.position.y =
        topmostImage.position.y +
        topmostImage.geometry.parameters.height / 2 +
        edgeSpacing +
        image.geometry.parameters.height / 2;
    }
  });

  const leftMosaicHeight = leftMosaicGroup.children.reduce((sum, image) => {
    return sum + image.geometry.parameters.height + edgeSpacing;
  }, -edgeSpacing);

  leftMosaicGroup.children.forEach((image) => {
    image.position.y += 0.05;

    if (image.position.y > leftMosaicHeight / 2 + image.geometry.parameters.height / 2) {
      const bottommostImage = leftMosaicGroup.children.reduce((bottommost, img) => {
        return img.position.y < bottommost.position.y ? img : bottommost;
      }, leftMosaicGroup.children[0]);

      image.position.y =
        bottommostImage.position.y -
        bottommostImage.geometry.parameters.height / 2 -
        edgeSpacing -
        image.geometry.parameters.height / 2;
    }
  });

  renderer2.render(scene2, camera2);
  requestAnimationFrame(animateMosaics);
}

animateMosaics();