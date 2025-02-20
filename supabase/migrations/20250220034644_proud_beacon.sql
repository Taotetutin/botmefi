/*
  # Schema for Image Analysis and CTG Data

  1. New Tables
    - `image_analyses`: Almacena los análisis de imágenes CTG
      - `id` (uuid, primary key)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, foreign key)
      - `confidence_score` (decimal)
      - `analysis_status` (text)

    - `ctg_data`: Almacena los datos extraídos del CTG
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, foreign key)
      - `baseline_value` (decimal)
      - `short_term_variability` (decimal)
      - `long_term_variability` (decimal)
      - `accelerations_count` (integer)
      - `early_decelerations` (integer)
      - `late_decelerations` (integer)
      - `variable_decelerations` (integer)
      - `mean_value` (decimal)
      - `histogram_data` (jsonb)
      - `classification_code` (integer)
      - `nsp_classification` (integer)

  2. Security
    - Enable RLS en todas las tablas
    - Políticas para permitir acceso solo a usuarios autenticados
*/

-- Tabla de Análisis de Imágenes
CREATE TABLE IF NOT EXISTS image_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  confidence_score decimal CHECK (confidence_score >= 0 AND confidence_score <= 1),
  analysis_status text CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_time interval
);

-- Tabla de Datos CTG
CREATE TABLE IF NOT EXISTS ctg_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES image_analyses(id) ON DELETE CASCADE,
  baseline_value decimal,
  short_term_variability decimal,
  long_term_variability decimal,
  accelerations_count integer,
  early_decelerations integer,
  late_decelerations integer,
  variable_decelerations integer,
  mean_value decimal,
  histogram_data jsonb,
  classification_code integer CHECK (classification_code BETWEEN 1 AND 10),
  nsp_classification integer CHECK (nsp_classification BETWEEN 1 AND 3),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE image_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctg_data ENABLE ROW LEVEL SECURITY;

-- Políticas para image_analyses
CREATE POLICY "Users can view own image analyses"
  ON image_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create image analyses"
  ON image_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para ctg_data
CREATE POLICY "Users can view own CTG data"
  ON ctg_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM image_analyses
      WHERE image_analyses.id = ctg_data.analysis_id
      AND image_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create CTG data"
  ON ctg_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM image_analyses
      WHERE image_analyses.id = ctg_data.analysis_id
      AND image_analyses.user_id = auth.uid()
    )
  );

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_image_analyses_user_id ON image_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ctg_data_analysis_id ON ctg_data(analysis_id);
CREATE INDEX IF NOT EXISTS idx_image_analyses_created_at ON image_analyses(created_at);