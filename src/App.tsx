import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Music, Play, Pause, Download, Image as ImageIcon, Sparkles } from 'lucide-react';

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prompt, setPrompt] = useState("futuristic cyberpunk city with neon lights and flying cars, ultra detailed, 8k");
  const [aiImage, setAiImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Three.js Setup
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Particles
    const particleCount = 12000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 300;
      positions[i + 1] = (Math.random() - 0.5) * 300;
      positions[i + 2] = (Math.random() - 0.5) * 300;

      colors[i] = 0.4 + Math.random() * 0.6;
      colors[i + 1] = 0.2 + Math.random() * 0.4;
      colors[i + 2] = 0.8 + Math.random() * 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    camera.position.z = 120;

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.015;

      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;

        particles.rotation.y += 0.003 + avg / 12000;
        particles.scale.setScalar(1 + avg / 400);
        particles.position.y = Math.sin(time) * 10 + avg / 150;
      } else {
        particles.rotation.y += 0.004;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Audio
  const handleAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    audioRef.current.src = url;
    audioRef.current.load();

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
  };

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(console.error);
    setIsPlaying(!isPlaying);
  };

  // AI Placeholder
  const generateAI = () => {
    setAiImage(`https://picsum.photos/1024/1024?blur=2&random=${Date.now()}`);
    alert(`Prompt: ${prompt}\n\n(Real AI ke liye WebGPU / transformers.js integrate karo – yeh sirf demo hai)`);
  };

  // Fast Export (captureStream + MediaRecorder – sabse simple & fast browser mein)
  const exportVideo = () => {
    if (!canvasRef.current) return alert("Canvas load nahi hua!");

    const stream = canvasRef.current.captureStream(60);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vizzy-pro-export.webm';
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start();
    alert("Export shuru! 20 seconds ke baad auto stop (real mein audio length se adjust kar lo)");

    setTimeout(() => recorder.stop(), 20000); // demo limit
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-indigo-950 to-purple-950 overflow-hidden">
      {/* Sidebar Left */}
      <div className="w-80 bg-black/70 backdrop-blur-lg p-6 border-r border-purple-900/40 flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-purple-400 flex items-center gap-3">
          <Sparkles size={32} /> Vizzy Pro
        </h1>

        <div>
          <p className="text-sm text-gray-400 mb-2">Upload Music</p>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudio}
            className="w-full bg-gray-900/60 p-4 rounded-xl border border-purple-800/50 text-white file:bg-purple-600 file:text-white file:border-0 file:px-4 file:py-2 hover:file:bg-purple-700"
          />
        </div>

        <button
          onClick={togglePlay}
          disabled={!audioFile}
          className={`py-4 rounded-xl text-lg font-medium flex items-center justify-center gap-3 transition ${
            isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
          } disabled:opacity-50`}
        >
          {isPlaying ? <Pause /> : <Play />} {isPlaying ? 'Pause' : 'Play'}
        </button>

        {/* AI Prompt */}
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">AI Image Prompt</p>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full bg-gray-900/60 p-4 rounded-xl border border-purple-800/50 mb-3"
            placeholder="Describe your image..."
          />
          <button
            onClick={generateAI}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90"
          >
            <ImageIcon /> Generate AI Image
          </button>
          {aiImage && <img src={aiImage} alt="AI" className="mt-4 rounded-xl w-full border border-purple-500/40" />}
        </div>
      </div>

      {/* Main Preview */}
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xl px-10 py-5 rounded-full border border-purple-500/30 shadow-2xl">
          <button
            onClick={exportVideo}
            className="bg-white text-black px-10 py-5 rounded-full font-bold flex items-center gap-3 hover:bg-gray-200 transition text-lg"
          >
            <Download /> FAST EXPORT (WebM)
          </button>
        </div>
      </div>

      {/* Right Info */}
      <div className="w-72 bg-black/70 backdrop-blur-lg p-6 border-l border-purple-900/40 overflow-y-auto">
        <h2 className="text-xl font-bold text-purple-300 mb-6">Features</h2>
        <ul className="space-y-3 text-gray-300 text-sm">
          <li>✅ Beat-reactive 3D particles</li>
          <li>✅ Fast browser export (no server)</li>
          <li>✅ AI prompt placeholder (upgrade to real WebGPU)</li>
          <li>✅ Zero cost hosting (Vercel/Netlify)</li>
          <li>✅ Add shaders, timeline later</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
