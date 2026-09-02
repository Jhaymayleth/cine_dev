import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'CLIENT' },
}, { tableName: 'users', timestamps: true })

export const Country = sequelize.define('Country', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING(2), allowNull: false, unique: true },
}, { tableName: 'countries', timestamps: false })

export const City = sequelize.define('City', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  countryId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'cities', timestamps: false })

export const Cinema = sequelize.define('Cinema', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cityId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'cinemas', timestamps: false })

export const Movie = sequelize.define('Movie', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  synopsis: { type: DataTypes.TEXT, allowNull: false },
  classification: { type: DataTypes.STRING, allowNull: false },
  durationMin: { type: DataTypes.INTEGER, allowNull: false },
  posterUrl: { type: DataTypes.STRING, allowNull: true },
  trailerUrl: { type: DataTypes.STRING, allowNull: true },
  genres: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'ACTIVE' },
  rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
}, { tableName: 'movies', timestamps: true })

export const CinemaFunction = sequelize.define('CinemaFunction', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  movieId: { type: DataTypes.INTEGER, allowNull: false },
  cinemaId: { type: DataTypes.INTEGER, allowNull: false },
  roomName: { type: DataTypes.STRING, allowNull: false },
  startsAt: { type: DataTypes.DATE, allowNull: false },
  format: { type: DataTypes.STRING, allowNull: false },
  language: { type: DataTypes.STRING, allowNull: false },
  basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 80 },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'ACTIVE' },
}, { tableName: 'functions', timestamps: false })

export const Seat = sequelize.define('Seat', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  functionId: { type: DataTypes.INTEGER, allowNull: false },
  row: { type: DataTypes.STRING(2), allowNull: false },
  number: { type: DataTypes.INTEGER, allowNull: false },
  seatType: { type: DataTypes.STRING, allowNull: false, defaultValue: 'STANDARD' },
}, { tableName: 'seats', timestamps: false })

export const SeatLock = sequelize.define('SeatLock', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  seatId: { type: DataTypes.INTEGER, allowNull: false },
  functionId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'seat_locks', timestamps: true })

export const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
}, { tableName: 'carts', timestamps: true })

export const CartItem = sequelize.define('CartItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cartId: { type: DataTypes.INTEGER, allowNull: false },
  functionId: { type: DataTypes.INTEGER, allowNull: false },
  seatId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'cart_items', timestamps: false })

export const Snack = sequelize.define('Snack', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  imageUrl: { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: false, defaultValue: 'COMBO' },
}, { tableName: 'snacks', timestamps: false })

export const CartSnack = sequelize.define('CartSnack', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cartId: { type: DataTypes.INTEGER, allowNull: false },
  snackId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
}, { tableName: 'cart_snacks', timestamps: false })

export const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PENDING' },
}, { tableName: 'orders', timestamps: true })

export const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  method: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'APPROVED' },
  transactionId: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { tableName: 'payments', timestamps: true })

export const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  functionId: { type: DataTypes.INTEGER, allowNull: false },
  seatId: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  qrCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'VALID' },
}, { tableName: 'tickets', timestamps: false })

export const Promotion = sequelize.define('Promotion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  discount: { type: DataTypes.FLOAT, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  validFrom: { type: DataTypes.DATE, allowNull: false },
  validTo: { type: DataTypes.DATE, allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'promotions', timestamps: false })

export const initModels = (): void => {
  City.belongsTo(Country, { foreignKey: 'countryId', as: 'country' })
  Cinema.belongsTo(City, { foreignKey: 'cityId', as: 'city' })
  CinemaFunction.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' })
  CinemaFunction.belongsTo(Cinema, { foreignKey: 'cinemaId', as: 'cinema' })
  Seat.belongsTo(CinemaFunction, { foreignKey: 'functionId', as: 'function' })
  Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' })
  CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' })
  CartItem.belongsTo(CinemaFunction, { foreignKey: 'functionId', as: 'function' })
  CartItem.belongsTo(Seat, { foreignKey: 'seatId', as: 'seat' })
  Cart.hasMany(CartSnack, { foreignKey: 'cartId', as: 'snacks' })
  CartSnack.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' })
  CartSnack.belongsTo(Snack, { foreignKey: 'snackId', as: 'snack' })
  Order.hasMany(Ticket, { foreignKey: 'orderId', as: 'tickets' })
  Ticket.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
}
