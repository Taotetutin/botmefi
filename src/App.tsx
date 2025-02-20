import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle, Image as ImageIcon, Brain, Cpu, Wand2, Heart, Activity } from 'lucide-react';
import { analyzeECGImage, AnalysisResult } from './utils/imageAnalysis';

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImage(imageData);
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);

      const capturedImage = canvas.toDataURL('image/jpeg');
      setImage(capturedImage);
      analyzeImage(capturedImage);

      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setError('Error al acceder a la cámara. Por favor, verifica los permisos.');
    }
  };

  const analyzeImage = async (imageData: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeECGImage(imageData);
      setAnalysis(result);
    } catch (err) {
      setError('Error al analizar la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="relative bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-blue-500/30 backdrop-blur-sm">
        {/* Floating Robot Assistant */}
        <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 w-40 h-40 animate-[float_3s_ease-in-out_infinite]">
          {/* Robot Body */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-200 to-blue-400 rounded-3xl transform -skew-y-2 animate-[hover_3s_ease-in-out_infinite]">
            {/* Robot Face */}
            <div className="absolute inset-4 bg-gray-800 rounded-2xl">
              {/* Robot Eyes */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-6">
                <div className="w-6 h-6 rounded-full bg-cyan-400 animate-[blink_4s_ease-in-out_infinite]">
                  <div className="w-2 h-2 bg-white rounded-full ml-3 mt-1"></div>
                </div>
                <div className="w-6 h-6 rounded-full bg-cyan-400 animate-[blink_4s_ease-in-out_infinite]">
                  <div className="w-2 h-2 bg-white rounded-full ml-3 mt-1"></div>
                </div>
              </div>
              {/* Robot Mouth */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-cyan-400/50 rounded-full"></div>
            </div>
          </div>
          {/* Robot Headphones */}
          <div className="absolute -left-4 top-4 w-4 h-12 bg-gray-700 rounded-l-full"></div>
          <div className="absolute -right-4 top-4 w-4 h-12 bg-gray-700 rounded-r-full"></div>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-20 h-3 bg-gray-700 rounded-full"></div>
          {/* Floating Shadow */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black/20 rounded-full blur-md animate-[shadow_3s_ease-in-out_infinite]"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-6 -left-6 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
          <Brain className="text-white" size={24} />
        </div>
        <div className="absolute -top-6 -right-6 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center animate-pulse delay-75">
          <Cpu className="text-white" size={24} />
        </div>

        <div className="mt-16">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2 text-center">
            Asistente de Monitoreo IA
          </h1>
          <p className="text-gray-400 text-center mb-8">Sistema avanzado de reconocimiento de patrones médicos</p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
              >
                <Upload size={20} />
                Subir Imagen
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={handleCameraCapture}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 shadow-lg"
              >
                <Camera size={20} />
                Usar Cámara
              </button>
            </div>

            {image && (
              <div className="relative rounded-xl overflow-hidden bg-gray-700 border-2 border-blue-500/30">
                <img 
                  src={image} 
                  alt="Monitoreo subido" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-pulse"></div>
                  <div className="absolute inset-2 rounded-full border-t-4 border-blue-500 animate-spin"></div>
                  <Wand2 size={24} className="absolute inset-0 m-auto text-blue-400" />
                </div>
                <p className="mt-4 text-blue-400 animate-pulse">Procesando análisis de imagen...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 text-red-400 bg-red-900/30 p-4 rounded-xl border border-red-500/30">
                <AlertTriangle size={24} className="text-red-500 animate-pulse" />
                <p>{error}</p>
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-4">
                <div className="bg-green-900/30 p-6 rounded-xl border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={24} className="text-green-500 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-400">Análisis Completado</h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Heart className="text-red-400" size={20} />
                          <span className="text-gray-300">Frecuencia Cardíaca: {analysis.heartRate} BPM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="text-blue-400" size={20} />
                          <span className="text-gray-300">Tipo de Ritmo: {analysis.rhythmType}</span>
                        </div>
                        <div className="text-gray-400 text-sm mt-2">
                          Confianza del análisis: {Math.round(analysis.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {analysis.abnormalities.length > 0 && (
                  <div className="bg-yellow-900/30 p-6 rounded-xl border border-yellow-500/30">
                    <h4 className="text-yellow-400 font-semibold mb-2">Hallazgos:</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {analysis.abnormalities.map((abnormality, index) => (
                        <li key={index}>{abnormality}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!image && (
              <div className="text-center p-8 border-2 border-dashed border-blue-500/30 rounded-xl bg-blue-900/10">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse"></div>
                  <ImageIcon size={32} className="absolute inset-0 m-auto text-blue-400" />
                </div>
                <p className="text-gray-400">
                  Sube o captura una imagen de monitoreo médico para comenzar el análisis con IA
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;