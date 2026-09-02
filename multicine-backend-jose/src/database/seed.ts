import { Op } from 'sequelize'
import { City, Cinema, CinemaFunction, Country, Movie, Promotion, Seat, Snack } from '../models/index.js'

export const seedDatabase = async (): Promise<void> => {
  const [country] = await Country.findOrCreate({ where: { code: 'CO' }, defaults: { name: 'Colombia', code: 'CO' } })
  const [city] = await City.findOrCreate({ where: { name: 'Medellin', countryId: country.get('id') }, defaults: { name: 'Medellin', countryId: country.get('id') as number } })
  const [cinema] = await Cinema.findOrCreate({ where: { name: 'Multicine Centro', cityId: city.get('id') }, defaults: { name: 'Multicine Centro', cityId: city.get('id') as number, address: 'Calle 10 # 20-30' } })
  const [movie] = await Movie.findOrCreate({ where: { title: 'La ultima funcion' }, defaults: { title: 'La ultima funcion', synopsis: 'Una historia que comienza cuando se apagan las luces.', classification: '13+', durationMin: 120, posterUrl: null, trailerUrl: null, genres: ['Drama', 'Aventura'], status: 'ACTIVE', rating: 4.5 } })

  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const [cinemaFunction] = await CinemaFunction.findOrCreate({ where: { movieId: movie.get('id'), cinemaId: cinema.get('id'), startsAt: { [Op.gt]: new Date() } }, defaults: { movieId: movie.get('id') as number, cinemaId: cinema.get('id') as number, roomName: 'Sala 1', startsAt, format: '2D', language: 'Español', basePrice: 18000, capacity: 40, status: 'ACTIVE' } })

  const seatCount = await Seat.count({ where: { functionId: cinemaFunction.get('id') } })
  if (seatCount === 0) {
    const seats = Array.from({ length: 40 }, (_, index) => ({ functionId: cinemaFunction.get('id') as number, row: String.fromCharCode(65 + Math.floor(index / 10)), number: (index % 10) + 1, seatType: 'STANDARD' }))
    await Seat.bulkCreate(seats)
  }

  await Promotion.findOrCreate({ where: { code: 'CINE10' }, defaults: { title: 'Descuento de bienvenida', description: '10% de descuento en entradas seleccionadas.', discount: 10, code: 'CINE10', validFrom: new Date(Date.now() - 86400000), validTo: new Date(Date.now() + 30 * 86400000), active: true } })
  await Snack.findOrCreate({ where: { name: 'Combo clasico' }, defaults: { name: 'Combo clasico', description: 'Palomitas medianas y bebida.', price: 12000, category: 'COMBO', imageUrl: null } })
}
