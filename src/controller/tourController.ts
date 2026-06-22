import { Request, Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { TourModel } from "../models/tourModel"

// PUBLIC: get all active tours with search, filter, pagination
export const getAllTours = async (req: Request, res: Response) => {
  try {
    const { search, category, page = 1, limit = 9 } = req.query

    const filter: any = { isActive: true }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ]
    }

    if (category) {
      filter.category = category
    }

    const skip = (Number(page) - 1) * Number(limit)
    const total = await TourModel.countDocuments(filter)
    const tours = await TourModel.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })

    return res.status(200).json({
      message: "Tours fetched",
      data: {
        tours,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch tours" })
  }
}

// PUBLIC: get single tour by id
export const getTourById = async (req: Request, res: Response) => {
  try {
    const tour = await TourModel.findById(req.params.id)
    if (!tour) return res.status(404).json({ message: "Tour not found" })
    return res.status(200).json({ message: "Tour fetched", data: tour })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch tour" })
  }
}

// ADMIN: get all tours including inactive
export const getAdminTours = async (req: AuthRequest, res: Response) => {
  try {
    const tours = await TourModel.find().sort({ createdAt: -1 })
    return res.status(200).json({ message: "All tours fetched", data: tours })
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch tours" })
  }
}

// ADMIN: create a new tour
export const createTour = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, price, duration,
      location, image, maxGroupSize, availableSlots,
      itinerary, category
    } = req.body

    if (!title || !description || !price || !duration || !location || !maxGroupSize || !availableSlots) {
      return res.status(400).json({ message: "All required fields must be filled" })
    }

    const tour = await TourModel.create({
      title,
      description,
      price: Number(price),
      duration: Number(duration),
      location,
      image: image || "",
      maxGroupSize: Number(maxGroupSize),
      availableSlots: Number(availableSlots),
      itinerary: itinerary || [],
      category: category || "General"
    })

    return res.status(201).json({ message: "Tour created", data: tour })
  } catch (err) {
    return res.status(500).json({ message: "Failed to create tour" })
  }
}

// ADMIN: update a tour
export const updateTour = async (req: AuthRequest, res: Response) => {
  try {
    const tour = await TourModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!tour) return res.status(404).json({ message: "Tour not found" })
    return res.status(200).json({ message: "Tour updated", data: tour })
  } catch (err) {
    return res.status(500).json({ message: "Failed to update tour" })
  }
}

// ADMIN: delete a tour
export const deleteTour = async (req: AuthRequest, res: Response) => {
  try {
    const tour = await TourModel.findByIdAndDelete(req.params.id)
    if (!tour) return res.status(404).json({ message: "Tour not found" })
    return res.status(200).json({ message: "Tour deleted" })
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete tour" })
  }
}