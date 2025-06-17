const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enabled = false;

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(10, 20, 10);
scene.add(sun);

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 2, 1.5),
  new THREE.MeshStandardMaterial({ color: 0x0055ff })
);
player.position.set(0, 1, 0);
scene.add(player);

const platforms = [];
const platformGeo = new THREE.BoxGeometry(5, 1, 5);
const platformMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });

function addPlatform(x, y, z) {
  const p = new THREE.Mesh(platformGeo, platformMat);
  p.position.set(x, y, z);
  scene.add(p);
  platforms.push(p);
}

addPlatform(0, 0, 0);
addPlatform(6, 3, -4);
addPlatform(12, 6, -8);
addPlatform(18, 9, -12);
addPlatform(24, 12, -16);

const bonuses = [];
const bonusGeo = new THREE.SphereGeometry(0.5, 16, 16);
const bonusMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });

function addBonus(x, y, z) {
  const b = new THREE.Mesh(bonusGeo, bonusMat);
  b.position.set(x, y + 1, z);
  scene.add(b);
  bonuses.push(b);
}

addBonus(6, 4, -4);
addBonus(12, 7, -8);
addBonus(24, 13, -16);

const gravity = -0.03;
let velocityY = 0;
let canJump = false;

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

let score = 0;
const scoreEl = document.getElementById('score');

function animate() {
  requestAnimationFrame(animate);

  const speed = 0.1;
  if (keys['KeyA'] || keys['ArrowLeft']) player.position.x -= speed;
  if (keys['KeyD'] || keys['ArrowRight']) player.position.x += speed;
  if (keys['KeyW'] || keys['ArrowUp']) player.position.z -= speed;
  if (keys['KeyS'] || keys['ArrowDown']) player.position.z += speed;

  velocityY += gravity;
  player.position.y += velocityY;

  canJump = false;
  platforms.forEach(p => {
    if (
      player.position.x + 0.75 > p.position.x - 2.5 &&
      player.position.x - 0.75 < p.position.x + 2.5 &&
      player.position.z + 0.75 > p.position.z - 2.5 &&
      player.position.z - 0.75 < p.position.z + 2.5 &&
      player.position.y <= p.position.y + 1.5 &&
      player.position.y >= p.position.y
    ) {
      player.position.y = p.position.y + 1.0;
      velocityY = 0;
      canJump = true;
    }
  });

  if (canJump && keys['Space']) {
    velocityY = 0.5;
    canJump = false;
  }

  bonuses.forEach((b, idx) => {
    if (player.position.distanceTo(b.position) < 1.8) {
      scene.remove(b);
      bonuses.splice(idx, 1);
      score++;
      scoreEl.textContent = score;
    }
  });

  camera.position.lerp(
    new THREE.Vector3(player.position.x, player.position.y + 6, player.position.z + 12),
    0.1
  );
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});