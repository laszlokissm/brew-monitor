import { Database as DatabaseType } from 'better-sqlite3'
import { DatabaseService } from './DatabaseService'
import { Recipe, RecipeStep } from './types'

export interface CreateRecipeInput {
  name: string
  description?: string
  steps?: Array<{
    stepOrder: number
    name: string
    targetTemperature: number
    durationMinutes: number
  }>
}

export interface UpdateRecipeInput {
  name?: string
  description?: string
  steps?: Array<{
    stepOrder: number
    name: string
    targetTemperature: number
    durationMinutes: number
  }>
}

interface DbRecipeRow {
  id: number
  name: string
  description: string | null
}

interface DbStepRow {
  id: number
  recipe_id: number
  step_order: number
  name: string
  target_temperature: number
  duration_minutes: number
}

export class RecipeService {
  private db: DatabaseType

  constructor(databaseService: DatabaseService) {
    this.db = databaseService.getDb()
  }

  /**
   * Retrieves all recipes along with their steps
   */
  public getAllRecipes(): Recipe[] {
    const recipeRows = this.db
      .prepare('SELECT id, name, description FROM recipes ORDER BY id DESC')
      .all() as DbRecipeRow[]

    return recipeRows.map((row) => this.mapRecipe(row))
  }

  /**
   * Retrieves a single recipe by its ID
   */
  public getRecipeById(id: number): Recipe | undefined {
    const row = this.db
      .prepare('SELECT id, name, description FROM recipes WHERE id = ?')
      .get(id) as DbRecipeRow | undefined

    if (!row) return undefined
    return this.mapRecipe(row)
  }

  /**
   * Creates a new recipe and its steps in a single atomic transaction
   */
  public createRecipe(input: CreateRecipeInput): Recipe {
    const insertRecipe = this.db.prepare('INSERT INTO recipes (name, description) VALUES (?, ?)')
    const insertStep = this.db.prepare(`
      INSERT INTO recipe_steps (recipe_id, step_order, name, target_temperature, duration_minutes)
      VALUES (?, ?, ?, ?, ?)
    `)

    const executeTransaction = this.db.transaction((data: CreateRecipeInput) => {
      const info = insertRecipe.run(data.name, data.description ?? null)
      const recipeId = Number(info.lastInsertRowid)

      if (data.steps && data.steps.length > 0) {
        for (const step of data.steps) {
          insertStep.run(
            recipeId,
            step.stepOrder,
            step.name,
            step.targetTemperature,
            step.durationMinutes
          )
        }
      }

      return recipeId
    })

    const createdId = executeTransaction(input)
    const createdRecipe = this.getRecipeById(createdId)
    if (!createdRecipe) {
      throw new Error(`Failed to retrieve recipe after creation: ID ${createdId}`)
    }
    return createdRecipe
  }

  /**
   * Updates recipe metadata and optionally replaces its steps atomically
   */
  public updateRecipe(id: number, input: UpdateRecipeInput): Recipe | undefined {
    const existing = this.getRecipeById(id)
    if (!existing) return undefined

    const updateRecipeStmt = this.db.prepare(`
      UPDATE recipes 
      SET name = COALESCE(?, name), description = COALESCE(?, description) 
      WHERE id = ?
    `)
    const deleteStepsStmt = this.db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?')
    const insertStepStmt = this.db.prepare(`
      INSERT INTO recipe_steps (recipe_id, step_order, name, target_temperature, duration_minutes)
      VALUES (?, ?, ?, ?, ?)
    `)

    const executeTransaction = this.db.transaction(() => {
      updateRecipeStmt.run(input.name ?? null, input.description ?? null, id)

      if (input.steps !== undefined) {
        deleteStepsStmt.run(id)
        for (const step of input.steps) {
          insertStepStmt.run(
            id,
            step.stepOrder,
            step.name,
            step.targetTemperature,
            step.durationMinutes
          )
        }
      }
    })

    executeTransaction()
    return this.getRecipeById(id)
  }

  /**
   * Deletes a recipe (associated steps are deleted automatically via CASCADE)
   */
  public deleteRecipe(id: number): boolean {
    const result = this.db.prepare('DELETE FROM recipes WHERE id = ?').run(id)
    return result.changes > 0
  }

  private mapRecipe(row: DbRecipeRow): Recipe {
    const steps = this.getStepsForRecipe(row.id)
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      steps
    }
  }

  private getStepsForRecipe(recipeId: number): RecipeStep[] {
    const stepRows = this.db
      .prepare(
        `SELECT id, recipe_id, step_order, name, target_temperature, duration_minutes
         FROM recipe_steps
         WHERE recipe_id = ?
         ORDER BY step_order ASC`
      )
      .all(recipeId) as DbStepRow[]

    return stepRows.map((step) => ({
      id: step.id,
      recipeId: step.recipe_id,
      stepOrder: step.step_order,
      name: step.name,
      targetTemperature: step.target_temperature,
      durationMinutes: step.duration_minutes
    }))
  }
}
