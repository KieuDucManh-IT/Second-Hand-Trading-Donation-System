const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/.+\@.+\..+/, "Please fill a valid email address"]
        },

        password: {
            type: String,
            required: true
        },

        sex: {
            type: String,
            enum: ["male", "female", "other"],
            default: "other"
        },

        birthday: {
            type: Date
        },

        role: {
            type: String,
            enum: ["user", "manager"],
            default: "user"
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        UML_Image: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);