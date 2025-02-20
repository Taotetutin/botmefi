import * as tf from '@tensorflow/tfjs';
import { supabase, supabaseEnabled } from '../lib/supabase';

export interface AnalysisResult {
  heartRate: number;
  rhythmType: string;
  confidence: number;
  abnormalities: string[];
}

interface CTGReferenceData {
  baseline_value: number;
  accelerations: number;
  fetal_movement: number;
  uterine_contractions: number;
  light_decelerations: number;
  severe_decelerations: number;
  prolongued_decelerations: number;
  abnormal_short_term_variability: number;
  mean_short_term_variability: number;
  abnormal_long_term_variability: number;
  mean_long_term_variability: number;
  pattern_class: number;
  fetal_state: number;
}

export async function analyzeECGImage(imageData: string): Promise<AnalysisResult> {
  // Cargar y preprocesar la imagen
  const image = await loadAndProcessImage(imageData);
  
  // Detectar líneas del ECG
  const lines = await detectECGLines(image);
  
  // Analizar el ritmo cardíaco
  const heartRate = await analyzeHeartRate(lines);

  // Obtener datos de referencia de Supabase si está disponible
  let referenceData: CTGReferenceData[] = [];
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from('ctg_reference_data')
        .select('*')
        .limit(100); // Limitar a 100 registros para el análisis

      if (error) throw error;
      if (data) referenceData = data;
    } catch (error) {
      console.error('Error al obtener datos de referencia:', error);
    }
  }
  
  // Detectar anomalías usando datos de referencia
  const { rhythmType, abnormalities, confidence } = await detectAbnormalities(lines, referenceData);

  return {
    heartRate,
    rhythmType,
    confidence,
    abnormalities
  };
}

async function loadAndProcessImage(imageData: string): Promise<tf.Tensor3D> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      // Convertir la imagen a un tensor y normalizarla
      const tensor = tf.browser.fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims();
      
      // Aplicar preprocesamiento básico
      const processed = tf.tidy(() => {
        return tensor
          .mean(3) // Convertir a escala de grises
          .expandDims(3);
      });
      
      resolve(processed);
    };
    img.src = imageData;
  });
}

async function detectECGLines(image: tf.Tensor3D): Promise<tf.Tensor2D> {
  return tf.tidy(() => {
    // Aplicar detección de bordes
    const sobelH = tf.tensor2d([[-1, -2, -1], [0, 0, 0], [1, 2, 1]]);
    const sobelV = tf.tensor2d([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]);
    
    const edges = image
      .conv2d(sobelH.expandDims(2).expandDims(3), 1, 'same')
      .square()
      .add(image.conv2d(sobelV.expandDims(2).expandDims(3), 1, 'same').square())
      .sqrt();
    
    return edges.squeeze();
  });
}

async function analyzeHeartRate(lines: tf.Tensor2D): Promise<number> {
  let previousAnalyses = [];
  
  // Obtener análisis previos solo si Supabase está configurado
  if (supabaseEnabled && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('ctg_data')
        .select('baseline_value')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data) previousAnalyses = data;
    }
  }

  // Simular detección de picos R
  const peakCount = await tf.tidy(() => {
    const threshold = lines.max().mul(0.7);
    const peaks = lines.greater(threshold);
    return peaks.sum().dataSync()[0];
  });
  
  // Calcular frecuencia cardíaca aproximada considerando datos históricos
  let estimatedHeartRate = Math.round((peakCount / 2) * 6);
  
  if (previousAnalyses.length > 0) {
    // Ajustar la estimación basada en análisis previos
    const avgBaseline = previousAnalyses.reduce((acc, analysis) => 
      acc + analysis.baseline_value, 0) / previousAnalyses.length;
    
    // Combinar la nueva estimación con el histórico
    estimatedHeartRate = Math.round((estimatedHeartRate + avgBaseline) / 2);
  }

  return Math.min(Math.max(estimatedHeartRate, 60), 200);
}

async function detectAbnormalities(lines: tf.Tensor2D, referenceData: CTGReferenceData[]): Promise<{
  rhythmType: string;
  abnormalities: string[];
  confidence: number;
}> {
  // Analizar patrones usando datos de referencia
  const patterns = await tf.tidy(() => {
    const variance = lines.sub(lines.mean()).square().mean();
    return variance.dataSync()[0];
  });

  // Encontrar casos similares en los datos de referencia
  const similarCases = referenceData.filter(data => {
    const variabilityMatch = Math.abs(data.mean_short_term_variability - patterns) < 0.5;
    return variabilityMatch;
  });

  let confidence = 0.85; // Confianza base
  let rhythmType = "Ritmo sinusal normal";
  const abnormalities: string[] = [];

  if (similarCases.length > 0) {
    // Calcular la confianza basada en casos similares
    const avgConfidence = similarCases.reduce((acc, data) => {
      // Mayor peso a casos con estado fetal normal (1)
      return acc + (data.fetal_state === 1 ? 0.95 : 0.85);
    }, 0) / similarCases.length;

    confidence = avgConfidence;

    // Analizar patrones comunes
    const abnormalCases = similarCases.filter(data => data.fetal_state > 1);
    if (abnormalCases.length > 0) {
      if (abnormalCases.some(data => data.accelerations > 0)) {
        abnormalities.push("Aceleraciones detectadas");
      }
      if (abnormalCases.some(data => data.light_decelerations > 0)) {
        abnormalities.push("Deceleraciones leves");
      }
      if (abnormalCases.some(data => data.severe_decelerations > 0)) {
        abnormalities.push("Deceleraciones severas");
      }
      if (abnormalCases.some(data => data.abnormal_short_term_variability > 0)) {
        abnormalities.push("Variabilidad a corto plazo anormal");
      }
    }

    // Determinar el tipo de ritmo
    const mostCommonClass = getMostCommonValue(similarCases.map(data => data.pattern_class));
    rhythmType = getRhythmTypeFromClass(mostCommonClass);
  } else {
    // Si no hay casos similares, usar el análisis básico anterior
    if (patterns < 0.1) {
      rhythmType = "Ritmo sinusal normal";
      confidence = 0.92;
    } else if (patterns < 0.2) {
      rhythmType = "Taquicardia sinusal";
      abnormalities.push("Frecuencia cardíaca elevada");
      confidence = 0.85;
    } else {
      rhythmType = "Arritmia";
      abnormalities.push("Irregularidad en el ritmo");
      abnormalities.push("Posible fibrilación");
      confidence = 0.78;
    }
  }

  return {
    rhythmType,
    abnormalities,
    confidence
  };
}

function getMostCommonValue(arr: number[]): number {
  return arr.sort((a,b) =>
    arr.filter(v => v === a).length - arr.filter(v => v === b).length
  ).pop() || 1;
}

function getRhythmTypeFromClass(classCode: number): string {
  const rhythmTypes: {[key: number]: string} = {
    1: "Sueño tranquilo",
    2: "Sueño REM", 
    3: "Vigilia tranquila",
    4: "Vigilia activa",
    5: "Patrón de cambio",
    6: "Patrón acelerativo/decelerativo",
    7: "Patrón decelerativo",
    8: "Patrón decelerativo largo",
    9: "Patrón plano-sinusoidal",
    10: "Patrón sospechoso"
  };
  
  return rhythmTypes[classCode] || "Ritmo sinusal normal";
}