"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface KnowledgeArea {
  name: string;
  level: number;
  status: "verified" | "claimed";
}

interface BrainVisualizerProps {
  score?: number;
  knowledgeAreas?: KnowledgeArea[];
}

interface NodeData {
  id: number;
  region: string;
  originalColor: THREE.Color;
  subject: string;
  mastery: string;
  focus: string;
  time: string;
  status: "verified" | "claimed";
}

const REGION_CONFIG: Record<
  string,
  { label: string; color: number; subjects: string[] }
> = {
  frontal: {
    label: "Frontal [Logic & Algorithms]",
    color: 0x00ffff, // Cyan
    subjects: [
      "Data Structures & Algorithms",
      "Object Oriented Programming",
      "Calculus & Optimization",
      "Dynamic Programming",
    ],
  },
  parietal: {
    label: "Parietal [Systems & Architecture]",
    color: 0xff00ff, // Magenta
    subjects: [
      "Database Management (SQL)",
      "Operating Systems",
      "Computer Networks",
      "Distributed Systems",
    ],
  },
  temporal: {
    label: "Temporal [Language & Memory]",
    color: 0xffaa00, // Neon Orange
    subjects: [
      "Natural Language Processing",
      "Language Semantics",
      "Information Retrieval",
      "FAISS Vector Embeddings",
    ],
  },
  occipital: {
    label: "Occipital [Vision & Patterns]",
    color: 0x7d5fff, // Electric Violet
    subjects: [
      "Computer Vision",
      "Machine Learning Basics",
      "Pattern Recognition",
      "Data Visualization",
    ],
  },
  cerebellum: {
    label: "Cerebellum [Procedural & Web]",
    color: 0x00ff66, // Neon Green
    subjects: [
      "Web Development (React/Next)",
      "API Engineering (FastAPI)",
      "Code Refinement",
      "Matplotlib Scripting",
    ],
  },
  core: {
    label: "Core [Metacognition]",
    color: 0xffffff, // White
    subjects: [
      "Autonomous Learning State",
      "Bloom Cognitive Taxonomy",
      "Academic Integrity",
    ],
  },
};

export default function BrainVisualizer({
  score = 84,
  knowledgeAreas = [],
}: BrainVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [hoveredNode, setHoveredNode] = useState<{
    x: number;
    y: number;
    data: NodeData;
  } | null>(null);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    geometry: THREE.BufferGeometry;
    edgeGeometry: THREE.BufferGeometry;
    nodesData: NodeData[];
    nodesPositions: number[];
    spikes: Array<{ mesh: THREE.Mesh; active: boolean; life: number }>;
    pointCloud: THREE.Points;
    edges: THREE.LineSegments;
    currentFilter: string;
    triggerSpike: (forceIndex?: number, color?: THREE.Color) => void;
    applyFilter: (region: string) => void;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Scene & Camera Setup ---
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0c16, 0.035);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    camera.position.set(0, 4.2, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x080b18, 0.95);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.maxDistance = 22;
    controls.minDistance = 5;

    // --- 2. Brain Geometry Generation ---
    const particles = 580;
    const connectionDistance = 1.75;
    const nodesData: NodeData[] = [];
    const nodesPositions: number[] = [];
    const vertexColors: number[] = [];
    const brainGroup = new THREE.Group();

    const a = 3.9,
      b = 3.1,
      c = 4.6; // Brain ellipsoid boundaries

    let attempts = 0;
    while (nodesPositions.length / 3 < particles && attempts < 15000) {
      const x = (Math.random() - 0.5) * 2 * a;
      const y = (Math.random() - 0.5) * 2 * b;
      const z = (Math.random() - 0.5) * 2 * c;

      if ((x * x) / (a * a) + (y * y) / (b * b) + (z * z) / (c * c) <= 1) {
        if (Math.abs(x) > 0.32) {
          // Longitudinal fissure
          const taper = 1.0 - (Math.abs(z) / c) * 0.3;
          const finalX = x * taper;
          const finalY = y * taper;
          const finalZ = z;

          // Classify Lobe region
          let regionKey = "core";
          if (finalZ > 1.1) {
            regionKey = "frontal";
          } else if (finalZ < -1.4) {
            regionKey = "occipital";
          } else if (finalY < -0.75 && finalZ < 0.4) {
            regionKey = "cerebellum";
          } else if (Math.abs(finalX) > 1.7 && finalY < 0.9) {
            regionKey = "temporal";
          } else if (finalY > 0) {
            regionKey = "parietal";
          }

          const reg = REGION_CONFIG[regionKey] || REGION_CONFIG.core;
          const color = new THREE.Color(reg.color);

          nodesPositions.push(finalX, finalY, finalZ);
          vertexColors.push(color.r, color.g, color.b);

          // Connect subject and real data from project knowledge areas
          const regSubjects = reg.subjects;
          const matchedArea = knowledgeAreas.find((k) =>
            regSubjects.some((s) => s.toLowerCase().includes(k.name.toLowerCase().slice(0, 4)))
          );

          const subjectName =
            matchedArea?.name ||
            regSubjects[Math.floor(Math.random() * regSubjects.length)];
          const masteryVal = matchedArea
            ? `${matchedArea.level}%`
            : `${Math.floor(65 + Math.random() * 30)}%`;
          const statusVal = matchedArea ? matchedArea.status : (Math.random() > 0.35 ? "verified" : "claimed");

          nodesData.push({
            id: nodesData.length,
            region: regionKey,
            originalColor: color.clone(),
            subject: subjectName,
            mastery: masteryVal,
            focus: `${(7.5 + Math.random() * 2.3).toFixed(1)}/10`,
            time: `${Math.floor(Math.random() * 45 + 5)}m ago`,
            status: statusVal,
          });
        }
      }
      attempts++;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(nodesPositions, 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(vertexColors, 3)
    );

    const nodeMaterial = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pointCloud = new THREE.Points(geometry, nodeMaterial);
    brainGroup.add(pointCloud);

    // --- 3. Neural Synapse Edges ---
    const edgePositions: number[] = [];
    const edgeColors: number[] = [];

    for (let i = 0; i < nodesData.length; i++) {
      const v1 = new THREE.Vector3(
        nodesPositions[i * 3],
        nodesPositions[i * 3 + 1],
        nodesPositions[i * 3 + 2]
      );
      for (let j = i + 1; j < nodesData.length; j++) {
        const v2 = new THREE.Vector3(
          nodesPositions[j * 3],
          nodesPositions[j * 3 + 1],
          nodesPositions[j * 3 + 2]
        );

        if (v1.distanceTo(v2) < connectionDistance) {
          edgePositions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
          const c1 = nodesData[i].originalColor;
          const c2 = nodesData[j].originalColor;
          edgeColors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
        }
      }
    }

    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(edgePositions, 3)
    );
    edgeGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(edgeColors, 3)
    );

    const edgeMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    brainGroup.add(edges);

    // --- 4. Energy Action Potential Spikes ---
    const spikeCount = 10;
    const spikeGroup = new THREE.Group();
    const spikeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const spikes: Array<{ mesh: THREE.Mesh; active: boolean; life: number }> = [];

    for (let i = 0; i < spikeCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(spikeGeo, mat);
      spikeGroup.add(mesh);
      spikes.push({ mesh, active: false, life: 0 });
    }
    brainGroup.add(spikeGroup);

    brainGroup.rotation.x = 0.12;
    scene.add(brainGroup);

    // --- Filter logic ---
    const applyFilter = (filterKey: string) => {
      const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
      const edgeColorAttr = edgeGeometry.attributes.color as THREE.BufferAttribute;
      const dimColor = new THREE.Color(0x141829);

      // Nodes
      for (let i = 0; i < nodesData.length; i++) {
        const node = nodesData[i];
        const target =
          filterKey === "all" || node.region === filterKey
            ? node.originalColor
            : dimColor;
        colorAttr.setXYZ(i, target.r, target.g, target.b);
      }
      colorAttr.needsUpdate = true;

      // Edges
      let lineIdx = 0;
      for (let i = 0; i < nodesData.length; i++) {
        for (let j = i + 1; j < nodesData.length; j++) {
          const v1 = new THREE.Vector3(
            nodesPositions[i * 3],
            nodesPositions[i * 3 + 1],
            nodesPositions[i * 3 + 2]
          );
          const v2 = new THREE.Vector3(
            nodesPositions[j * 3],
            nodesPositions[j * 3 + 1],
            nodesPositions[j * 3 + 2]
          );

          if (v1.distanceTo(v2) < connectionDistance) {
            let c1 = nodesData[i].originalColor.clone();
            let c2 = nodesData[j].originalColor.clone();

            if (filterKey !== "all") {
              if (nodesData[i].region !== filterKey) c1 = dimColor;
              if (nodesData[j].region !== filterKey) c2 = dimColor;
            }

            edgeColorAttr.setXYZ(lineIdx * 2, c1.r, c1.g, c1.b);
            edgeColorAttr.setXYZ(lineIdx * 2 + 1, c2.r, c2.g, c2.b);
            lineIdx++;
          }
        }
      }
      edgeColorAttr.needsUpdate = true;
    };

    const triggerSpike = (forceIndex = -1, color = new THREE.Color(0xffffff)) => {
      const inactive = spikes.find((s) => !s.active);
      if (inactive) {
        inactive.active = true;
        inactive.life = 1.0;
        (inactive.mesh.material as THREE.MeshBasicMaterial).color = color;

        let idx = forceIndex;
        if (idx === -1) {
          let tries = 0;
          do {
            idx = Math.floor(Math.random() * nodesData.length);
            tries++;
          } while (
            sceneRef.current?.currentFilter !== "all" &&
            nodesData[idx]?.region !== sceneRef.current?.currentFilter &&
            tries < 40
          );
        }

        if (idx >= 0 && idx < nodesData.length) {
          inactive.mesh.position.set(
            nodesPositions[idx * 3],
            nodesPositions[idx * 3 + 1],
            nodesPositions[idx * 3 + 2]
          );
        }
      }
    };

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      geometry,
      edgeGeometry,
      nodesData,
      nodesPositions,
      spikes,
      pointCloud,
      edges,
      currentFilter: "all",
      triggerSpike,
      applyFilter,
    };

    // --- Raycasting for Node Hover/Click ---
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.28;
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(pointCloud);

      if (intersects.length > 0) {
        const curFilter = sceneRef.current?.currentFilter || "all";
        const hit = intersects.find((h) => {
          const node = nodesData[h.index!];
          return curFilter === "all" || node?.region === curFilter;
        });

        if (hit && hit.index !== undefined) {
          const data = nodesData[hit.index];
          setHoveredNode({
            x: e.clientX - rect.left + 12,
            y: e.clientY - rect.top + 12,
            data,
          });
          triggerSpike(hit.index, data.originalColor);
          controls.autoRotate = false;
        }
      } else {
        setHoveredNode(null);
        controls.autoRotate = true;
      }
    };

    renderer.domElement.addEventListener("click", handlePointerDown);

    // --- 5. Animation Loop ---
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Random action potential spike
      if (Math.random() < 0.14) {
        triggerSpike();
      }

      spikes.forEach((spike) => {
        if (spike.active) {
          spike.life -= delta * 2.2;
          if (spike.life <= 0) {
            spike.active = false;
            (spike.mesh.material as THREE.MeshBasicMaterial).opacity = 0;
          } else {
            const scale = Math.sin(spike.life * Math.PI) * 2.6;
            spike.mesh.scale.setScalar(scale);
            (spike.mesh.material as THREE.MeshBasicMaterial).opacity = spike.life;
          }
        }
      });

      brainGroup.position.y = Math.sin(time * 1.3) * 0.12;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // --- 6. Resize Observer ---
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("click", handlePointerDown);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleSelectFilter = (regionKey: string) => {
    setActiveRegion(regionKey);
    setHoveredNode(null);
    if (sceneRef.current) {
      sceneRef.current.currentFilter = regionKey;
      sceneRef.current.applyFilter(regionKey);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-indigo-900/40 shadow-2xl">
      {/* HUD Topbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2.5 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="text-[11px] font-mono font-bold text-white tracking-widest uppercase">
              NEURAL CORE v2.4
            </div>
            <div className="text-[10px] text-cyan-300 font-mono">
              Learning State Sync: <strong className="text-white">{score}%</strong>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-300 pointer-events-auto flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Interactive · Drag to Rotate</span>
        </div>
      </div>

      {/* 3D Canvas Canvas Mount */}
      <div
        ref={containerRef}
        className="w-full h-[360px] sm:h-[400px] cursor-grab active:cursor-grabbing"
      />

      {/* Interactive Floating Sci-Fi Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none p-3 rounded-xl bg-slate-950/95 border border-cyan-400 backdrop-blur-xl shadow-[0_0_20px_rgba(0,255,255,0.25)] min-w-[200px] text-xs font-mono animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: Math.min(hoveredNode.x, (containerRef.current?.clientWidth || 300) - 220),
            top: Math.min(hoveredNode.y, (containerRef.current?.clientHeight || 300) - 130),
          }}
        >
          <div className="text-white font-bold pb-1 mb-1.5 border-b border-cyan-500/30 flex items-center justify-between">
            <span className="truncate max-w-[150px]">{hoveredNode.data.subject}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                hoveredNode.data.status === "verified"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {hoveredNode.data.status}
            </span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>MASTERY:</span>
              <strong className="text-cyan-300">{hoveredNode.data.mastery}</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>SYNC RATE:</span>
              <strong className="text-white">{hoveredNode.data.focus}</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>LAST ACTIVE:</span>
              <span className="text-slate-300">{hoveredNode.data.time}</span>
            </div>
          </div>
        </div>
      )}

      {/* Region Filter Buttons Bar (Below the 3D Brain) */}
      <div className="p-3 bg-slate-900/90 border-t border-indigo-900/40 backdrop-blur-md">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
          Filter Cognitive Synapses By Region:
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              activeRegion === "all"
                ? "bg-white text-slate-950 border-white shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            All Synapses
          </button>
          {Object.entries(REGION_CONFIG).map(([key, reg]) => {
            const isSel = activeRegion === key;
            const hexColor = `#${reg.color.toString(16).padStart(6, "0")}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 ${
                  isSel
                    ? "bg-slate-800 text-white border-cyan-400 shadow-sm font-bold"
                    : "bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                }`}
                style={isSel ? { borderColor: hexColor, color: hexColor } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: hexColor }}
                />
                <span>{reg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
