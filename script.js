// Создаем сцену, камеру и рендерер
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222244);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Добавляем управление мышью (вращение)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Плавное вращение
controls.dampingFactor = 0.05;

// Создаем куб с цветом
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x0077ff, roughness: 0.5, metalness: 0.5 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Добавляем свет
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Анимация
function animate() {
  requestAnimationFrame(animate);

  // Вращаем куб немного
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Обработка ресайза окна
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});