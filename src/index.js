const canvas = document.getElementById('canvas');

function getNextPoint(x, y, z, direction, turnAngle, distance) {
    let radianDirection = direction * (Math.PI / 180);
    let radianTurn = (0-turnAngle) * (Math.PI / 180);
    let newDirection = radianDirection + radianTurn;
    let newX = x + distance * Math.cos(newDirection);
    let newZ = z + distance * Math.sin(newDirection);
    return [newX, y * scale, newZ];
}

function getColorFromGradient(fraction) {
    let one = Math.round(255 * fraction);
    let two = Math.round(255 * (1 - fraction));
    return `rgb(${one}, 0, ${two})`;
}

function getSeries(min, max) {
    let result = [];
    for (let i = 0; i <= max-min; i++) {
        let n = min+i;
        result.push([n]);
        while (n != 1) {
            if (n % 2 == 0) {
                n /= 2;
            } else {
                n = n * 3 + 1;
            }
            result[i].push(n);
        }
    }
    return result;
}

function getPoints (numbersArray, turnOddAngle, turnEvenAngle) {
    let result = [];
    let x = 0, z = 0, currentAngle = -90;
    for (let i = 0; i < numbersArray.length; i++) {
        result.push([]); 
        x = 0; z = 0; currentAngle = -90;
        for (let j = 0; j < numbersArray[i].length; j++) {
            let turnAngle = numbersArray[i][j] % 2 === 0 ? turnEvenAngle : turnOddAngle;
            let newPoint = getNextPoint(x, j, z, currentAngle, turnAngle, 1);
            result[i].push(newPoint); 
            x = newPoint[0];
            z = newPoint[2];
            currentAngle += turnAngle;
        }
    }
    return result;
}

function drawTree(points) {
  console.log("scale: " ,scale);
  const material = new THREE.LineBasicMaterial({ color: rgbToHex(255,0,0) });
  const vertices = [];
  points.forEach(series => {
      for (let i = 0; i < series.length - 1; i++) {
          vertices.push(new THREE.Vector3(...series[i]));
          vertices.push(new THREE.Vector3(...series[i + 1]));
      }
  });
  const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
  const lineSegments = new THREE.LineSegments(geometry, material);
  scene.add(lineSegments);
}

let scale = 1;
document.getElementById("submitBtn").addEventListener("click", function() {
    const turnOdd = parseInt(document.getElementById("oddRotation").value);
    const turnEven = parseInt(document.getElementById("evenRotation").value);
    const minNum = parseInt(document.getElementById("minNum").value);
    const maxNum = parseInt(document.getElementById("maxNum").value);
    const series = getSeries(minNum, maxNum);
    const points = getPoints(series, turnOdd, turnEven);
    drawTree(points);
    console.log("Odd Rotation:", turnOdd);
    console.log("Even Rotation:", turnEven);
    console.log("Starting Number:", minNum);
    console.log("Ending Number:", maxNum);
    console.log("Series:")
    console.log(series);
    console.log("points:");
    console.log(points);
    document.getElementById("inputDiv").style.display = 'none';
});


/*-------------------------------------- three js section ---------------------------------------*/

// threejs imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
});
//renderer.domElement.addEventListener('click', onCanvasClick);

// starting camera position
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 20;
camera.position.y = 30;
camera.position.x = 20;
camera.lookAt(new THREE.Vector3(0, 0, 0));

// orbit controls
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();

// board location planes for raycast and game logic
var prevClickedMesh = null;

function onCanvasClick(event) {
  const canvasBounds = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2();
  mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
  mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true); // Set the second parameter to true to check all descendants of an object

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    let targetObject = clickedMesh;
    while (!targetObject.userData.index && targetObject.parent) {
      targetObject = targetObject.parent;
    } 
    if (targetObject.userData.startValue) {
      console.log("Clicked on series starting with:", targetObject.userData.startValue);
    }     
  }
}
const ambientLight = new THREE.AmbientLight(0xffffff)
scene.add(ambientLight);

function rgbToHex(r, g, b) {
  var redHex = r.toString(16).padStart(2, '0');
  var greenHex = g.toString(16).padStart(2, '0');
  var blueHex = b.toString(16).padStart(2, '0');
  return parseInt(redHex + greenHex + blueHex, 16);
}

let currentBackgroundIndex = 3;
let background_texture = new THREE.TextureLoader().load("background.jpeg");
scene.background = background_texture;

// main loop
let spin = false;
let angle = 0;
let radius = 40;
function stopSpin() {
  spin = false;
}
function startSpin() {
  spin = true;
  camera.position.x = 0;
  camera.position.z = 0;
  camera.position.y = 7;
}

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

//startSpin();
function animate() {
  
  if (spin) {

    angle += 0.003;
    camera.lookAt(new THREE.Vector3(radius * Math.sin(angle), 10, radius * Math.cos(angle)));

  }
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);