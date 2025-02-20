/*
  # Schema for Medical Analysis System

  1. New Tables
    - `medical_analyses`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `image_url` (text)
      - `heart_rate` (integer)
      - `rhythm_type` (text)
      - `confidence` (decimal)
      - `abnormalities` (text[])
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `medical_analyses` table
    - Add policies for authenticated users to:
      - Read their own analyses
      - Create new analyses
*/

CREATE TABLE IF NOT EXISTS medical_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  image_url text NOT NULL,
  heart_rate integer NOT NULL,
  rhythm_type text NOT NULL,
  confidence decimal NOT NULL,
  abnormalities text[] DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE medical_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analyses"
  ON medical_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create analyses"
  ON medical_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);