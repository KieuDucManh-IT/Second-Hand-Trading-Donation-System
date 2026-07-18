const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/;

const locationSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      default: "",
      validate: {
        validator: function (value) {
          // Cho phép password rỗng đối với tài khoản chỉ đăng nhập Google
          if (!value) return true;

          // Khi không sửa password thì không cần kiểm tra lại password đã hash
          if (!this.isModified("password")) return true;

          return PASSWORD_REGEX.test(value);
        },
        message:
          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt, không chứa khoảng trắng",
      },
    },
    role: {
      type: String,
      enum: ["user", "manager"],
      default: "user",
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    warningsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastWarningAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    locations: {
      type: [locationSchema],
      default: [],
    },
    googleId: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

userSchema.virtual("userName").get(function () {
  return this.fullName;
});

userSchema.virtual("userName").set(function (value) {
  if (!this.fullName) {
    this.fullName = value;
  }
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);