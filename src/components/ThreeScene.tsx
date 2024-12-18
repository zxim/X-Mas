import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 씬, 카메라, 렌더러 설정
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // 배경색을 흰색으로 설정

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    // OrbitControls 설정
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // 밝기를 높임
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(50, 200, 100);
    scene.add(directionalLight);

    let mixer: THREE.AnimationMixer | null = null;

    // GLTFLoader로 모델 로드
    const loader = new GLTFLoader();
    loader.load(
      "/models/christmas_village/scene.gltf", // 모델 경로
      (gltf) => {
        const model = gltf.scene;

        // 모델 크기 및 위치 조정
        const boundingBox = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center); // 중심점 계산
        const size = new THREE.Vector3();
        boundingBox.getSize(size); // 모델 크기 계산

        const maxDimension = Math.max(size.x, size.y, size.z);
        const scaleFactor = 5 / maxDimension; // 모델 크기를 5 단위로 맞춤
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        model.position.set(-center.x, -center.y, -center.z); // 모델 중심을 씬 중심으로 이동
        scene.add(model);

        // 카메라 위치를 모델 정면으로 설정
        camera.position.set(0, center.y, center.z + 10); // 모델 정면에서 Y축을 기준으로 중심에 배치
        camera.lookAt(0, center.y, 0); // 모델의 중심을 바라봄

        // OrbitControls 타겟 설정
        controls.target.set(0, center.y, 0);
        controls.update();

        // 애니메이션 처리
        if (gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
          });
        }
      },
      (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
      (error) => console.error("An error occurred while loading the model", error)
    );

    // 애니메이션 루프
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 정리
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef}></div>;
};

export default ThreeScene;
