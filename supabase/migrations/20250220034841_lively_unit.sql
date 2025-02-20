/*
  # Schema for CTG Reference Data

  1. New Tables
    - `ctg_reference_data`: Almacena datos de referencia de CTG
      - `id` (uuid, primary key)
      - `file_name` (text)
      - `date` (date)
      - `baseline_value` (decimal)
      - `accelerations` (integer)
      - `fetal_movement` (integer)
      - `uterine_contractions` (integer)
      - `light_decelerations` (integer)
      - `severe_decelerations` (integer)
      - `prolongued_decelerations` (integer)
      - `abnormal_short_term_variability` (decimal)
      - `mean_short_term_variability` (decimal)
      - `abnormal_long_term_variability` (decimal)
      - `mean_long_term_variability` (decimal)
      - `histogram_width` (decimal)
      - `histogram_min` (decimal)
      - `histogram_max` (decimal)
      - `histogram_peaks` (integer)
      - `histogram_zeros` (integer)
      - `histogram_mode` (decimal)
      - `histogram_mean` (decimal)
      - `histogram_median` (decimal)
      - `histogram_variance` (decimal)
      - `histogram_tendency` (decimal)
      - `pattern_class` (integer)
      - `fetal_state` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Políticas para permitir solo lectura a usuarios autenticados
*/

-- Tabla de Datos de Referencia CTG
CREATE TABLE IF NOT EXISTS ctg_reference_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text,
  date date,
  baseline_value decimal,
  accelerations integer,
  fetal_movement integer,
  uterine_contractions integer,
  light_decelerations integer,
  severe_decelerations integer,
  prolongued_decelerations integer,
  abnormal_short_term_variability decimal,
  mean_short_term_variability decimal,
  abnormal_long_term_variability decimal,
  mean_long_term_variability decimal,
  histogram_width decimal,
  histogram_min decimal,
  histogram_max decimal,
  histogram_peaks integer,
  histogram_zeros integer,
  histogram_mode decimal,
  histogram_mean decimal,
  histogram_median decimal,
  histogram_variance decimal,
  histogram_tendency decimal,
  pattern_class integer CHECK (pattern_class BETWEEN 1 AND 10),
  fetal_state integer CHECK (fetal_state BETWEEN 1 AND 3),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE ctg_reference_data ENABLE ROW LEVEL SECURITY;

-- Política de solo lectura para usuarios autenticados
CREATE POLICY "Users can read CTG reference data"
  ON ctg_reference_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ctg_reference_pattern_class ON ctg_reference_data(pattern_class);
CREATE INDEX IF NOT EXISTS idx_ctg_reference_fetal_state ON ctg_reference_data(fetal_state);
CREATE INDEX IF NOT EXISTS idx_ctg_reference_baseline ON ctg_reference_data(baseline_value);