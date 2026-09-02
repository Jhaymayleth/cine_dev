import { Op } from 'sequelize'
import { Router } from 'express'
import { City, Cinema, CinemaFunction, Country, Movie, Promotion, Seat, SeatLock } from '../models/index.js'

export const catalogRouter = Router()

const movieView = (movie: any) => ({ id: String(movie.id), title: movie.title, description: movie.synopsis, synopsis: movie.synopsis, genres: movie.genres, duration: `${Math.floor(movie.durationMin / 60)}h ${movie.durationMin % 60}min`, durationMin: movie.durationMin, rating: movie.classification, classification: movie.classification, score: movie.rating, posterUrl: movie.posterUrl, image: movie.posterUrl, trailerUrl: movie.trailerUrl, format: '2D', status: movie.status === 'ACTIVE' ? 'Today' : movie.status })
const functionView = (item: any) => ({ id: String(item.id), movieId: String(item.movieId), startsAt: item.startsAt, roomId: String(item.id), roomName: item.roomName, cinemaId: String(item.cinemaId), format: item.format, language: item.language, audioType: item.language, basePrice: Number(item.basePrice), availableSeats: item.capacity, isSoldOut: false, status: item.status })

catalogRouter.get('/countries', async (_request, response) => response.json(await Country.findAll({ order: [['name', 'ASC']] })))
catalogRouter.get('/countries/all_countries', async (_request, response) => response.json(await Country.findAll({ order: [['name', 'ASC']] })))
catalogRouter.get('/countries/:countryId/cities', async (request, response) => response.json(await City.findAll({ where: { countryId: Number(request.params.countryId) } })))
catalogRouter.get('/cities/:cityId/cinemas', async (request, response) => response.json(await Cinema.findAll({ where: { cityId: Number(request.params.cityId) } })))

catalogRouter.get('/movies', async (_request, response) => response.json((await Movie.findAll({ order: [['title', 'ASC']] })).map(movieView)))
catalogRouter.get('/movies/today', async (request, response) => response.json(await billboard(request.query.cityId as string | undefined)))
catalogRouter.get('/movies/weekly', async (request, response) => response.json(await billboard(request.query.cityId as string | undefined)))
catalogRouter.get('/movies/filter', async (request, response) => response.json(await billboard(request.query.cityId as string | undefined)))
catalogRouter.get('/movies/:movieId/functions', async (request, response) => {
  const where: any = { movieId: Number(request.params.movieId), status: 'ACTIVE', startsAt: { [Op.gt]: new Date() } }
  if (request.query.cityId) {
    const cinemas = await Cinema.findAll({ where: { cityId: Number(request.query.cityId) }, attributes: ['id'] })
    where.cinemaId = { [Op.in]: cinemas.map((cinema: any) => cinema.id) }
  }
  const functions = await CinemaFunction.findAll({ where, order: [['startsAt', 'ASC']] })
  return response.json(functions.map(functionView))
})
catalogRouter.get('/movies/:movieId', async (request, response) => {
  const movie = await Movie.findByPk(Number(request.params.movieId))
  if (!movie) return response.status(404).json({ message: 'Pelicula no encontrada' })
  return response.json(movieView(movie))
})
catalogRouter.get('/movies/:movieId/recommendations', async (_request, response) => response.json([]))

catalogRouter.get('/functions/:functionId', async (request, response) => {
  const item: any = await CinemaFunction.findByPk(Number(request.params.functionId))
  if (!item || item.status !== 'ACTIVE' || new Date(item.startsAt) <= new Date()) return response.status(404).json({ message: 'Funcion no disponible' })
  return response.json(functionView(item))
})
catalogRouter.get('/functions/:functionId/prices', async (request, response) => {
  const item: any = await CinemaFunction.findByPk(Number(request.params.functionId))
  if (!item) return response.status(404).json({ message: 'Funcion no encontrada' })
  return response.json({ functionId: item.id, basePrice: Number(item.basePrice), roomExtraPrice: 0, finalPrice: Number(item.basePrice) })
})

catalogRouter.get('/promotions', async (_request, response) => response.json(await Promotion.findAll({ where: { active: true } })))
catalogRouter.get('/promotions/active', async (_request, response) => response.json(await Promotion.findAll({ where: { active: true } })))
catalogRouter.get('/promotions/:id', async (request, response) => response.json(await Promotion.findByPk(Number(request.params.id))))

catalogRouter.get('/seats', async (request, response) => response.json(await Seat.findAll({ where: { functionId: Number(request.query.functionId) }, order: [['row', 'ASC'], ['number', 'ASC']] })))
catalogRouter.get('/seatLocks', async (request, response) => response.json(await SeatLock.findAll({ where: { functionId: Number(request.query.functionId), expiresAt: { [Op.gt]: new Date() } } })))

async function billboard(cityId?: string) {
  const where: any = { status: 'ACTIVE', startsAt: { [Op.gt]: new Date() } }
  if (cityId) {
    const cinemas = await Cinema.findAll({ where: { cityId: Number(cityId) }, attributes: ['id'] })
    where.cinemaId = { [Op.in]: cinemas.map((cinema: any) => cinema.id) }
  }
  const functions: any[] = await CinemaFunction.findAll({ where, include: [{ model: Movie, as: 'movie' }], order: [['startsAt', 'ASC']] })
  const grouped = new Map<number, any>()
  for (const item of functions) {
    const movie: any = item.get('movie')
    if (movie && !grouped.has(movie.id)) grouped.set(movie.id, movieView(movie))
  }
  return [...grouped.values()]
}
