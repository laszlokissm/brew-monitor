import { Router, Request, Response } from 'express'
import { RecipeService, CreateRecipeInput, UpdateRecipeInput } from '../RecipeService'

function parseId(param: string | string[] | undefined): number {
  if (!param) return NaN
  const raw = Array.isArray(param) ? param[0] : param
  return parseInt(raw, 10)
}

export function createRecipeRouter(recipeService: RecipeService): Router {
  const router = Router()

  // GET /api/recipes - List all recipes
  router.get('/', (_req: Request, res: Response) => {
    try {
      const recipes = recipeService.getAllRecipes()
      res.json(recipes)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recipes', details: String(error) })
    }
  })

  // GET /api/recipes/:id - Get a single recipe by ID
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid recipe ID' })
        return
      }

      const recipe = recipeService.getRecipeById(id)
      if (!recipe) {
        res.status(404).json({ error: `Recipe with ID ${id} not found` })
        return
      }

      res.json(recipe)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recipe', details: String(error) })
    }
  })

  // POST /api/recipes - Create a new recipe
  router.post('/', (req: Request, res: Response) => {
    try {
      const body = req.body as CreateRecipeInput

      if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
        res.status(400).json({ error: 'Recipe name is required' })
        return
      }

      const created = recipeService.createRecipe(body)
      res.status(201).json(created)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create recipe', details: String(error) })
    }
  })

  // PUT /api/recipes/:id - Update an existing recipe
  router.put('/:id', (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid recipe ID' })
        return
      }

      const body = req.body as UpdateRecipeInput
      const updated = recipeService.updateRecipe(id, body)

      if (!updated) {
        res.status(404).json({ error: `Recipe with ID ${id} not found` })
        return
      }

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Failed to update recipe', details: String(error) })
    }
  })

  // DELETE /api/recipes/:id - Delete a recipe
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id)
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid recipe ID' })
        return
      }

      const deleted = recipeService.deleteRecipe(id)
      if (!deleted) {
        res.status(404).json({ error: `Recipe with ID ${id} not found` })
        return
      }

      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete recipe', details: String(error) })
    }
  })

  return router
}
