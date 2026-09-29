import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, coverImage } = req.body;

    if (!title || !caption || !rating || !coverImage) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // upload cover image to cloudinary
    const uploadResult = await cloudinary.uploader.upload(coverImage);

    const book = await Book.create({
      title,
      caption,
      rating,
      coverImage: uploadResult.secure_url,
      user: req.user._id,
    });

    res.status(201).json(book);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", protectRoute, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 }) // Sort books by created date in descending order
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalBooks = await Book.countDocuments();

    res.status(200).json({
      books,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
      totalBooks,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // check if the book belongs to the user
    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // delete image from cloudinary
    // example url : https://res.cloudinary.com/dfsn0p6cl/image/upload/v1757150873/Bookworm/jyl8u759dqu291sygz9k.jpg
    // extracted public ID: jyl8u759dqu291sygz9k
    if (
      book.coverImage &&
      book.coverImage.startsWith("https://res.cloudinary.com/")
    ) {
      try {
        // extract public ID from URL
        const imagePublicId = cloudinary
          .url(book.coverImage, { secure: true })
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(imagePublicId);
      } catch (error) {
        console.log(error);
      }
    }

    await book.deleteOne();
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(books);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      "user",
      "username profileImage",
    );

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
