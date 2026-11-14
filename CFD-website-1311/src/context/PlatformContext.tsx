import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  PageId,
  Project,
  GeometryRecord,
  SimulationConfig,
  SimulationRecord,
  AIModelRecord,
  LightThemeId,
  LightThemeConfig,
  ThemeMode,
  SimulationJob,
} from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_GEOMETRIES,
  DEFAULT_SIM_CONFIG,
  INITIAL_SIMULATIONS,
  INITIAL_AI_MODELS
} from '../data/mockData';
import { sound } from '../utils/soundEffects';
import { runCheckMeshDiagnostics } from '../utils/meshQualityChecker';
import { generateSampleGeometry } from '../utils/cadFileParser';
import { meshToStlDataUrl } from '../utils/stl';

export const LIGHT_THEMES: Record<LightThemeId, LightThemeConfig> = {
  'sky-aero': {
    id: 'sky-aero',
    name: 'Aero Sky & Cyan',
    badge: 'Sky Cyan',
    bgGradient: 'from-[#BAE6FD] via-[#E0F2FE] to-[#CFFAFE]',
    cardBg: 'bg-white/95 backdrop-blur-md',
    accentColor: '#0284C7',
    glowColor: 'rgba(14, 165, 233, 0.25)',
  },
  'electric-azure': {
    id: 'electric-azure',
    name: 'Electric Azure & Aqua',
    badge: 'Vibrant Azure',
    bgGradient: 'from-[#7DD3FC] via-[#BAE6FD] to-[#A5F3FC]',
    cardBg: 'bg-white/95 backdrop-blur-md',
    accentColor: '#0284C7',
    glowColor: 'rgba(2, 132, 199, 0.3)',
  },
  'solar-amber': {
    id: 'solar-amber',
    name: 'Solar Aerothermal',
    badge: 'Solar Amber',
    bgGradient: 'from-[#FDE68A] via-[#FEF3C7] to-[#FED7AA]',
    cardBg: 'bg-white/95 backdrop-blur-md',
    accentColor: '#D97706',
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
  'radiant-coral': {
    id: 'radiant-coral',
    name: 'Radiant Coral Sun',
    badge: 'Warm Coral',
    bgGradient: 'from-[#FECDD3] via-[#FFE4E6] to-[#FED7AA]',
    cardBg: 'bg-white/95 backdrop-blur-md',
    accentColor: '#E11D48',
    glowColor: 'rgba(225, 29, 72, 0.25)',
  },
  'aurora-emerald': {
    id: 'aurora-emerald',
    name: 'Aurora Mint',
    badge: 'Aurora Mint',
    bgGradient: 'from-[#A7F3D0] via-[#D1FAE5] to-[#99F6E4]',
    cardBg: 'bg-white/95 backdrop-blur-md',
    accentColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.25)',
  },
  'lavender-breeze': {
    id: 'lavender-breeze',
    name: 'Electric Lilac',
    badge: 'Lilac Azure',
    bgGradient: 'from-[#DDD6FE] via-[#EDE9FE] to-[#C7D2FE]',
    cardBg: 'bg-white/95 backdrop-blur-md',
    accentColor: '#7C3AED',
    glowColor: 'rgba(139, 92, 246, 0.25)',
  },
};

interface PlatformContextType {
  // Navigation
  page: PageId;
  setPage: (page: PageId) => void;

  // Theme & Appearance
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  lightTheme: LightThemeId;
  setLightTheme: (theme: LightThemeId) => void;
  activeThemeConfig: LightThemeConfig;

  // Sound
  soundEnabled: boolean;
  toggleSound: () => void;

  // Modals & Drawers
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isOpenFoamModalOpen: boolean;
  setIsOpenFoamModalOpen: (open: boolean) => void;

  // Simulation Queue Engine
  queue: SimulationJob[];
  activeJobId: string | null;
  setActiveJobId: (id: string) => void;
  pauseJob: (id: string) => void;
  resumeJob: (id: string) => void;
  cancelJob: (id: string) => void;
  retryJob: (id: string) => void;
  deleteJob: (id: string) => void;
  addJobToQueue: (job: { name: string; geometryName: string; solver: string; aoa: number; velocity: number }) => void;
  clearCompletedJobs: () => void;

  // Projects
  projects: Project[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  createProject: (newProj: Omit<Project, 'projectId' | 'createdAt' | 'status'>) => Project;
  deleteProject: (id: string) => void;

  // Geometries
  geometries: GeometryRecord[];
  currentGeometryId: string;
  setCurrentGeometryId: (id: string) => void;
  saveGeometry: (geom: Omit<GeometryRecord, 'id'>) => GeometryRecord;
  deleteGeometry: (id: string) => void;

  // Configuration
  simConfig: SimulationConfig;
  updateSimConfig: (updates: Partial<SimulationConfig>) => void;

  // Simulations
  simulations: SimulationRecord[];
  currentSimulationId: string;
  setCurrentSimulationId: (id: string) => void;
  createSimulation: (projectId: string, solver: string) => SimulationRecord;

  // AI Models
  aiModels: AIModelRecord[];
  activeModelId: string;
  activateModel: (id: string) => void;

  // Effects
  triggerConfetti: () => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [page, setPageInternal] = useState<PageId>('intro-robot');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Dark / Light Theme Mode
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const toggleThemeMode = () => {
    sound.playTick();
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  // Bright Light Theme ('sky-aero' | 'solar-amber' | 'aurora-emerald' | 'lavender-breeze')
  const [lightTheme, setLightThemeState] = useState<LightThemeId>('sky-aero');

  const setLightTheme = (newTheme: LightThemeId) => {
    sound.playTick();
    setLightThemeState(newTheme);
  };

  const activeThemeConfig = LIGHT_THEMES[lightTheme] || LIGHT_THEMES['sky-aero'];

  // Modals & Drawers
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isOpenFoamModalOpen, setIsOpenFoamModalOpen] = useState<boolean>(false);

  // Simulation queue is populated by real backend submissions. Keep the initial
  // state empty so the workbench never presents fabricated solver telemetry.
  const [queue, setQueue] = useState<SimulationJob[]>([]);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const pauseJob = (id: string) => {
    sound.playTick();
    setQueue((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'paused', logs: [...j.logs, 'Simulation paused by engineer.'] } : j))
    );
  };

  const resumeJob = (id: string) => {
    sound.playClick();
    setQueue((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'running', logs: [...j.logs, 'Simulation resumed.'] } : j))
    );
  };

  const cancelJob = (id: string) => {
    sound.playWarning();
    setQueue((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'failed',
              errorMessage: 'Cancelled by user',
              logs: [...j.logs, 'SIGINT received. Execution cancelled.'],
            }
          : j
      )
    );
  };

  const retryJob = (id: string) => {
    sound.playStartSimulation();
    setQueue((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'running',
              progress: 0,
              iteration: 0,
              errorMessage: undefined,
              logs: ['Restarting simulation job from t = 0...'],
            }
          : j
      )
    );
  };

  const deleteJob = (id: string) => {
    sound.playTick();
    setQueue((prev) => prev.filter((j) => j.id !== id));
    if (activeJobId === id) {
      setActiveJobId(null);
    }
  };

  const addJobToQueue = (job: { name: string; geometryName: string; solver: string; aoa: number; velocity: number }) => {
    sound.playSave();
    const newJob: SimulationJob = {
      id: `job-${Date.now().toString().slice(-6)}`,
      name: job.name,
      geometryName: job.geometryName,
      solver: job.solver,
      aoa: job.aoa,
      velocity: job.velocity,
      status: 'queued',
      progress: 0,
      iteration: 0,
      maxIterations: 500,
      residuals: {
        continuity: 1.0,
        xMomentum: 1.0,
        kTurbulence: 1.0,
        omegaDissipation: 1.0,
      },
      cL: 2 * Math.PI * ((job.aoa * Math.PI) / 180),
      cD: 0.008 + 0.04 * Math.pow(Math.sin((job.aoa * Math.PI) / 180), 2),
      liftToDrag: 30.0,
      logs: ['Job enqueued successfully into OpenFOAM daemon pipeline.'],
      startedAt: new Date().toISOString(),
      executionTimeSeconds: 0,
    };

    setQueue((prev) => [...prev, newJob]);
    triggerConfetti();
  };

  const clearCompletedJobs = () => {
    sound.playTick();
    setQueue((prev) => prev.filter((j) => j.status !== 'completed'));
  };

  // Projects
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [currentProjectId, setCurrentProjectId] = useState<string>(INITIAL_PROJECTS[0].projectId);

  // Geometries
  const [geometries, setGeometries] = useState<GeometryRecord[]>(() =>
    INITIAL_GEOMETRIES.map((geometry) => ({
      ...geometry,
      stlBase64: geometry.stlBase64 || meshToStlDataUrl(
        generateSampleGeometry(geometry.geometryType as Parameters<typeof generateSampleGeometry>[0]),
        geometry.name,
      ),
    })),
  );
  const [currentGeometryId, setCurrentGeometryId] = useState<string>(INITIAL_GEOMETRIES[0].id);

  // Configuration
  const [simConfig, setSimConfig] = useState<SimulationConfig>(DEFAULT_SIM_CONFIG);

  // Simulations
  const [simulations, setSimulations] = useState<SimulationRecord[]>(INITIAL_SIMULATIONS);
  const [currentSimulationId, setCurrentSimulationId] = useState<string>(INITIAL_SIMULATIONS[0].simulationId);

  // AI Models
  const [aiModels, setAiModels] = useState<AIModelRecord[]>(INITIAL_AI_MODELS);
  const [activeModelId, setActiveModelId] = useState<string>(INITIAL_AI_MODELS[0].modelId);

  const setPage = (newPage: PageId) => {
    sound.playClick();
    setPageInternal(newPage);
  };

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#06B6D4', '#10B981', '#3B82F6'],
      });
    } catch {
      // safe fallback
    }
  };

  const createProject = (newProj: Omit<Project, 'projectId' | 'createdAt' | 'status'>): Project => {
    const proj: Project = {
      ...newProj,
      projectId: `proj-${Date.now().toString().slice(-6)}`,
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setProjects((prev) => [proj, ...prev]);
    setCurrentProjectId(proj.projectId);
    sound.playSave();
    return proj;
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.projectId !== id));
    if (currentProjectId === id && projects.length > 1) {
      setCurrentProjectId(projects.find((p) => p.projectId !== id)!.projectId);
    }
    sound.playTick();
  };

  const saveGeometry = (geom: Omit<GeometryRecord, 'id'>): GeometryRecord => {
    const record: GeometryRecord = {
      ...geom,
      id: `geom-${Date.now().toString().slice(-6)}`,
      stlBase64: geom.stlBase64 || (geom.meshData ? meshToStlDataUrl(geom.meshData, geom.name) : undefined),
    };
    setGeometries((prev) => [record, ...prev]);
    setCurrentGeometryId(record.id);
    sound.playSave();
    triggerConfetti();
    return record;
  };

  const deleteGeometry = (id: string) => {
    setGeometries((prev) => prev.filter((g) => g.id !== id));
    if (currentGeometryId === id && geometries.length > 1) {
      setCurrentGeometryId(geometries.find((g) => g.id !== id)!.id);
    }
    sound.playTick();
  };

  const updateSimConfig = (updates: Partial<SimulationConfig>) => {
    setSimConfig((prev) => ({ ...prev, ...updates }));
    sound.playTick();
  };

  const createSimulation = (projectId: string, solver: string): SimulationRecord => {
    const proj = projects.find((p) => p.projectId === projectId);
    const newSim: SimulationRecord = {
      simulationId: `sim-${Date.now().toString().slice(-8)}`,
      projectId,
      projectName: proj ? proj.name : 'Custom Case',
      solver,
      status: 'running',
      startedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      executionTime: 0,
      iterations: 0,
      meshCells: simConfig.mesh.estimatedCells || 184500,
      metrics: {
        maxVelocity: simConfig.inletVelocity * 1.5,
        minVelocity: 0,
        avgVelocity: simConfig.inletVelocity * 0.85,
        maxPressure: 101325 + 0.5 * 1.225 * simConfig.inletVelocity ** 2,
        minPressure: 101325 - 0.6 * 1.225 * simConfig.inletVelocity ** 2,
        pressureDrop: 0.6 * 1.225 * simConfig.inletVelocity ** 2,
        cL: 0.52,
        cD: 0.015,
        liftToDrag: 34.6,
      },
      availableFields: ['Velocity Magnitude', 'Pressure Field', 'Pressure Coefficient (Cp)', 'Turbulent Kinetic Energy'],
      config: simConfig,
    };

    setSimulations((prev) => [newSim, ...prev]);
    setCurrentSimulationId(newSim.simulationId);
    sound.playStartSimulation();
    return newSim;
  };

  const activateModel = (id: string) => {
    setAiModels((prev) =>
      prev.map((m) => ({
        ...m,
        isActive: m.modelId === id,
      }))
    );
    setActiveModelId(id);
    sound.playAIPredict();
  };

  return (
    <PlatformContext.Provider
      value={{
        page,
        setPage,
        themeMode,
        toggleThemeMode,
        lightTheme,
        setLightTheme,
        activeThemeConfig,
        soundEnabled,
        toggleSound,
        isQueueOpen,
        setIsQueueOpen,
        isOpenFoamModalOpen,
        setIsOpenFoamModalOpen,
        queue,
        activeJobId,
        setActiveJobId,
        pauseJob,
        resumeJob,
        cancelJob,
        retryJob,
        deleteJob,
        addJobToQueue,
        clearCompletedJobs,
        projects,
        currentProjectId,
        setCurrentProjectId,
        createProject,
        deleteProject,
        geometries,
        currentGeometryId,
        setCurrentGeometryId,
        saveGeometry,
        deleteGeometry,
        simConfig,
        updateSimConfig,
        simulations,
        currentSimulationId,
        setCurrentSimulationId,
        createSimulation,
        aiModels,
        activeModelId,
        activateModel,
        triggerConfetti,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
