const multer = require("multer");
const { BadRequestError } = require("../errors/BadRequestError");

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DEFAULT_ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const storage = multer.memoryStorage();

const multerConfig = {
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};

const multerInstance = multer(multerConfig);

const upload = {
  single: (fieldName) => {
    return (req, res, next) => {
      multerInstance.single(fieldName)(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
              return next(new BadRequestError("File size exceeds 20MB limit"));
            }
            if (err.code === "LIMIT_UNEXPECTED_FILE") {
              return next(new BadRequestError(`Unexpected file field: ${err.field}`));
            }
            return next(new BadRequestError(`File upload error: ${err.message}`));
          }
          return next(err);
        }
        next();
      });
    };
  },
};

const validateFileType = (allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES) => {
  return (req, res, next) => {
    if (!req.file) {
      return next(new BadRequestError("No file provided"));
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return next(
        new BadRequestError(
          `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`
        )
      );
    }

    next();
  };
};

module.exports = {
  upload,
  validateFileType,
  DEFAULT_ALLOWED_MIME_TYPES,
};

