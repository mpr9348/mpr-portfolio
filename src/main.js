import * as THREE from 'three';

window.history.scrollRestoration = "manual"; 
window.addEventListener("load", () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 10); 
});


const bgCanvas = document.getElementById('bg');
if (bgCanvas) {
  bgCanvas.remove(); 
}


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


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(6, -33.42, -30);
camera.rotation.set(0.77, 0.1, 0.09);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0); 
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const textureLoader = new THREE.TextureLoader();


const gridRows = 3;
const gridCols = 6;
const planeWidth = 5;
const spacing = 6;
const cornerRadius = 0.5;
const scaleFactor = 2;
const shadowOffset = 0.2; 
const shadowScaleFactor = 1.1; 
const shadowOpacity = 0.4; 


const duplicateFactor = 3; 
const rowSpeeds = [0.01, -0.015, 0.01]; 
const totalImagesPerRow = gridCols * duplicateFactor;


const shadowTexture = textureLoader.load('/shadow.png');


const rowGroups = [];
for (let i = 0; i < gridRows; i++) {
  const group = new THREE.Group();
  group.position.set(0, i * -10, 0); 
  group.visible = false; 
  rowGroups.unshift(group); 
  scene.add(group);
}


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let intersectedObject = null; 
const scaleFactorOnHover = 1.1; 
const hoverStartTime = 2000; 


for (let i = 1; i <= gridRows * gridCols; i++) {
  const row = Math.floor((i - 1) / gridCols);
  const col = (i - 1) % gridCols;

  textureLoader.load(
    `/homepage images/${i}.png`,
    (texture) => {
      texture.encoding = THREE.sRGBEncoding;

      const aspectRatio = texture.image.width / texture.image.height;
      const planeHeight = planeWidth / aspectRatio;

      const roundedRect = createRoundedRectShape(
        planeWidth * scaleFactor,
        planeHeight * scaleFactor,
        cornerRadius
      );

      const geometry = new THREE.ShapeGeometry(roundedRect);

      
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

      
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.name = "Image"; 

      
      const shadowWidth = planeWidth * scaleFactor * shadowScaleFactor;
      const shadowHeight = planeHeight * scaleFactor * shadowScaleFactor;

      const shadowGeometry = new THREE.PlaneGeometry(shadowWidth, shadowHeight);
      const shadowMaterial = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: shadowOpacity,
      });

      const shadowPlane = new THREE.Mesh(shadowGeometry, shadowMaterial);

      
      for (let k = 0; k < duplicateFactor; k++) {
        const xOffset = k * gridCols * (planeWidth + spacing);
        shadowPlane.position.set(
          col * (planeWidth + spacing) - ((gridCols - 1) * (planeWidth + spacing)) / 2 + shadowOffset + xOffset,
          -shadowOffset,
          -0.05
        );

        plane.position.set(
          col * (planeWidth + spacing) - ((gridCols - 1) * (planeWidth + spacing)) / 2 + xOffset,
          0,
          0
        );

        rowGroups[row].add(shadowPlane.clone());
        rowGroups[row].add(plane.clone());
      }
    },
    undefined,
    (err) => console.error(`Error loading texture ${i}.png`, err)
  );
}


// Array of image paths in /512art/
const imagePaths = [
  '/512art/dream.png',
  '/512art/majoras mask.png',
  '/512art/desert.png',
  '/512art/glass universe.png',
  '/512art/gaussian splat.png',
  '/512art/flickr.png',
  '/512art/morgan.png',
];

// Function to preload images
function preloadImages(imagePaths) {
  return Promise.all(
    imagePaths.map((path) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = path;
        img.onload = () => resolve(path);
        img.onerror = () => reject(`Failed to load image: ${path}`);
      });
    })
  );
}

// Preload images and start animation after all images are cached
preloadImages(imagePaths)
  .then(() => {
    console.log('All images are cached. Starting animation...');
    startAnimation(); // Start the animation after images are loaded
  })
  .catch((error) => {
    console.error('Error preloading images:', error);
  });

  function startAnimation() {
    const animationStartTime = Date.now();
    const rowDelay = 333; // Delay between rows
    const animationDuration = 1500; // Duration of the animation
    const bounceDuration = 9000; // Duration of the bounce effect
  
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
              child.material.opacity = easedProgress;
            }
  
            const totalWidth = gridCols * (planeWidth + spacing) * duplicateFactor;
            child.position.x += rowSpeeds[index];
  
            if (child.position.x > totalWidth / 2) {
              child.position.x -= totalWidth;
            } else if (child.position.x < -totalWidth / 2) {
              child.position.x += totalWidth;
            }
          });
        }
      });
  
      // Hover effect logic for scene1
      if (elapsedTime > hoverStartTime) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
  
        if (intersects.length > 0 && intersects[0].object.name === "Image") {
          if (intersectedObject !== intersects[0].object) {
            if (intersectedObject) intersectedObject.scale.set(1, 1, 1); // Reset previous hovered object
            intersectedObject = intersects[0].object;
            intersectedObject.scale.set(scaleFactorOnHover, scaleFactorOnHover, 1); // Scale hovered object
          }
        } else if (intersectedObject) {
          intersectedObject.scale.set(1, 1, 1); // Reset if no intersection
          intersectedObject = null;
        }
      }
  
      renderer.render(scene, camera);
    }
  
    animate(); // Start the animation loop
  }

function loadLottieAnimation() {
  const animationContainer = document.getElementById('lottie-animation');

  const animation = lottie.loadAnimation({
    container: animationContainer,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: '/src/down arrow.json',
  });

  animationContainer.style.position = 'absolute';
  animationContainer.style.bottom = '20px'; 
  animationContainer.style.left = '50%';
  animationContainer.style.transform = 'translateX(-50%)';
  animationContainer.style.zIndex = 10; 
  animationContainer.style.width = '50px'; 
  animationContainer.style.height = '50px'; 

  
  setTimeout(() => {
    animation.play(); 

    
    animation.addEventListener('enterFrame', (event) => {
      if (event.currentTime >= 47) {
        animation.goToAndStop(47, true); 
      }
    });
  }, 2000);
}


loadLottieAnimation();


window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});





window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});








document.body.style.height = `${window.innerHeight * 2.05}px`;
document.documentElement.style.overflow = "hidden"; 


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


function resizeCanvas2() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer2.setSize(width, height);
  camera2.aspect = width / height;
  camera2.updateProjectionMatrix();

  
  renderer2.domElement.style.top = `${window.innerHeight}px`;

  
  document.body.style.height = `${window.innerHeight * 2}px`;

  
  scrollToClosestCameraView();
}


function scrollToClosestCameraView() {
  const scrollY = window.scrollY;
  const cameraViews = [0, window.innerHeight]; 

  
  const closestView = cameraViews.reduce((prev, curr) =>
    Math.abs(curr - scrollY) < Math.abs(prev - scrollY) ? curr : prev
  );

  
  window.scrollTo({
    top: closestView,
    behavior: "smooth"
  });
}


resizeCanvas2();
window.addEventListener("resize", resizeCanvas2);


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


const imageInfo = [
  { title: "Dream", subtitle: "2021" },
  { title: "Zelda", subtitle: "2023" },
  { title: "Desert", subtitle: "2021" },
  { title: "Echoes", subtitle: "2022" },
  { title: "Dream", subtitle: "2021" },
  { title: "Zelda", subtitle: "2023" },
  { title: "Desert", subtitle: "2021" },
  { title: "Echoes", subtitle: "2022" },
  { title: "Dream", subtitle: "2021" },
  { title: "Zelda", subtitle: "2023" },
  { title: "Desert", subtitle: "2021" },
  { title: "Echoes", subtitle: "2022" },
  { title: "Portal", subtitle: "2024" },
  { title: "Flickr", subtitle: "2020-2025" },
  { title: "Morgan", subtitle: "2020" },
  { title: "Portal", subtitle: "2024" },
  { title: "Flickr", subtitle: "2020-2025" },
  { title: "Morgan", subtitle: "2020" },
  { title: "Portal", subtitle: "2024" },
  { title: "Flickr", subtitle: "2020-2025" },
  { title: "Morgan", subtitle: "2020" },
];

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



const infoOverlay = document.getElementById("info-overlay");


const raycaster2 = new THREE.Raycaster();
const mouse2 = new THREE.Vector2();
let intersectedObject2 = null;
const hoverScaleFactor = 1.05;


function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function handleHover() {
  
  if (isTouchDevice()) return;

  
  if (window.scrollY < window.innerHeight - 10) return; 

  raycaster2.setFromCamera(mouse2, camera2);

  
  const allMeshes = [...leftMosaicGroup.children, ...rightMosaicGroup.children];

  
  const intersects = raycaster2.intersectObjects(allMeshes, true);

  if (intersects.length > 0 && intersects[0].object.name === "MosaicImage") {
    const hoveredObject = intersects[0].object;

    if (intersectedObject2 !== hoveredObject) {
      
      if (intersectedObject2) intersectedObject2.scale.set(1, 1, 1);

      
      intersectedObject2 = hoveredObject;
      intersectedObject2.scale.set(hoverScaleFactor, hoverScaleFactor, 1);

      
      const imageIndex = allMeshes.indexOf(hoveredObject);

      if (imageIndex !== -1 && imageInfo[imageIndex]) {
        const { title, subtitle } = imageInfo[imageIndex];
        document.getElementById("info-title").textContent = title;
        document.getElementById("info-subtitle").textContent = subtitle;

        
        const infoOverlay = document.getElementById("info-overlay");
        infoOverlay.style.position = "absolute";
        infoOverlay.style.top = `${window.innerHeight + window.innerHeight / 2}px`; 
        infoOverlay.style.left = "50%";
        infoOverlay.style.transform = "translate(-50%, -50%)";
        infoOverlay.style.textAlign = "center";
        infoOverlay.style.pointerEvents = "none"; 
        infoOverlay.style.display = "block"; 

        
        infoOverlay.style.background = "rgba(255, 255, 255, 0.5)"; 
        infoOverlay.style.padding = "0px 20px"; 
        infoOverlay.style.borderRadius = "10px"; 
        infoOverlay.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)"; 
        infoOverlay.style.zIndex = "1000"; 

        
        document.getElementById("info-title").style.marginBottom = "4px"; 
        document.getElementById("info-subtitle").style.marginTop = "0"; 
      }
    }
  } else if (intersectedObject2) {
    
    intersectedObject2.scale.set(1, 1, 1);
    intersectedObject2 = null;

    
    document.getElementById("info-title").textContent = " ";
    document.getElementById("info-subtitle").textContent = " ";
    document.getElementById("info-overlay").style.display = "none";
  }
}


window.addEventListener("pointermove", (event) => {
  mouse2.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse2.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


let scrollInProgress = false;
function handleScroll(event) {
  if (scrollInProgress) return;
  const delta = event.deltaY;

  if (delta > 0 && window.scrollY === 0) {
    scrollInProgress = true;
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    setTimeout(() => (scrollInProgress = false), 1000);
  } else if (delta < 0 && window.scrollY > 0) {
    scrollInProgress = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => (scrollInProgress = false), 1000);
  }
}
window.addEventListener("wheel", handleScroll);

let touchStartY = 0;
let touchEndY = 0;
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50; 
const tapThreshold = 10; 

function handleTouchStart(event) {
  touchStartY = event.touches[0].clientY;
  touchStartX = event.touches[0].clientX;
}

function handleTouchMove(event) {
  touchEndY = event.touches[0].clientY;
  touchEndX = event.touches[0].clientX;
}

function handleTouchEnd() {
  const deltaY = touchStartY - touchEndY;
  const deltaX = touchStartX - touchEndX;

  
  if (Math.abs(deltaY) < tapThreshold && Math.abs(deltaX) < tapThreshold) {
    handleTap(); 
    return;
  }

  
  if (scrollInProgress) return;

  if (deltaY > swipeThreshold && window.scrollY === 0) {
    
    scrollInProgress = true;
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    setTimeout(() => (scrollInProgress = false), 1000);
  } else if (deltaY < -swipeThreshold && window.scrollY > 0) {
    
    scrollInProgress = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => (scrollInProgress = false), 1000);
  }
}

function handleTap() {
  raycaster2.setFromCamera(mouse2, camera2);
  
  const allMeshes = [...leftMosaicGroup.children, ...rightMosaicGroup.children];
  const intersects = raycaster2.intersectObjects(allMeshes, true);

  if (intersects.length > 0 && intersects[0].object.name === "MosaicImage") {
    const tappedImage = intersects[0].object;
    const imageIndex = allMeshes.findIndex(mesh => mesh === tappedImage);

    if (imageIndex !== -1 && subpageLinks[imageIndex]) {
      window.location.href = subpageLinks[imageIndex]; 
    }
  }
}


window.addEventListener("touchstart", handleTouchStart);
window.addEventListener("touchmove", handleTouchMove);
window.addEventListener("touchend", handleTouchEnd);




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

  
  handleHover();

  
  renderer2.render(scene2, camera2);
  requestAnimationFrame(animateMosaics);
}

window.addEventListener("click", (event) => {
  if (window.scrollY < window.innerHeight - 10) return; 

  raycaster2.setFromCamera(mouse2, camera2);
  const allMeshes = [...leftMosaicGroup.children, ...rightMosaicGroup.children];

  const intersects = raycaster2.intersectObjects(allMeshes, true);

  if (intersects.length > 0 && intersects[0].object.name === "MosaicImage") {
    const clickedImage = intersects[0].object;
    const imageIndex = allMeshes.findIndex(mesh => mesh === clickedImage);

    if (imageIndex !== -1 && subpageLinks[imageIndex]) {
      window.location.href = subpageLinks[imageIndex];
    }
  }
});




animateMosaics();