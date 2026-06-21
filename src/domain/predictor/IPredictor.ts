import type { PredictionInput, PredictionResult } from '../types'

export interface IPredictor {
  predict(input: PredictionInput): PredictionResult
}
