document.addEventListener("DOMContentLoaded", () => {
  const topRow = document.querySelector(".top-row");
  const bottomRow = document.querySelector(".bottom-row");

  const totalImagesPerRow = 6; 
  const imageWidth = 400; 
  const gap = 20; 
  const scrollSpeed = 0.2; 

  const topImages = Array.from({ length: totalImagesPerRow }, (_, i) => `/portal images/${i + 1}.png`);
  const bottomImages = Array.from({ length: totalImagesPerRow }, (_, i) => `/portal images/${i + 7}.png`); 

  function createImageElement(src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Mosaic Image";
    img.style.position = "absolute"; 
    return img;
  }

  
  function initializeRow(rowElement, images, direction) {
    const imageElements = images.map(createImageElement);

    imageElements.forEach((img, index) => {
      rowElement.appendChild(img);
      img.style.left = `${index * (imageWidth + gap)}px`; 
    });

    return imageElements;
  }

  
  const topImagesElements = initializeRow(topRow, topImages, "left");
  const bottomImagesElements = initializeRow(bottomRow, bottomImages, "right");

  
  function updatePositions() {
    topImagesElements.forEach((img) => {
      img.style.left = `${parseFloat(img.style.left) - scrollSpeed}px`;
      if (parseFloat(img.style.left) <= -(imageWidth + gap)) {
        
        const maxRight = Math.max(...topImagesElements.map((el) => parseFloat(el.style.left)));
        img.style.left = `${maxRight + imageWidth + gap}px`;
      }
    });

    bottomImagesElements.forEach((img) => {
      img.style.left = `${parseFloat(img.style.left) + scrollSpeed}px`;
      if (parseFloat(img.style.left) >= window.innerWidth) {
        
        const minLeft = Math.min(...bottomImagesElements.map((el) => parseFloat(el.style.left)));
        img.style.left = `${minLeft - imageWidth - gap}px`;
      }
    });

    requestAnimationFrame(updatePositions);
  }

  requestAnimationFrame(updatePositions);
});
